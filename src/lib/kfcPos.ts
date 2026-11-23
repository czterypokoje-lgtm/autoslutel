import 'server-only';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { seesPrices, type CrmRole, type CrmUser } from '@/lib/crmSession';
import { SITE_CONFIG } from '@/config/site.config';
import { findArticlesByScan, StockError } from '@/lib/kfcInventory';

/**
 * Kassa (point of sale): the shop counter.
 *
 * Everything that changes money or stock goes through the RPCs of migrations
 * 0129 and 0136 (kfc_pos_open / kfc_pos_sale / kfc_pos_return /
 * kfc_pos_cash_move / kfc_pos_close), so each action is one transaction.
 * Prices on the till are shelf prices incl. VAT, in integer cents.
 *
 * Who may do what (enforced here and in the API route):
 *   - every till role (owner, kantoor, magazijn) opens, sells, puts cash IN and closes;
 *   - a return and cash OUT need an office role (seesPrices);
 *   - only office roles may change a price or give a discount; for everyone
 *     else the price is the article's sale_price_cents, and an article without
 *     a price cannot be sold by them.
 */

/** Who may work the till: the office and the shop floor, not technicians or packers. */
export const POS_ROLES: readonly CrmRole[] = ['owner', 'kantoor', 'magazijn'];
export const canUsePos = (user: CrmUser | null): user is CrmUser => !!user?.role && POS_ROLES.includes(user.role);
/** Returns, cash out and price overrides: office only. */
export const canManagePos = (user: CrmUser): boolean => seesPrices(user);

export const REGISTER = 'winkel';
export type PayMethod = 'cash' | 'pin' | 'other';
export type RefundMethod = 'cash' | 'pin';

export interface PosSession {
  id: string; register: string; openedAt: string; openingFloatCents: number;
  closedAt: string | null; expectedCashCents: number | null; countedCashCents: number | null; note: string | null;
  expectedPinCents: number | null; countedPinCents: number | null;
  cashDifferenceCents: number | null; pinDifferenceCents: number | null; zNumber: number | null;
}

export interface PosArticle {
  code: string; name: string; sku: string; ean: string[]; category: string;
  priceCents: number | null; onHand: number;
}

export interface PosLineInput { article: string; quantity: number; unitPriceCents: number; discountCents: number; vatRate: number }
export interface PosPaymentInput { method: PayMethod; tenderedCents: number }

export interface PosSummary {
  session: PosSession;
  /** Sales (credit notes not counted). */
  sales: number;
  returns: number;
  /** Net turnover incl. VAT: sales minus refunds. */
  totalCents: number;
  /** Net per method: sales minus refunds. */
  byMethod: Record<PayMethod, number>;
  refunds: Record<RefundMethod, number>;
  cashInCents: number;
  cashOutCents: number;
  expectedCashCents: number;
  expectedPinCents: number;
  recent: { id: string; number: string; totalCents: number; time: string; client: string; credit: boolean }[];
}

const admin = () => createSupabaseAdminClient();

const RPC_MESSAGES: Record<string, [string, number]> = {
  KFC_POS_CLOSED: ['De kassa is gesloten. Open eerst de kassa.', 409],
  KFC_POS_BAD_LINES: ['Controleer de regels: aantal, prijs, korting en btw.', 400],
  KFC_POS_BAD_PAYMENTS: ['Controleer de betaling.', 400],
  KFC_POS_OVERPAID: ['Pin of overig is meer dan het totaal. Alleen contant mag meer (wisselgeld).', 400],
  KFC_POS_UNDERPAID: ['Er is nog niet genoeg betaald.', 400],
  KFC_POS_UNKNOWN_ARTICLE: ['Onbekend artikel in de bon.', 400],
  KFC_POS_BAD_KEY: ['Ongeldige verkoop-id. Probeer opnieuw.', 400],
  KFC_POS_BAD_FLOAT: ['Ongeldig startbedrag.', 400],
  KFC_POS_BAD_PIN_COUNT: ['Vul het totaal van de pinautomaat in (0 als er niet gepind is).', 400],
  KFC_POS_BAD_COUNT: ['Ongeldig geteld bedrag.', 400],
  KFC_POS_NO_SESSION: ['Kassasessie niet gevonden.', 404],
  KFC_POS_NOT_SELLABLE: ['Dit artikel ligt niet op een verkoopbare schapplaats (alleen in een bus of in quarantaine). Zet het eerst op een schap.', 409],
  KFC_POS_NO_RECEIPT: ['Bon niet gevonden. Alleen een kassabon kan aan de kassa retour.', 404],
  KFC_POS_BAD_RETURN_LINES: ['Controleer de retourregels: kies een regel van deze bon en een aantal.', 400],
  KFC_POS_RETURN_EXCEEDS: ['Er gaat meer retour dan er op de bon nog open staat.', 409],
  KFC_POS_BAD_REFUND_METHOD: ['Kies hoe het geld terug gaat: contant of PIN.', 400],
  KFC_POS_RETURN_LOCATION: ['Kies een magazijnlocatie waar het artikel terug komt (geen bus).', 400],
  KFC_POS_CASH_SHORT: ['Er zit volgens de kassa niet genoeg contant geld in de la.', 409],
  KFC_POS_BAD_CASH_MOVE: ['Ongeldig bedrag voor kas in/uit.', 400],
  KFC_POS_REASON_REQUIRED: ['Vul een reden in (minstens 3 tekens).', 400],
  KFC_HAS_LOCATED_STOCK: ['Dit artikel heeft voorraad op een locatie; boek eerst een telling.', 409],
  KFC_STOCK_RESERVED_FOR_JOB: ['Deze voorraad is gereserveerd voor een klus.', 409],
};

function posError(error: { message: string }): StockError {
  for (const [code, [message, status]] of Object.entries(RPC_MESSAGES)) {
    if (error.message.includes(code)) return new StockError(message, status);
  }
  return new StockError(`Kassa mislukt: ${error.message}`, 500);
}

const intOrNull = (v: unknown): number | null => (typeof v === 'number' ? v : null);
const cents = (v: unknown) => Math.round(Number(v ?? 0) * 100);

function toSession(row: Record<string, unknown>): PosSession {
  return {
    id: row.id as string, register: row.register as string, openedAt: row.opened_at as string,
    openingFloatCents: row.opening_float_cents as number, closedAt: (row.closed_at as string | null) ?? null,
    expectedCashCents: intOrNull(row.expected_cash_cents), countedCashCents: intOrNull(row.counted_cash_cents),
    note: (row.note as string | null) ?? null,
    expectedPinCents: intOrNull(row.expected_pin_cents), countedPinCents: intOrNull(row.counted_pin_cents),
    cashDifferenceCents: intOrNull(row.cash_difference_cents), pinDifferenceCents: intOrNull(row.pin_difference_cents),
    zNumber: intOrNull(row.z_number),
  };
}

/** The seller on the receipt and invoice: our own company details. */
export function posBiller() {
  return {
    name: SITE_CONFIG.fullName, street: SITE_CONFIG.address.street || null, postcode: SITE_CONFIG.address.postal || null,
    city: SITE_CONFIG.address.city || null, email: SITE_CONFIG.email || null, phone: SITE_CONFIG.phone || null,
    kvk: SITE_CONFIG.kvk || null, btw: SITE_CONFIG.btw || null, iban: SITE_CONFIG.iban || null,
  };
}

export async function openSession(): Promise<PosSession | null> {
  const { data, error } = await admin().from('kfc_pos_sessions').select('*')
    .eq('register', REGISTER).is('closed_at', null).maybeSingle();
  if (error) throw posError(error);
  return data ? toSession(data) : null;
}

export async function getSession(id: string): Promise<PosSession | null> {
  if (!UUID.test(id)) return null;
  const { data, error } = await admin().from('kfc_pos_sessions').select('*').eq('id', id).maybeSingle();
  if (error) throw posError(error);
  return data ? toSession(data) : null;
}

/** The open session, or a clear refusal (a return / cash move / sale needs one). */
async function requireOpen(sessionId: string): Promise<PosSession> {
  const session = await openSession();
  if (!session || session.id !== sessionId) throw new StockError('De kassa is gesloten. Open eerst de kassa.', 409);
  return session;
}

export async function startSession(floatCents: number, user: CrmUser): Promise<PosSession> {
  const { data, error } = await admin().rpc('kfc_pos_open', { p_register: REGISTER, p_float_cents: floatCents, p_opened_by: user.id });
  if (error) throw posError(error);
  return toSession(data);
}

export async function closeSession(id: string, countedCashCents: number, countedPinCents: number, note: string, user: CrmUser): Promise<PosSession> {
  if (!UUID.test(id)) throw new StockError('Kassasessie niet gevonden.', 404);
  const { data, error } = await admin().rpc('kfc_pos_close', {
    p_session: id, p_counted_cents: countedCashCents, p_counted_pin_cents: countedPinCents, p_note: note, p_closed_by: user.id,
  });
  if (error) throw posError(error);
  return toSession(data);
}

/** Totals for the header of the till and the closing screen. */
export async function sessionSummary(session: PosSession): Promise<PosSummary> {
  const db = admin();
  const [payments, invoices, moves] = await Promise.all([
    db.from('kfc_pos_payments').select('method, amount_cents, kind').eq('session_id', session.id),
    db.from('sales_invoices').select('id, invoice_number, total, created_at, client_name, credit_of_invoice_id')
      .eq('pos_session_id', session.id).order('created_at', { ascending: false }).limit(1000),
    db.from('kfc_pos_cash_moves').select('direction, amount_cents').eq('session_id', session.id),
  ]);
  if (payments.error) throw posError(payments.error);
  if (invoices.error) throw posError(invoices.error);
  if (moves.error) throw posError(moves.error);
  const byMethod: Record<PayMethod, number> = { cash: 0, pin: 0, other: 0 };
  const refunds: Record<RefundMethod, number> = { cash: 0, pin: 0 };
  for (const p of payments.data) {
    byMethod[p.method as PayMethod] += p.amount_cents;
    if (p.kind === 'refund' && (p.method === 'cash' || p.method === 'pin')) refunds[p.method as RefundMethod] -= p.amount_cents;
  }
  let cashInCents = 0;
  let cashOutCents = 0;
  for (const m of moves.data) {
    if (m.direction === 'in') cashInCents += m.amount_cents; else cashOutCents += m.amount_cents;
  }
  const totalCents = invoices.data.reduce((sum, row) => sum + cents(row.total), 0);
  const returns = invoices.data.filter((row) => row.credit_of_invoice_id).length;
  return {
    session, sales: invoices.data.length - returns, returns, totalCents, byMethod, refunds, cashInCents, cashOutCents,
    expectedCashCents: session.openingFloatCents + byMethod.cash + cashInCents - cashOutCents,
    expectedPinCents: byMethod.pin,
    recent: invoices.data.slice(0, 20).map((row) => ({
      id: row.id, number: row.invoice_number, totalCents: cents(row.total), time: row.created_at, client: row.client_name,
      credit: !!row.credit_of_invoice_id,
    })),
  };
}

const ARTICLE_COLUMNS = 'code, name, sku, ean, category, sale_price_cents, status';

async function onHand(codes: string[]): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  if (!codes.length) return result;
  const { data, error } = await admin().from('kfc_stock_levels').select('article_code, quantity').in('article_code', codes);
  if (error) throw posError(error);
  for (const row of data) result.set(row.article_code, (result.get(row.article_code) ?? 0) + row.quantity);
  return result;
}

function toArticle(row: Record<string, unknown>, stock: Map<string, number>): PosArticle {
  return {
    code: row.code as string, name: row.name as string, sku: (row.sku as string) ?? '', ean: (row.ean as string[]) ?? [],
    category: (row.category as string) ?? '', priceCents: (row.sale_price_cents as number | null) ?? null,
    onHand: stock.get(row.code as string) ?? 0,
  };
}

/**
 * Scan first (exact code / SKU / EAN / supplier ref, the same matching as
 * goods receipt), then a name search. A scanner types the code and presses
 * Enter, so one exact hit is the common case.
 */
export async function searchArticles(query: string): Promise<{ exact: boolean; articles: PosArticle[] }> {
  const q = query.trim();
  if (!q || q.length > 80) return { exact: false, articles: [] };
  const db = admin();
  const scanned = await findArticlesByScan(q);
  let rows: Record<string, unknown>[];
  let exact = false;
  if (scanned.length) {
    const { data, error } = await db.from('kfc_articles').select(ARTICLE_COLUMNS).in('code', scanned.map((a) => a.id));
    if (error) throw posError(error);
    rows = data;
    exact = true;
  } else {
    const like = `%${q.replace(/[\\%_,()]/g, (c) => '\\' + c)}%`;
    const { data, error } = await db.from('kfc_articles').select(ARTICLE_COLUMNS)
      .or(`name.ilike.${like},sku.ilike.${like}`).neq('status', 'discontinued').order('name').limit(40);
    if (error) throw posError(error);
    rows = data;
  }
  const stock = await onHand(rows.map((r) => r.code as string));
  return { exact, articles: rows.map((r) => toArticle(r, stock)) };
}

export interface SaleInput {
  key: string; lines: PosLineInput[]; payments: PosPaymentInput[];
  customerId: string | null; clientName: string;
}

export interface Receipt {
  invoiceId: string; number: string; time: string; client: string;
  lines: { description: string; quantity: number; unitPriceCents: number; discountCents: number; totalCents: number; vatRate: number }[];
  totalCents: number; vatCents: number; vatByRate: { rate: number; vatCents: number; baseCents: number }[];
  payments: { method: PayMethod; amountCents: number; tenderedCents: number }[]; changeCents: number;
  biller: ReturnType<typeof posBiller>;
  /** Set on a credit receipt (a return): the number of the original sale. */
  creditOf: string | null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const KEY = /^[A-Za-z0-9-]{8,80}$/;
const isInt = (n: unknown, max: number): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= max;

/** Validates the shape before the RPC does the real checks (stock, totals, session). */
export function parseSale(body: Record<string, unknown>): SaleInput {
  const key = typeof body.key === 'string' ? body.key : '';
  if (!KEY.test(key)) throw new StockError('Ongeldige verkoop-id.');
  const lines = Array.isArray(body.lines) ? body.lines : [];
  const payments = Array.isArray(body.payments) ? body.payments : [];
  if (!lines.length || lines.length > 200) throw new StockError('De bon is leeg.');
  if (!payments.length || payments.length > 10) throw new StockError('Kies een betaalwijze.');
  const parsedLines = lines.map((raw): PosLineInput => {
    const l = (raw ?? {}) as Record<string, unknown>;
    const line = {
      article: typeof l.article === 'string' ? l.article : '', quantity: l.quantity as number,
      unitPriceCents: l.unitPriceCents as number, discountCents: (l.discountCents ?? 0) as number, vatRate: (l.vatRate ?? 21) as number,
    };
    if (!line.article || !isInt(line.quantity, 10000) || line.quantity < 1 || !isInt(line.unitPriceCents, 10_000_000) ||
        !isInt(line.discountCents, line.quantity * line.unitPriceCents) || ![0, 9, 21].includes(line.vatRate)) {
      throw new StockError('Controleer de regels: aantal, prijs, korting en btw.');
    }
    return line;
  });
  const parsedPayments = payments.map((raw): PosPaymentInput => {
    const p = (raw ?? {}) as Record<string, unknown>;
    const method = p.method as PayMethod;
    if (!['cash', 'pin', 'other'].includes(method) || !isInt(p.tenderedCents, 100_000_000) || p.tenderedCents < 1) {
      throw new StockError('Controleer de betaling.');
    }
    return { method, tenderedCents: p.tenderedCents };
  });
  const customerId = typeof body.customerId === 'string' && UUID.test(body.customerId) ? body.customerId : null;
  const clientName = typeof body.clientName === 'string' ? body.clientName.trim().slice(0, 200) : '';
  return { key, lines: parsedLines, payments: parsedPayments, customerId, clientName };
}

/**
 * Price rule: office roles may set price, discount and VAT rate; everyone else
 * sells at the article's shelf price, no discount, 21% VAT. An article without
 * a shelf price cannot be sold by them.
 */
async function applyPriceRule(lines: PosLineInput[], user: CrmUser): Promise<PosLineInput[]> {
  if (canManagePos(user)) return lines;
  const codes = [...new Set(lines.map((l) => l.article))];
  const { data, error } = await admin().from('kfc_articles').select('code, name, sale_price_cents').in('code', codes);
  if (error) throw posError(error);
  const prices = new Map(data.map((a) => [a.code as string, a]));
  return lines.map((line) => {
    const article = prices.get(line.article);
    if (!article) throw new StockError('Onbekend artikel in de bon.');
    const price = article.sale_price_cents as number | null;
    if (price === null || price === undefined) {
      throw new StockError(`"${article.name}" heeft geen verkoopprijs. Vraag kantoor om een prijs in te stellen.`, 409);
    }
    return { ...line, unitPriceCents: price, discountCents: 0, vatRate: 21 };
  });
}

export async function sell(sessionId: string, sale: SaleInput, user: CrmUser): Promise<Receipt> {
  await requireOpen(sessionId);
  const lines = await applyPriceRule(sale.lines, user);
  const { data, error } = await admin().rpc('kfc_pos_sale', {
    p_session: sessionId, p_key: sale.key,
    p_lines: lines.map((l) => ({
      article: l.article, quantity: l.quantity, unit_price_cents: l.unitPriceCents, discount_cents: l.discountCents, vat_rate: l.vatRate,
    })),
    p_payments: sale.payments.map((p) => ({ method: p.method, tendered_cents: p.tenderedCents })),
    p_customer: sale.customerId, p_client_name: sale.clientName, p_biller: posBiller(), p_created_by: user.id,
  });
  if (error) throw posError(error);
  return receipt(data as string);
}

/** A receipt rebuilt from what was stored, so a reprint shows exactly what was sold (or returned). */
export async function receipt(invoiceId: string): Promise<Receipt> {
  if (!UUID.test(invoiceId)) throw new StockError('Bon niet gevonden.', 404);
  const db = admin();
  const [invoice, lines, payments] = await Promise.all([
    db.from('sales_invoices').select('id, invoice_number, created_at, client_name, total, vat_total, pos_session_id, credit_of_invoice_id')
      .eq('id', invoiceId).maybeSingle(),
    db.from('sales_invoice_lines').select('description, quantity, unit_price, discount, vat_rate, line_no, pos_unit_incl_cents, pos_discount_incl_cents')
      .eq('invoice_id', invoiceId).order('line_no'),
    db.from('kfc_pos_payments').select('method, amount_cents, tendered_cents').eq('sales_invoice_id', invoiceId).order('id'),
  ]);
  if (invoice.error || !invoice.data?.pos_session_id) throw new StockError('Bon niet gevonden.', 404);
  if (lines.error) throw posError(lines.error);
  if (payments.error) throw posError(payments.error);
  let creditOf: string | null = null;
  if (invoice.data.credit_of_invoice_id) {
    const original = await db.from('sales_invoices').select('invoice_number').eq('id', invoice.data.credit_of_invoice_id).maybeSingle();
    creditOf = original.data?.invoice_number ?? null;
  }
  const totalCents = cents(invoice.data.total);
  const vatCents = cents(invoice.data.vat_total);
  const rates = new Map<number, { vatCents: number; baseCents: number }>();
  const receiptLines = lines.data.map((l) => {
    const rate = Number(l.vat_rate);
    const incl = (c: number) => Math.round(c * (1 + rate / 100));
    // Till lines since 0136 keep the exact incl.-VAT cents; older lines are rebuilt.
    const unit = typeof l.pos_unit_incl_cents === 'number' ? l.pos_unit_incl_cents : incl(cents(l.unit_price));
    const discount = typeof l.pos_discount_incl_cents === 'number' ? l.pos_discount_incl_cents : incl(cents(l.discount));
    const total = Number(l.quantity) * unit - discount;
    const entry = rates.get(rate) ?? { vatCents: 0, baseCents: 0 };
    const base = Math.round(total / (1 + rate / 100));
    entry.baseCents += base;
    entry.vatCents += total - base;
    rates.set(rate, entry);
    return { description: l.description, quantity: Number(l.quantity), unitPriceCents: unit, discountCents: discount, totalCents: total, vatRate: rate };
  });
  const paid = payments.data.reduce((sum, p) => sum + p.tendered_cents, 0);
  return {
    invoiceId, number: invoice.data.invoice_number, time: invoice.data.created_at, client: invoice.data.client_name,
    lines: receiptLines, totalCents, vatCents,
    vatByRate: [...rates.entries()].map(([rate, v]) => ({ rate, ...v })).sort((a, b) => b.rate - a.rate),
    payments: payments.data.map((p) => ({ method: p.method as PayMethod, amountCents: p.amount_cents, tenderedCents: p.tendered_cents })),
    changeCents: totalCents > 0 ? Math.max(0, paid - totalCents) : 0,
    biller: posBiller(),
    creditOf,
  };
}

/* ── returns ─────────────────────────────────────────────────────────── */

export interface ReturnableReceipt {
  invoiceId: string; number: string; time: string; client: string; totalCents: number;
  lines: { id: string; description: string; sold: number; returned: number; returnable: number; vatRate: number; lineTotalCents: number }[];
}

/** "I-00042", "i-42", "42" → "I-00042"; anything else is used as typed. */
function normaliseReceiptNumber(raw: string): string {
  const q = raw.trim().toUpperCase().replace(/\s+/g, '');
  const m = /^(?:I-?)?(\d{1,9})$/.exec(q);
  return m ? `I-${m[1].padStart(5, '0')}` : q;
}

/** Find a till sale by its receipt number (typed or scanned) or id, with what can still go back per line. */
export async function findReturnable(query: string): Promise<ReturnableReceipt> {
  const q = query.trim();
  if (!q || q.length > 60) throw new StockError('Vul een bonnummer in.');
  const db = admin();
  const lookup = db.from('sales_invoices').select('id, invoice_number, created_at, client_name, total, pos_session_id, credit_of_invoice_id');
  const { data: invoice, error } = await (UUID.test(q) ? lookup.eq('id', q) : lookup.eq('invoice_number', normaliseReceiptNumber(q))).maybeSingle();
  if (error) throw posError(error);
  if (!invoice || !invoice.pos_session_id) throw new StockError('Geen kassabon met dit nummer gevonden.', 404);
  if (invoice.credit_of_invoice_id) throw new StockError('Dit is zelf een retourbon. Zoek de oorspronkelijke bon.', 409);

  const { data: lines, error: linesError } = await db.from('sales_invoice_lines')
    .select('id, description, quantity, unit_price, discount, vat_rate, pos_unit_incl_cents, pos_discount_incl_cents')
    .eq('invoice_id', invoice.id).order('line_no');
  if (linesError) throw posError(linesError);
  const ids = lines.map((l) => l.id as string);
  const returned = new Map<string, number>();
  if (ids.length) {
    const { data: done, error: doneError } = await db.from('kfc_pos_return_lines').select('invoice_line_id, quantity').in('invoice_line_id', ids);
    if (doneError) throw posError(doneError);
    for (const r of done) returned.set(r.invoice_line_id, (returned.get(r.invoice_line_id) ?? 0) + r.quantity);
  }
  return {
    invoiceId: invoice.id, number: invoice.invoice_number, time: invoice.created_at, client: invoice.client_name, totalCents: cents(invoice.total),
    lines: lines.map((l) => {
      const rate = Number(l.vat_rate);
      const sold = Number(l.quantity);
      const back = returned.get(l.id) ?? 0;
      const lineTotalCents = typeof l.pos_unit_incl_cents === 'number'
        ? sold * l.pos_unit_incl_cents - (l.pos_discount_incl_cents ?? 0)
        : Math.round((sold * Number(l.unit_price) - Number(l.discount)) * (1 + rate / 100) * 100);
      return { id: l.id, description: l.description, sold, returned: back, returnable: Math.max(0, sold - back), vatRate: rate, lineTotalCents };
    }),
  };
}

export interface ReturnInput {
  key: string; invoiceId: string; lines: { lineId: string; quantity: number }[];
  method: RefundMethod; locationId: string; reason: string;
}

export function parseReturn(body: Record<string, unknown>): ReturnInput {
  const key = typeof body.key === 'string' ? body.key : '';
  if (!KEY.test(key)) throw new StockError('Ongeldige retour-id.');
  const invoiceId = typeof body.invoiceId === 'string' && UUID.test(body.invoiceId) ? body.invoiceId : '';
  if (!invoiceId) throw new StockError('Zoek eerst de bon op.');
  const raw = Array.isArray(body.lines) ? body.lines : [];
  const lines = raw.map((r) => {
    const l = (r ?? {}) as Record<string, unknown>;
    const lineId = typeof l.lineId === 'string' && UUID.test(l.lineId) ? l.lineId : '';
    if (!lineId || !isInt(l.quantity, 10000) || l.quantity < 1) throw new StockError('Controleer de retourregels.');
    return { lineId, quantity: l.quantity };
  });
  if (!lines.length || lines.length > 200) throw new StockError('Kies minstens één artikel dat retour komt.');
  const method = body.method === 'cash' || body.method === 'pin' ? body.method : null;
  if (!method) throw new StockError('Kies hoe het geld terug gaat: contant of PIN.');
  const locationId = typeof body.locationId === 'string' && UUID.test(body.locationId) ? body.locationId : '';
  if (!locationId) throw new StockError('Kies de locatie waar het artikel terug komt.');
  const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 500) : '';
  return { key, invoiceId, lines, method, locationId, reason };
}

export async function returnSale(sessionId: string, input: ReturnInput, user: CrmUser): Promise<Receipt> {
  if (!canManagePos(user)) throw new StockError('Een retour mag alleen door kantoor of de eigenaar worden gedaan.', 403);
  await requireOpen(sessionId);
  const { data, error } = await admin().rpc('kfc_pos_return', {
    p_session: sessionId, p_key: input.key, p_invoice: input.invoiceId,
    p_lines: input.lines.map((l) => ({ line_id: l.lineId, quantity: l.quantity })),
    p_method: input.method, p_location: input.locationId, p_reason: input.reason, p_created_by: user.id,
  });
  if (error) throw posError(error);
  return receipt(data as string);
}

/** Where a returned article can go: every warehouse location except vans (quarantine included, for broken goods). */
export async function returnLocations(): Promise<{ id: string; label: string; quarantine: boolean }[]> {
  const { data, error } = await admin().from('kfc_locations').select('id, warehouse, shelf, box, kind')
    .is('technician_id', null).order('kind').order('warehouse').order('shelf').order('box').limit(1000);
  if (error) throw posError(error);
  return data.map((l) => ({
    id: l.id as string, label: `${l.warehouse} / ${l.shelf} / ${l.box}`, quarantine: l.kind === 'quarantine',
  }));
}

/* ── cash in / out ───────────────────────────────────────────────────── */

export interface CashMoveInput { key: string; direction: 'in' | 'out'; amountCents: number; reason: string }

export function parseCashMove(body: Record<string, unknown>): CashMoveInput {
  const key = typeof body.key === 'string' ? body.key : '';
  if (!KEY.test(key)) throw new StockError('Ongeldige id. Probeer opnieuw.');
  const direction = body.direction === 'in' || body.direction === 'out' ? body.direction : null;
  if (!direction) throw new StockError('Kies kas in of kas uit.');
  if (!isInt(body.amountCents, 10_000_000) || body.amountCents < 1) throw new StockError('Vul een geldig bedrag in.');
  const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 500) : '';
  if (reason.length < 3) throw new StockError('Vul een reden in (minstens 3 tekens).');
  return { key, direction, amountCents: body.amountCents, reason };
}

export async function cashMove(sessionId: string, input: CashMoveInput, user: CrmUser): Promise<void> {
  if (input.direction === 'out' && !canManagePos(user)) {
    throw new StockError('Geld uit de kassa halen mag alleen kantoor of de eigenaar.', 403);
  }
  await requireOpen(sessionId);
  const { error } = await admin().rpc('kfc_pos_cash_move', {
    p_session: sessionId, p_key: input.key, p_direction: input.direction, p_amount_cents: input.amountCents,
    p_reason: input.reason, p_created_by: user.id,
  });
  if (error) throw posError(error);
}

/* ── closed sessions and stored Z-reports ────────────────────────────── */

export interface ZReport {
  sessionId: string;
  zNumber: number | null;
  register: string;
  openedAt: string; closedAt: string | null;
  openedBy: string; closedBy: string;
  salesCount: number; salesTotalCents: number;
  returnsCount: number; refundsTotalCents: number; netTotalCents: number;
  salesByMethod: Record<PayMethod, number>;
  refundsByMethod: Record<RefundMethod, number>;
  cashInCents: number; cashInCount: number; cashOutCents: number; cashOutCount: number;
  vat: { rate: number; inclCents: number; baseCents: number; vatCents: number }[];
  openingFloatCents: number;
  cash: { expectedCents: number; countedCents: number; differenceCents: number };
  /** null for sessions closed before PIN was counted (migration 0136). */
  pin: { expectedCents: number; countedCents: number; differenceCents: number } | null;
  note: string | null;
  /** false: closed before 0136, rebuilt from the session row only (no snapshot). */
  stored: boolean;
}

export interface ClosedSession {
  id: string; zNumber: number | null; openedAt: string; closedAt: string; cashier: string;
  cashDifferenceCents: number | null; pinDifferenceCents: number | null; netTotalCents: number | null;
}

const nameCache = new Map<string, string>();
async function userNames(ids: (string | null | undefined)[]): Promise<Map<string, string>> {
  const wanted = [...new Set(ids.filter((id): id is string => !!id && UUID.test(id)))];
  await Promise.all(wanted.filter((id) => !nameCache.has(id)).map(async (id) => {
    const { data } = await admin().auth.admin.getUserById(id);
    nameCache.set(id, data.user?.email ?? 'onbekend');
  }));
  return new Map(wanted.map((id) => [id, nameCache.get(id) ?? 'onbekend']));
}

export async function listClosedSessions(page = 1): Promise<{ sessions: ClosedSession[]; more: boolean }> {
  const size = 50;
  const from = (Math.max(1, Math.min(page, 1000)) - 1) * size;
  const { data, error } = await admin().from('kfc_pos_sessions')
    .select('id, z_number, opened_at, closed_at, opened_by, closed_by, cash_difference_cents, pin_difference_cents, expected_cash_cents, counted_cash_cents, z_report')
    .eq('register', REGISTER).not('closed_at', 'is', null)
    .order('closed_at', { ascending: false }).range(from, from + size);
  if (error) throw posError(error);
  const rows = data.slice(0, size);
  const names = await userNames(rows.flatMap((r) => [r.closed_by, r.opened_by]));
  return {
    more: data.length > size,
    sessions: rows.map((r) => ({
      id: r.id, zNumber: r.z_number ?? null, openedAt: r.opened_at, closedAt: r.closed_at as string,
      cashier: names.get(r.closed_by ?? r.opened_by ?? '') ?? '—',
      cashDifferenceCents: r.cash_difference_cents ?? (r.counted_cash_cents !== null && r.expected_cash_cents !== null
        ? r.counted_cash_cents - r.expected_cash_cents : null),
      pinDifferenceCents: r.pin_difference_cents ?? null,
      netTotalCents: typeof r.z_report?.net_total_cents === 'number' ? r.z_report.net_total_cents : null,
    })),
  };
}

/** The Z-report exactly as frozen at closing (migration 0136), for reopening and reprinting. */
export async function storedZReport(sessionId: string): Promise<ZReport> {
  if (!UUID.test(sessionId)) throw new StockError('Z-rapport niet gevonden.', 404);
  const { data: row, error } = await admin().from('kfc_pos_sessions').select('*').eq('id', sessionId).maybeSingle();
  if (error) throw posError(error);
  if (!row || !row.closed_at) throw new StockError('Z-rapport niet gevonden: deze kassa is nog niet gesloten.', 404);
  const names = await userNames([row.opened_by, row.closed_by]);
  const z = (row.z_report ?? null) as Record<string, unknown> | null;
  const num = (v: unknown) => (typeof v === 'number' ? v : Number(v ?? 0));
  const obj = (v: unknown) => (v && typeof v === 'object' ? v as Record<string, unknown> : {});
  const base = {
    sessionId: row.id as string, register: row.register as string, openedAt: row.opened_at as string, closedAt: row.closed_at as string,
    openedBy: names.get(row.opened_by ?? '') ?? '—', closedBy: names.get(row.closed_by ?? '') ?? '—',
    openingFloatCents: row.opening_float_cents as number, note: (row.note as string | null) ?? null,
  };
  if (!z) {
    // Closed before 0136: only the cash count was stored.
    const expected = num(row.expected_cash_cents);
    const counted = num(row.counted_cash_cents);
    return {
      ...base, zNumber: null, stored: false, salesCount: 0, salesTotalCents: 0, returnsCount: 0, refundsTotalCents: 0, netTotalCents: 0,
      salesByMethod: { cash: 0, pin: 0, other: 0 }, refundsByMethod: { cash: 0, pin: 0 },
      cashInCents: 0, cashInCount: 0, cashOutCents: 0, cashOutCount: 0, vat: [],
      cash: { expectedCents: expected, countedCents: counted, differenceCents: counted - expected }, pin: null,
    };
  }
  const sales = obj(z.sales_by_method);
  const refunds = obj(z.refunds_by_method);
  const cash = obj(z.cash);
  const pin = obj(z.pin);
  return {
    ...base, stored: true, zNumber: num(z.z_number),
    salesCount: num(z.sales_count), salesTotalCents: num(z.sales_total_cents),
    returnsCount: num(z.returns_count), refundsTotalCents: num(z.refunds_total_cents), netTotalCents: num(z.net_total_cents),
    salesByMethod: { cash: num(sales.cash), pin: num(sales.pin), other: num(sales.other) },
    refundsByMethod: { cash: num(refunds.cash), pin: num(refunds.pin) },
    cashInCents: num(z.cash_in_cents), cashInCount: num(z.cash_in_count), cashOutCents: num(z.cash_out_cents), cashOutCount: num(z.cash_out_count),
    vat: (Array.isArray(z.vat) ? z.vat : []).map((v) => {
      const r = obj(v);
      return { rate: num(r.rate), inclCents: num(r.incl_cents), baseCents: num(r.base_cents), vatCents: num(r.vat_cents) };
    }),
    cash: { expectedCents: num(cash.expected_cents), countedCents: num(cash.counted_cents), differenceCents: num(cash.difference_cents) },
    pin: { expectedCents: num(pin.expected_cents), countedCents: num(pin.counted_cents), differenceCents: num(pin.difference_cents) },
    note: (z.note as string | null) ?? base.note,
  };
}

/** Known business customers for "op naam" sales (balance stays at zero: paid at the till). */
export async function searchCustomers(query: string) {
  const q = query.trim();
  if (q.length < 2 || q.length > 80) return [];
  const like = `%${q.replace(/[\\%_,()]/g, (c) => '\\' + c)}%`;
  const { data, error } = await admin().from('kfc_customers').select('id, company, contact_name, vat_number, city')
    .is('merged_into', null).is('anonymised_at', null)
    .or(`company.ilike.${like},contact_name.ilike.${like},vat_number.ilike.${like}`).order('company').limit(10);
  if (error) throw posError(error);
  return data.map((c) => ({ id: c.id as string, name: c.company as string, contact: (c.contact_name as string) ?? '', vat: (c.vat_number as string) ?? '', city: (c.city as string) ?? '' }));
}
