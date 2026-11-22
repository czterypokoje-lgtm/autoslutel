import 'server-only';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { StockError } from '@/lib/kfcInventory';
import { fetchAll } from '@/lib/kfcOrders';
import type { CrmUser } from '@/lib/crmSession';
import {
  ACCOUNT_PROBLEMS, accountProblem, normalizeIban, normalizeKvk, normalizePostcode, normalizeVat, validEmail,
} from '@/lib/accountValidation';

/*
 * Supplier accounts (crediteuren, migration 0130): the supplier card, its
 * articles and prices, purchase orders, purchase invoices, payments, the
 * running statement and aging. Mirrors kfcReceivables for customers.
 * Everything here carries prices: callers are office only.
 */

export type SupplierEntryType = 'invoice' | 'payment' | 'credit_note' | 'refund' | 'opening' | 'write_off' | 'reversal';
export interface Supplier {
  id: string; name: string; kvk: string | null; vat_number: string | null; iban: string | null; bic: string | null;
  email: string | null; order_email: string | null; phone: string | null; website: string | null; contact_name: string | null;
  street: string | null; postcode: string | null; city: string | null; country: string; terms_days: number;
  lead_time_days: number | null; min_order_cents: number | null; customer_number: string | null; note: string | null;
  active: boolean; created_at: string;
}
export interface SupplierBalance {
  open_cents: number; overdue_cents: number; not_due: number; d1_30: number; d31_60: number; d61_90: number; d90p: number;
  oldest_overdue: string | null; last_entry: string | null; open_pos: number; late_pos: number; on_order_cents: number; last_order_at: string | null;
}
export interface SupplierEntry {
  id: number; entry_type: SupplierEntryType; amount_cents: number; vat_cents: number; entry_date: string; due_date: string | null; booked_at: string;
  invoice_ref: string | null; purchase_order_id: string | null; reverses_entry_id: number | null; note: string | null;
  open_cents?: number; running_cents?: number; reversed?: boolean;
}
export interface SupplierContact { id: string; name: string; position: string | null; email: string | null; phone: string | null }
export interface SupplierArticle {
  article_code: string; name: string; sku: string; supplier_sku: string | null; price_cents: number | null; min_qty: number;
  lead_time_days: number | null; preferred: boolean; last_price_cents: number | null; last_ordered_at: string | null; note: string | null;
  /** The article's current purchase price (kfc_articles), for comparison. */
  article_price_cents: number | null;
}
export interface SupplierOrder {
  id: string; status: 'draft' | 'ordered' | 'received' | 'cancelled' | 'closed'; created_at: string; ordered_at: string | null; expected_on: string | null;
  received_at: string | null; invoice_ref: string | null; note: string | null; lines: number; quantity: number; received: number;
  ordered_cents: number; received_cents: number; invoiced_cents: number; late: boolean;
}

const db = () => createSupabaseAdminClient();
const COLS = 'id, name, kvk, vat_number, iban, bic, email, order_email, phone, website, contact_name, street, postcode, city, country, terms_days, lead_time_days, min_order_cents, customer_number, note, active, created_at';
const ZERO: SupplierBalance = { open_cents: 0, overdue_cents: 0, not_due: 0, d1_30: 0, d31_60: 0, d61_90: 0, d90p: 0, oldest_overdue: null, last_entry: null, open_pos: 0, late_pos: 0, on_order_cents: 0, last_order_at: null };
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam' }).format(new Date());
const num = (value: unknown) => Number(value ?? 0);

function toBalance(row: Record<string, unknown> | undefined | null): SupplierBalance {
  if (!row) return { ...ZERO };
  return {
    open_cents: num(row.open_cents), overdue_cents: num(row.overdue_cents), not_due: num(row.not_due), d1_30: num(row.d1_30), d31_60: num(row.d31_60),
    d61_90: num(row.d61_90), d90p: num(row.d90p), oldest_overdue: (row.oldest_overdue as string) ?? null, last_entry: (row.last_entry as string) ?? null,
    open_pos: num(row.open_pos), late_pos: num(row.late_pos), on_order_cents: num(row.on_order_cents), last_order_at: (row.last_order_at as string) ?? null,
  };
}

// ---------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------

export async function listSuppliers(): Promise<(Supplier & SupplierBalance)[]> {
  const [suppliers, balances] = await Promise.all([
    fetchAll<Supplier>((a, b) => db().from('kfc_suppliers').select(COLS).order('name').order('id').range(a, b)),
    fetchAll<Record<string, unknown>>((a, b) => db().from('kfc_supplier_balance').select('*').order('supplier_id').range(a, b)),
  ]);
  const byId = new Map(balances.map((row) => [row.supplier_id as string, row]));
  return suppliers.map((supplier) => ({ ...supplier, ...toBalance(byId.get(supplier.id)) }));
}

/** For the purchase order form's supplier picker. */
export async function supplierOptions(): Promise<Pick<Supplier, 'id' | 'name' | 'terms_days' | 'lead_time_days' | 'active' | 'city'>[]> {
  const { data, error } = await db().from('kfc_suppliers').select('id, name, terms_days, lead_time_days, active, city').order('name');
  if (error) throw new StockError(`Leveranciers lezen mislukt: ${error.message}`, 500);
  return data ?? [];
}

/** Agreed (or else last paid) price per article at this supplier, for prefilling order lines. */
export async function supplierPrices(supplier: string): Promise<Record<string, { price_cents: number | null; supplier_sku: string | null; min_qty: number }>> {
  const rows = await fetchAll<{ article_code: string; price_cents: number | null; last_price_cents: number | null; supplier_sku: string | null; min_qty: number }>((a, b) =>
    db().from('kfc_supplier_articles').select('article_code, price_cents, last_price_cents, supplier_sku, min_qty').eq('supplier_id', supplier).order('article_code').range(a, b));
  return Object.fromEntries(rows.map((r) => [r.article_code, { price_cents: r.price_cents ?? r.last_price_cents, supplier_sku: r.supplier_sku, min_qty: r.min_qty }]));
}

export async function getSupplier(id: string): Promise<{
  supplier: Supplier; balance: SupplierBalance; contacts: SupplierContact[]; entries: SupplierEntry[]; openInvoices: SupplierEntry[];
  articles: SupplierArticle[]; orders: SupplierOrder[];
} | null> {
  const [supplier, balance, contacts, ledger, open, articles, orders] = await Promise.all([
    db().from('kfc_suppliers').select(COLS).eq('id', id).maybeSingle(),
    db().from('kfc_supplier_balance').select('*').eq('supplier_id', id).maybeSingle(),
    db().from('kfc_supplier_contacts').select('id, name, position, email, phone').eq('supplier_id', id).order('name'),
    fetchAll<SupplierEntry>((a, b) => db().from('kfc_supplier_ledger')
      .select('id, entry_type, amount_cents, vat_cents, entry_date, due_date, booked_at, invoice_ref, purchase_order_id, reverses_entry_id, note')
      .eq('supplier_id', id).order('entry_date').order('booked_at').order('id').range(a, b)),
    db().from('kfc_supplier_invoice_open').select('entry_id, open_cents').eq('supplier_id', id),
    fetchAll<Record<string, unknown>>((a, b) => db().from('kfc_supplier_articles')
      .select('article_code, supplier_sku, price_cents, min_qty, lead_time_days, preferred, last_price_cents, last_ordered_at, note, kfc_articles (name, sku, purchase_price_cents)')
      .eq('supplier_id', id).order('article_code').range(a, b)),
    fetchAll<Record<string, unknown>>((a, b) => db().from('kfc_purchase_orders')
      .select('id, status, created_at, ordered_at, expected_on, received_at, invoice_ref, note, kfc_purchase_order_lines (quantity, received, unit_cost_cents)')
      .eq('supplier_id', id).order('created_at', { ascending: false }).range(a, b)),
  ]);
  if (supplier.error) throw new StockError(`Leverancier lezen mislukt: ${supplier.error.message}`, 500);
  if (!supplier.data) return null;
  // A failed read must not look like "nothing owed, no open invoices, no contacts".
  for (const [result, label] of [[balance, 'Saldo'], [open, 'Open facturen'], [contacts, 'Contactpersonen']] as const) {
    if (result.error) throw new StockError(`${label} lezen mislukt: ${result.error.message}`, 500);
  }

  const openById = new Map((open.data ?? []).map((row) => [row.entry_id as number, num(row.open_cents)]));
  const reversed = new Set(ledger.filter((e) => e.reverses_entry_id).map((e) => e.reverses_entry_id));
  let running = 0;
  const entries = ledger.map((row) => {
    running += row.amount_cents;
    return { ...row, open_cents: openById.get(row.id), running_cents: running, reversed: reversed.has(row.id) };
  });
  const invoicedByPo = new Map<string, number>();
  // Invoiced per order: invoices (+) and credit notes (−, already signed) that were not reversed.
  for (const e of entries) {
    if (e.purchase_order_id && !e.reversed && (e.entry_type === 'invoice' || e.entry_type === 'credit_note')) {
      invoicedByPo.set(e.purchase_order_id, (invoicedByPo.get(e.purchase_order_id) ?? 0) + e.amount_cents);
    }
  }
  const now = today();
  return {
    supplier: supplier.data as Supplier,
    balance: toBalance(balance.data as Record<string, unknown> | null),
    contacts: (contacts.data ?? []) as SupplierContact[],
    entries: entries.reverse(),
    openInvoices: entries.filter((e) => (e.open_cents ?? 0) > 0).sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? '')),
    articles: articles.map((row) => {
      const article = row.kfc_articles as { name: string; sku: string; purchase_price_cents: number | null } | null;
      return {
        article_code: row.article_code as string, name: article?.name ?? (row.article_code as string), sku: article?.sku ?? '',
        supplier_sku: (row.supplier_sku as string) ?? null, price_cents: (row.price_cents as number) ?? null, min_qty: num(row.min_qty) || 1,
        lead_time_days: (row.lead_time_days as number) ?? null, preferred: !!row.preferred, last_price_cents: (row.last_price_cents as number) ?? null,
        last_ordered_at: (row.last_ordered_at as string) ?? null, note: (row.note as string) ?? null, article_price_cents: article?.purchase_price_cents ?? null,
      };
    }),
    orders: orders.map((row) => {
      const lines = (row.kfc_purchase_order_lines as { quantity: number; received: number; unit_cost_cents: number | null }[]) ?? [];
      const status = row.status as SupplierOrder['status'];
      return {
        id: row.id as string, status, created_at: row.created_at as string, ordered_at: (row.ordered_at as string) ?? null,
        expected_on: (row.expected_on as string) ?? null, received_at: (row.received_at as string) ?? null, invoice_ref: (row.invoice_ref as string) ?? null,
        note: (row.note as string) ?? null, lines: lines.length,
        quantity: lines.reduce((s, l) => s + l.quantity, 0), received: lines.reduce((s, l) => s + l.received, 0),
        ordered_cents: lines.reduce((s, l) => s + l.quantity * (l.unit_cost_cents ?? 0), 0),
        received_cents: lines.reduce((s, l) => s + l.received * (l.unit_cost_cents ?? 0), 0),
        invoiced_cents: invoicedByPo.get(row.id as string) ?? 0,
        late: status === 'ordered' && !!row.expected_on && (row.expected_on as string) < now,
      };
    }),
  };
}

// ---------------------------------------------------------------------------
// Writing: supplier card and contacts
// ---------------------------------------------------------------------------

export type SupplierInput = Partial<Omit<Supplier, 'id' | 'created_at'>>;

function cleanSupplier(input: SupplierInput) {
  const text = (v: unknown, max: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);
  const int = (v: unknown) => (v == null || v === '' ? null : Number(v));
  const country = (text(input.country, 2) ?? 'NL').toUpperCase();
  const row = {
    name: text(input.name, 161), kvk: normalizeKvk(input.kvk) || null, vat_number: normalizeVat(input.vat_number) || null,
    iban: normalizeIban(input.iban) || null, bic: text(input.bic, 11)?.toUpperCase() ?? null, email: text(input.email, 200),
    order_email: text(input.order_email, 200), phone: text(input.phone, 40), website: text(input.website, 200), contact_name: text(input.contact_name, 120),
    street: text(input.street, 200), postcode: text(normalizePostcode(String(input.postcode ?? ''), country), 20), city: text(input.city, 100), country,
    terms_days: Number(input.terms_days ?? 30), lead_time_days: int(input.lead_time_days), min_order_cents: int(input.min_order_cents),
    customer_number: text(input.customer_number, 60), note: text(input.note, 1000), active: input.active === undefined ? true : !!input.active,
  };
  const problem = accountProblem({
    kind: null, name: row.name ?? '', kvk: row.kvk ?? '', vat_number: row.vat_number ?? '', street: row.street ?? '', postcode: row.postcode ?? '',
    city: row.city ?? '', country, invoice_email: '', email: row.email ?? '', iban: row.iban ?? '', terms_days: row.terms_days, credit_limit_cents: null,
  }, 180);
  if (problem) throw new StockError(problem === 'terms' ? 'Betalingstermijn: 0 tot 180 dagen.' : ACCOUNT_PROBLEMS[problem]);
  if (row.order_email && !validEmail(row.order_email)) throw new StockError('Controleer het bestel-e-mailadres.');
  if (row.lead_time_days !== null && (!Number.isInteger(row.lead_time_days) || row.lead_time_days < 0 || row.lead_time_days > 365)) throw new StockError('Levertijd: 0 tot 365 dagen.');
  if (row.min_order_cents !== null && (!Number.isSafeInteger(row.min_order_cents) || row.min_order_cents < 0)) throw new StockError('Controleer het minimale orderbedrag.');
  return row;
}

const duplicateName = (message: string) => message.includes('kfc_suppliers_name_key');

export async function createSupplier(input: SupplierInput, user: CrmUser): Promise<string> {
  const row = cleanSupplier(input);
  const { data, error } = await db().from('kfc_suppliers').insert({ ...row, created_by: user.id }).select('id').single();
  if (error) throw new StockError(duplicateName(error.message) ? 'Er bestaat al een leverancier met deze naam.' : `Leverancier aanmaken mislukt: ${error.message}`, duplicateName(error.message) ? 409 : 500);
  return data.id;
}

export async function updateSupplier(id: string, input: SupplierInput): Promise<void> {
  const row = cleanSupplier(input);
  const { data, error } = await db().from('kfc_suppliers').update({ ...row, updated_at: new Date().toISOString() }).eq('id', id).select('id');
  if (error) throw new StockError(duplicateName(error.message) ? 'Er bestaat al een leverancier met deze naam.' : `Leverancier bijwerken mislukt: ${error.message}`, duplicateName(error.message) ? 409 : 500);
  if (!data?.length) throw new StockError('Leverancier niet gevonden.', 404);
}

/** The supplier with this name (case-insensitive), created when new. Keeps old free-text callers working. */
export async function supplierByName(name: string, user: CrmUser): Promise<{ id: string; name: string }> {
  const clean = name.trim();
  if (!clean || clean.length > 160) throw new StockError('Kies een leverancier.');
  const found = await db().from('kfc_suppliers').select('id, name').ilike('name', clean.replace(/[\\%_]/g, (c) => '\\' + c)).limit(1);
  if (found.data?.[0]) return found.data[0];
  return { id: await createSupplier({ name: clean }, user), name: clean };
}

export async function supplierName(id: string): Promise<string | null> {
  const { data } = await db().from('kfc_suppliers').select('name').eq('id', id).maybeSingle();
  return data?.name ?? null;
}

export async function addSupplierContact(supplier: string, input: { name?: unknown; position?: unknown; email?: unknown; phone?: unknown }): Promise<void> {
  const text = (v: unknown, max: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);
  const name = text(input.name, 120);
  if (!name) throw new StockError('Vul de naam van de contactpersoon in.');
  const email = text(input.email, 200);
  if (email && !validEmail(email)) throw new StockError(ACCOUNT_PROBLEMS.email);
  const { error } = await db().from('kfc_supplier_contacts').insert({ supplier_id: supplier, name, position: text(input.position, 80), email, phone: text(input.phone, 40) });
  if (error) throw new StockError(`Contactpersoon opslaan mislukt: ${error.message}`, 500);
}

export async function removeSupplierContact(supplier: string, contact: string): Promise<void> {
  const { error } = await db().from('kfc_supplier_contacts').delete().eq('id', contact).eq('supplier_id', supplier);
  if (error) throw new StockError(`Verwijderen mislukt: ${error.message}`, 500);
}

// ---------------------------------------------------------------------------
// Writing: supplier articles and prices
// ---------------------------------------------------------------------------

export interface SupplierArticleInput { article: string; supplier_sku?: string | null; price_cents?: number | null; min_qty?: number | null; lead_time_days?: number | null; preferred?: boolean; note?: string | null }

export async function saveSupplierArticle(supplier: string, input: SupplierArticleInput): Promise<void> {
  const key = input.article.trim();
  if (!key || key.length > 80) throw new StockError('Kies een artikel.');
  const article = await db().from('kfc_articles').select('code').eq('code', key).maybeSingle();
  if (!article.data) throw new StockError('Onbekend artikel.', 404);
  const price = input.price_cents ?? null;
  if (price !== null && (!Number.isSafeInteger(price) || price < 0 || price > 100_000_000)) throw new StockError('Controleer de inkoopprijs.');
  const minQty = input.min_qty ?? 1;
  if (!Number.isInteger(minQty) || minQty < 1 || minQty > 100_000) throw new StockError('Minimale afname: 1 of meer.');
  const lead = input.lead_time_days ?? null;
  if (lead !== null && (!Number.isInteger(lead) || lead < 0 || lead > 365)) throw new StockError('Levertijd: 0 tot 365 dagen.');
  const sku = typeof input.supplier_sku === 'string' && input.supplier_sku.trim() ? input.supplier_sku.trim().slice(0, 80) : null;
  const note = typeof input.note === 'string' && input.note.trim() ? input.note.trim().slice(0, 300) : null;
  const client = db();
  // One preferred supplier per article (unique index): clear the others first.
  if (input.preferred) {
    const cleared = await client.from('kfc_supplier_articles').update({ preferred: false }).eq('article_code', article.data.code).neq('supplier_id', supplier).eq('preferred', true);
    if (cleared.error) throw new StockError(`Opslaan mislukt: ${cleared.error.message}`, 500);
  }
  const { error } = await client.from('kfc_supplier_articles').upsert({
    supplier_id: supplier, article_code: article.data.code, supplier_sku: sku, price_cents: price, min_qty: minQty, lead_time_days: lead,
    preferred: !!input.preferred, note, updated_at: new Date().toISOString(),
  }, { onConflict: 'supplier_id,article_code' });
  if (error) throw new StockError(`Opslaan mislukt: ${error.message}`, 500);
}

export async function removeSupplierArticle(supplier: string, article: string): Promise<void> {
  const { error } = await db().from('kfc_supplier_articles').delete().eq('supplier_id', supplier).eq('article_code', article);
  if (error) throw new StockError(`Verwijderen mislukt: ${error.message}`, 500);
}

// ---------------------------------------------------------------------------
// Ledger: purchase invoices, payments, credits
// ---------------------------------------------------------------------------

export interface SupplierEntryInput {
  supplier: string; type: Exclude<SupplierEntryType, 'reversal'>; amount_cents: number; key: string;
  entry_date?: string | null; due_date?: string | null; invoice_ref?: string | null; purchase_order?: string | null; vat_cents?: number | null;
  note?: string | null; allocations?: { invoice_entry_id: number; amount_cents: number }[] | null;
}

const LEDGER_ERRORS: Record<string, [string, number]> = {
  KFC_BAD_AMOUNT: ['Het bedrag moet groter dan nul zijn.', 400],
  KFC_BAD_TYPE: ['Onbekend boekingstype.', 400],
  KFC_NO_SUPPLIER: ['Leverancier niet gevonden.', 404],
  KFC_NO_PO: ['Inkooporder niet gevonden.', 404],
  KFC_PO_SUPPLIER: ['Deze inkooporder hoort bij een andere leverancier.', 409],
  KFC_INVOICE_REF: ['Vul het factuurnummer van de leverancier in.', 400],
  KFC_DUPLICATE_INVOICE: ['Deze factuur van de leverancier is al geboekt.', 409],
  KFC_BAD_ALLOCATION: ['Kies een openstaande factuur van deze leverancier.', 400],
  KFC_ALREADY_REVERSED: ['Deze boeking is al tegengeboekt.', 409],
  KFC_NO_ENTRY: ['Boeking niet gevonden.', 404],
  KFC_PERIOD_LOCKED: ['Deze periode is afgesloten. Boek op een latere datum of laat de eigenaar de periode heropenen.', 409],
};
function ledgerError(message: string, fallback: string): StockError {
  for (const [code, [text, status]] of Object.entries(LEDGER_ERRORS)) if (message.includes(code)) return new StockError(text, status);
  return new StockError(`${fallback}: ${message}`, 500);
}
const isoDate = (value: string | null | undefined) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value);

export async function postSupplierEntry(input: SupplierEntryInput, user: CrmUser): Promise<number> {
  if (!Number.isSafeInteger(input.amount_cents) || input.amount_cents === 0 || Math.abs(input.amount_cents) > 100_000_000) throw new StockError('Controleer het bedrag.');
  if (input.type !== 'opening' && input.amount_cents < 0) throw new StockError('Het bedrag moet groter dan nul zijn.');
  if (!isoDate(input.entry_date) || !isoDate(input.due_date)) throw new StockError('Controleer de datum.');
  const vat = input.vat_cents ?? 0;
  if (!Number.isSafeInteger(vat) || vat < 0 || vat > Math.abs(input.amount_cents)) throw new StockError('Controleer het btw-bedrag.');
  if (input.invoice_ref && input.invoice_ref.length > 80) throw new StockError('Factuurnummer is te lang (max. 80 tekens).');
  const { data, error } = await db().rpc('kfc_post_supplier_entry', {
    p_supplier: input.supplier, p_type: input.type, p_amount_cents: input.amount_cents, p_key: input.key,
    p_entry_date: input.entry_date || null, p_due_date: input.due_date || null, p_invoice_ref: input.invoice_ref?.trim() || null,
    p_purchase_order: input.purchase_order || null, p_vat_cents: vat, p_note: input.note?.trim().slice(0, 300) || null, p_created_by: user.id,
    p_allocations: input.allocations?.length ? input.allocations : null,
  });
  if (error) throw ledgerError(error.message, 'Boeken mislukt');
  return data as number;
}

export async function reverseSupplierEntry(entryId: number, key: string, user: CrmUser, note?: string): Promise<void> {
  const { error } = await db().rpc('kfc_reverse_supplier_entry', { p_entry: entryId, p_key: key, p_created_by: user.id, p_note: note?.slice(0, 300) || null });
  if (error) throw ledgerError(error.message, 'Tegenboeken mislukt');
}

// ---------------------------------------------------------------------------
// Reports (cariler): purchases, open orders, late deliveries, price history
// ---------------------------------------------------------------------------

export interface PurchaseFact {
  line_id: string; po_id: string; status: SupplierOrder['status']; supplier_id: string | null; supplier_name: string;
  created_at: string; ordered_at: string | null; expected_on: string | null; received_at: string | null; invoice_ref: string | null; order_date: string;
  article_code: string; article_name: string | null; sku: string | null; category: string | null;
  quantity: number; received: number; open_quantity: number; unit_cost_cents: number | null; ordered_cents: number | null; received_cents: number | null;
  last_receipt_at: string | null;
}
const FACT_COLS = 'line_id, po_id, status, supplier_id, supplier_name, created_at, ordered_at, expected_on, received_at, invoice_ref, order_date, article_code, article_name, sku, category, quantity, received, open_quantity, unit_cost_cents, ordered_cents, received_cents, last_receipt_at';

export async function purchaseFacts(filter: { from?: string; to?: string; supplier?: string; article?: string; statuses?: SupplierOrder['status'][] } = {}): Promise<PurchaseFact[]> {
  if (!isoDate(filter.from) || !isoDate(filter.to)) throw new StockError('Controleer de periode.');
  const rows = await fetchAll<PurchaseFact>((a, b) => {
    let query = db().from('kfc_purchase_line_facts').select(FACT_COLS);
    if (filter.from) query = query.gte('order_date', filter.from);
    if (filter.to) query = query.lte('order_date', filter.to);
    if (filter.supplier) query = query.eq('supplier_id', filter.supplier);
    if (filter.article) query = query.eq('article_code', filter.article);
    if (filter.statuses?.length) query = query.in('status', filter.statuses);
    return query.order('order_date', { ascending: false }).order('line_id').range(a, b);
  });
  return rows.map((r) => ({ ...r, ordered_cents: r.ordered_cents == null ? null : Number(r.ordered_cents), received_cents: r.received_cents == null ? null : Number(r.received_cents) }));
}

/** Supplier aging for the crediteuren report: every supplier with something open. */
export async function supplierAging(): Promise<(Pick<Supplier, 'id' | 'name' | 'terms_days' | 'city' | 'country'> & SupplierBalance)[]> {
  const rows = await listSuppliers();
  return rows.filter((r) => r.open_cents !== 0 || r.overdue_cents !== 0)
    .map(({ id, name, terms_days, city, country, ...balance }) => ({ id, name, terms_days, city, country, ...balance }));
}

/** Open supplier invoices, oldest due first, for the aging detail. */
export async function openSupplierInvoices(): Promise<{ entry_id: number; supplier_id: string; entry_type: SupplierEntryType; entry_date: string; due_date: string | null; invoice_ref: string | null; amount_cents: number; open_cents: number }[]> {
  return fetchAll((a, b) => db().from('kfc_supplier_invoice_open').select('entry_id, supplier_id, entry_type, entry_date, due_date, invoice_ref, amount_cents, open_cents')
    .gt('open_cents', 0).order('due_date', { ascending: true, nullsFirst: false }).order('entry_id').range(a, b));
}
