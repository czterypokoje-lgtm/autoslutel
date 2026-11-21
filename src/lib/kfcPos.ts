import 'server-only';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { CrmRole, CrmUser } from '@/lib/crmSession';
import { SITE_CONFIG } from '@/config/site.config';
import { BRAND, IS_KEYFORCARS } from '@/config/install';
import { findArticlesByScan, StockError } from '@/lib/kfcInventory';

/**
 * Kassa (point of sale): the shop counter.
 *
 * Everything that changes money or stock goes through the RPCs of migration
 * 0129 (kfc_pos_open / kfc_pos_sale / kfc_pos_close), so a sale is one
 * transaction: invoice, stock moves and payments together or not at all.
 * Prices on the till are shelf prices incl. VAT, in integer cents.
 */

/** Who may work the till: the office and the shop floor, not technicians or packers. */
export const POS_ROLES: readonly CrmRole[] = ['owner', 'kantoor', 'magazijn'];
export const canUsePos = (user: CrmUser | null): user is CrmUser => !!user?.role && POS_ROLES.includes(user.role);

export const REGISTER = 'winkel';
export type PayMethod = 'cash' | 'pin' | 'other';

export interface PosSession {
  id: string; register: string; openedAt: string; openingFloatCents: number;
  closedAt: string | null; expectedCashCents: number | null; countedCashCents: number | null; note: string | null;
}

export interface PosArticle {
  code: string; name: string; sku: string; ean: string[]; category: string;
  priceCents: number | null; onHand: number;
}

export interface PosLineInput { article: string; quantity: number; unitPriceCents: number; discountCents: number; vatRate: number }
export interface PosPaymentInput { method: PayMethod; tenderedCents: number }

export interface PosSummary {
  session: PosSession;
  sales: number;
  totalCents: number;
  byMethod: Record<PayMethod, number>;
  expectedCashCents: number;
  recent: { id: string; number: string; totalCents: number; time: string; client: string }[];
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
  KFC_POS_BAD_COUNT: ['Ongeldig geteld bedrag.', 400],
  KFC_POS_NO_SESSION: ['Kassasessie niet gevonden.', 404],
  KFC_HAS_LOCATED_STOCK: ['Dit artikel heeft voorraad op een locatie; boek eerst een telling.', 409],
};

function posError(error: { message: string }): StockError {
  for (const [code, [message, status]] of Object.entries(RPC_MESSAGES)) {
    if (error.message.includes(code)) return new StockError(message, status);
  }
  return new StockError(`Kassa mislukt: ${error.message}`, 500);
}

function toSession(row: Record<string, unknown>): PosSession {
  return {
    id: row.id as string, register: row.register as string, openedAt: row.opened_at as string,
    openingFloatCents: row.opening_float_cents as number, closedAt: (row.closed_at as string | null) ?? null,
    expectedCashCents: (row.expected_cash_cents as number | null) ?? null,
    countedCashCents: (row.counted_cash_cents as number | null) ?? null, note: (row.note as string | null) ?? null,
  };
}

/** The seller on the receipt and invoice: this install's own details, never the other company's. */
export function posBiller() {
  if (IS_KEYFORCARS) {
    const env = process.env;
    return {
      name: env.POS_BILLER_NAME || BRAND.name, street: env.POS_BILLER_STREET || null, postcode: env.POS_BILLER_POSTCODE || null,
      city: env.POS_BILLER_CITY || null, email: env.POS_BILLER_EMAIL || null, phone: env.POS_BILLER_PHONE || null,
      kvk: env.POS_BILLER_KVK || null, btw: env.POS_BILLER_BTW || null, iban: env.POS_BILLER_IBAN || null,
    };
  }
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
  const { data, error } = await admin().from('kfc_pos_sessions').select('*').eq('id', id).maybeSingle();
  if (error) throw posError(error);
  return data ? toSession(data) : null;
}

export async function startSession(floatCents: number, user: CrmUser): Promise<PosSession> {
  const { data, error } = await admin().rpc('kfc_pos_open', { p_register: REGISTER, p_float_cents: floatCents, p_opened_by: user.id });
  if (error) throw posError(error);
  return toSession(data);
}

export async function closeSession(id: string, countedCents: number, note: string, user: CrmUser): Promise<PosSession> {
  const { data, error } = await admin().rpc('kfc_pos_close', { p_session: id, p_counted_cents: countedCents, p_note: note, p_closed_by: user.id });
  if (error) throw posError(error);
  return toSession(data);
}

/** Totals for the Z-report and the header of the till. */
export async function sessionSummary(session: PosSession): Promise<PosSummary> {
  const db = admin();
  const [payments, invoices] = await Promise.all([
    db.from('kfc_pos_payments').select('method, amount_cents').eq('session_id', session.id),
    db.from('sales_invoices').select('id, invoice_number, total, created_at, client_name')
      .eq('pos_session_id', session.id).order('created_at', { ascending: false }).limit(1000),
  ]);
  if (payments.error) throw posError(payments.error);
  if (invoices.error) throw posError(invoices.error);
  const byMethod: Record<PayMethod, number> = { cash: 0, pin: 0, other: 0 };
  for (const p of payments.data) byMethod[p.method as PayMethod] += p.amount_cents;
  const totalCents = invoices.data.reduce((sum, row) => sum + Math.round(Number(row.total) * 100), 0);
  return {
    session, sales: invoices.data.length, totalCents, byMethod,
    expectedCashCents: session.openingFloatCents + byMethod.cash,
    recent: invoices.data.slice(0, 20).map((row) => ({
      id: row.id, number: row.invoice_number, totalCents: Math.round(Number(row.total) * 100), time: row.created_at, client: row.client_name,
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
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isInt = (n: unknown, max: number): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= max;

/** Validates the shape before the RPC does the real checks (stock, totals, session). */
export function parseSale(body: Record<string, unknown>): SaleInput {
  const key = typeof body.key === 'string' ? body.key : '';
  if (!/^[A-Za-z0-9-]{8,80}$/.test(key)) throw new StockError('Ongeldige verkoop-id.');
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

export async function sell(sessionId: string, sale: SaleInput, user: CrmUser): Promise<Receipt> {
  const { data, error } = await admin().rpc('kfc_pos_sale', {
    p_session: sessionId, p_key: sale.key,
    p_lines: sale.lines.map((l) => ({
      article: l.article, quantity: l.quantity, unit_price_cents: l.unitPriceCents, discount_cents: l.discountCents, vat_rate: l.vatRate,
    })),
    p_payments: sale.payments.map((p) => ({ method: p.method, tendered_cents: p.tenderedCents })),
    p_customer: sale.customerId, p_client_name: sale.clientName, p_biller: posBiller(), p_created_by: user.id,
  });
  if (error) throw posError(error);
  return receipt(data as string);
}

/** A receipt rebuilt from what was stored, so a reprint shows exactly what was sold. */
export async function receipt(invoiceId: string): Promise<Receipt> {
  if (!UUID.test(invoiceId)) throw new StockError('Bon niet gevonden.', 404);
  const db = admin();
  const [invoice, lines, payments] = await Promise.all([
    db.from('sales_invoices').select('id, invoice_number, created_at, client_name, total, vat_total, pos_session_id').eq('id', invoiceId).maybeSingle(),
    db.from('sales_invoice_lines').select('description, quantity, unit_price, discount, vat_rate, line_no').eq('invoice_id', invoiceId).order('line_no'),
    db.from('kfc_pos_payments').select('method, amount_cents, tendered_cents').eq('sales_invoice_id', invoiceId).order('id'),
  ]);
  if (invoice.error || !invoice.data?.pos_session_id) throw new StockError('Bon niet gevonden.', 404);
  if (lines.error) throw posError(lines.error);
  if (payments.error) throw posError(payments.error);
  const totalCents = Math.round(Number(invoice.data.total) * 100);
  const vatCents = Math.round(Number(invoice.data.vat_total) * 100);
  const rates = new Map<number, { vatCents: number; baseCents: number }>();
  const receiptLines = lines.data.map((l) => {
    const rate = Number(l.vat_rate);
    const incl = (cents: number) => Math.round(cents * (1 + rate / 100));
    const unit = incl(Math.round(Number(l.unit_price) * 100));
    const discount = incl(Math.round(Number(l.discount) * 100));
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
    changeCents: Math.max(0, paid - totalCents),
    biller: posBiller(),
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
