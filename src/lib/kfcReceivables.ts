import 'server-only';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { StockError } from '@/lib/kfcInventory';
import type { CrmUser } from '@/lib/crmSession';
import { ACCOUNT_PROBLEMS, accountProblem, normalizeIban, normalizeKvk, normalizePostcode, normalizeVat } from '@/lib/accountValidation';

/* The customer account (cari hesap): B2B customers, their ledger, balances and aging. Reads 0093. */

export type EntryType = 'invoice' | 'payment' | 'credit_note' | 'refund' | 'opening' | 'write_off' | 'reversal';
export interface Customer {
  id: string; company: string; contact_name: string | null; email: string | null; phone: string | null; vat_number: string | null;
  street: string | null; postcode: string | null; city: string | null; country: string; terms_days: number; credit_limit_cents: number | null;
  reverse_charge: boolean; note: string | null; created_at: string;
  /** 0120/0130: person or company; null on old billing records. Company fields from 0130. */
  account_kind: 'person' | 'company' | null; kvk: string | null; invoice_email: string | null; iban: string | null; bic: string | null; website: string | null;
}
export interface Balance { open_cents: number; overdue_cents: number; not_due: number; d1_30: number; d31_60: number; d61_90: number; d90p: number; oldest_overdue: string | null; last_entry: string | null }
export interface Entry {
  id: number; entry_type: EntryType; amount_cents: number; vat_cents: number; entry_date: string; due_date: string | null; booked_at: string;
  sales_invoice_id: string | null; invoice_number?: string | null; reverses_entry_id: number | null; note: string | null; open_cents?: number; running_cents?: number;
}

const db = () => createSupabaseAdminClient();
const COLS = 'id, company, contact_name, email, phone, vat_number, street, postcode, city, country, terms_days, credit_limit_cents, reverse_charge, note, created_at, account_kind, kvk, invoice_email, iban, bic, website';

export async function listCustomers(filter: { q?: string; overdue?: boolean } = {}): Promise<(Customer & Balance)[]> {
  let query = db().from('kfc_customers').select(COLS).is('merged_into', null).is('anonymised_at', null).order('company');
  if (filter.q) query = query.ilike('company', `%${filter.q.replace(/[%_]/g, '')}%`);
  const [customers, balances] = await Promise.all([query, db().from('kfc_customer_balance').select('*')]);
  if (customers.error) throw new StockError(`Klanten lezen mislukt: ${customers.error.message}`, 500);
  const byId = new Map((balances.data ?? []).map((b) => [b.customer_id, b]));
  const rows = (customers.data as Customer[]).map((c) => ({ ...c, ...(byId.get(c.id) ?? { open_cents: 0, overdue_cents: 0, not_due: 0, d1_30: 0, d31_60: 0, d61_90: 0, d90p: 0, oldest_overdue: null, last_entry: null }) }));
  return filter.overdue ? rows.filter((r) => r.overdue_cents > 0).sort((a, b) => (a.oldest_overdue ?? '').localeCompare(b.oldest_overdue ?? '')) : rows;
}

export async function getCustomer(id: string): Promise<{ customer: Customer; balance: Balance; entries: Entry[]; openInvoices: Entry[] } | null> {
  const [customer, balance, ledger, invoices] = await Promise.all([
    db().from('kfc_customers').select(COLS).eq('id', id).maybeSingle(),
    db().from('kfc_customer_balance').select('*').eq('customer_id', id).maybeSingle(),
    db().from('kfc_customer_ledger').select('id, entry_type, amount_cents, vat_cents, entry_date, due_date, booked_at, sales_invoice_id, reverses_entry_id, note, sales_invoices (invoice_number)').eq('customer_id', id).order('entry_date').order('booked_at').order('id'),
    db().from('kfc_invoice_open').select('entry_id, open_cents').eq('customer_id', id).gt('open_cents', 0),
  ]);
  if (customer.error) throw new StockError(`Klant lezen mislukt: ${customer.error.message}`, 500);
  if (!customer.data) return null;
  const open = new Map((invoices.data ?? []).map((i) => [i.entry_id, i.open_cents]));
  let running = 0;
  const entries: Entry[] = (ledger.data ?? []).map((row) => {
    running += row.amount_cents;
    const { sales_invoices, ...rest } = row as typeof row & { sales_invoices: { invoice_number: string } | null };
    return { ...rest, invoice_number: sales_invoices?.invoice_number ?? null, open_cents: open.get(row.id), running_cents: running } as Entry;
  });
  const b = balance.data ?? { open_cents: 0, overdue_cents: 0, not_due: 0, d1_30: 0, d31_60: 0, d61_90: 0, d90p: 0, oldest_overdue: null, last_entry: null };
  return { customer: customer.data as Customer, balance: b as Balance, entries: entries.reverse(), openInvoices: entries.filter((e) => (e.open_cents ?? 0) > 0) };
}

export type CustomerInput = Partial<Pick<Customer, 'company' | 'contact_name' | 'email' | 'phone' | 'vat_number' | 'street' | 'postcode' | 'city' | 'country' | 'terms_days' | 'credit_limit_cents' | 'reverse_charge' | 'note' | 'account_kind' | 'kvk' | 'invoice_email' | 'iban' | 'bic' | 'website'>>;

/**
 * One validation for every place that opens or edits an account (the cari
 * dialog, the relaties screen): a company needs KvK (Dutch), BTW, address and
 * invoice e-mail (src/lib/accountValidation.ts). Throws StockError with the
 * message the screen shows.
 */
export function cleanCustomer(input: CustomerInput) {
  const text = (v: unknown, max: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);
  const terms = Number(input.terms_days ?? 30);
  const limit = input.credit_limit_cents == null || input.credit_limit_cents === ('' as unknown) ? null : Number(input.credit_limit_cents);
  const country = (text(input.country, 2) ?? 'NL').toUpperCase();
  const kind = input.account_kind === 'person' || input.account_kind === 'company' ? input.account_kind : null;
  if (input.account_kind != null && !kind) throw new StockError(ACCOUNT_PROBLEMS.kind);
  const row = {
    company: text(input.company, 161), contact_name: text(input.contact_name, 120), email: text(input.email, 200), phone: text(input.phone, 40),
    vat_number: normalizeVat(input.vat_number) || null, street: text(input.street, 200), postcode: text(normalizePostcode(String(input.postcode ?? ''), country), 20),
    city: text(input.city, 100), country, terms_days: terms, credit_limit_cents: limit, reverse_charge: !!input.reverse_charge, note: text(input.note, 500),
    account_kind: kind, kvk: normalizeKvk(input.kvk) || null, invoice_email: text(input.invoice_email, 200), iban: normalizeIban(input.iban) || null,
    bic: text(input.bic, 11)?.toUpperCase() ?? null, website: text(input.website, 200),
  };
  const problem = accountProblem({
    kind, name: row.company ?? '', kvk: row.kvk ?? '', vat_number: row.vat_number ?? '', street: row.street ?? '', postcode: row.postcode ?? '',
    city: row.city ?? '', country, invoice_email: row.invoice_email ?? '', email: row.email ?? '', iban: row.iban ?? '', terms_days: terms, credit_limit_cents: limit,
  });
  if (problem) throw new StockError(ACCOUNT_PROBLEMS[problem]);
  return row;
}

export async function createCustomer(input: CustomerInput, user: CrmUser): Promise<string> {
  const row = cleanCustomer(input);
  const { data, error } = await db().from('kfc_customers').insert({ ...row, created_by: user.id }).select('id').single();
  if (error) throw new StockError(`Klant aanmaken mislukt: ${error.message}`, 500);
  return data.id;
}

export async function updateCustomer(id: string, input: CustomerInput): Promise<void> {
  const row = cleanCustomer(input);
  const { error } = await db().from('kfc_customers').update({ ...row, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw new StockError(`Klant bijwerken mislukt: ${error.message}`, 500);
}

export async function postEntry(input: { customer: string; type: Exclude<EntryType, 'invoice' | 'reversal'>; amount_cents: number; entry_date?: string | null; note?: string | null; allocations?: { invoice_entry_id: number; amount_cents: number }[] | null; key: string }, user: CrmUser): Promise<number> {
  if (!Number.isInteger(input.amount_cents) || input.amount_cents === 0 || Math.abs(input.amount_cents) > 100_000_000) throw new StockError('Controleer het bedrag.');
  if (input.entry_date && !/^\d{4}-\d{2}-\d{2}$/.test(input.entry_date)) throw new StockError('Controleer de datum.');
  const { data, error } = await db().rpc('kfc_post_entry', {
    p_customer: input.customer, p_type: input.type, p_amount_cents: input.amount_cents, p_key: input.key,
    p_entry_date: input.entry_date || null, p_note: input.note?.trim() || null, p_created_by: user.id,
    p_allocations: input.allocations?.length ? input.allocations : null,
  });
  if (error) {
    if (error.message.includes('KFC_BAD_AMOUNT')) throw new StockError('Het bedrag moet groter dan nul zijn.');
    throw new StockError(`Boeken mislukt: ${error.message}`, 500);
  }
  return data as number;
}

export async function reverseEntry(entryId: number, key: string, user: CrmUser, note?: string): Promise<void> {
  const { error } = await db().rpc('kfc_reverse_entry', { p_entry: entryId, p_key: key, p_created_by: user.id, p_note: note || null });
  if (error) {
    if (error.message.includes('KFC_ALREADY_REVERSED')) throw new StockError('Deze boeking is al tegengeboekt.', 409);
    if (error.message.includes('KFC_NO_ENTRY')) throw new StockError('Boeking niet gevonden.', 404);
    throw new StockError(`Tegenboeken mislukt: ${error.message}`, 500);
  }
}

/** For the invoice form's customer picker. */
export async function customerOptions(): Promise<Pick<Customer, 'id' | 'company' | 'email' | 'phone' | 'street' | 'postcode' | 'city' | 'vat_number' | 'terms_days'>[]> {
  const { data } = await db().from('kfc_customers').select('id, company, email, phone, street, postcode, city, vat_number, terms_days').is('merged_into', null).is('anonymised_at', null).order('company');
  return data ?? [];
}
