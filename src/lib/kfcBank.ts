import 'server-only';
import { createHash } from 'node:crypto';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { StockError } from '@/lib/kfcInventory';
import type { CrmUser } from '@/lib/crmSession';

/*
 * Bank statements for the customer accounts: a CAMT.053 or CSV export is
 * parsed into lines, money in is matched to a customer (and an invoice), money
 * out and payment-provider payouts are set aside. No bank connection: a file,
 * monthly or weekly, is enough for B2B receivables.
 */

export interface BankLine {
  id: string; iban: string; entry_ref: string; booked_on: string; amount_cents: number; counterparty_name: string | null; counterparty_iban: string | null;
  description: string | null; status: 'open' | 'matched' | 'ignored'; ignore_reason: string | null; matched_entry_id: number | null; matched_at: string | null;
}
export interface ParsedLine { iban: string; entry_ref: string; booked_on: string; amount_cents: number; counterparty_name: string | null; counterparty_iban: string | null; description: string | null; raw: unknown }
export interface Suggestion { customer_id: string; company: string; invoice_entry_id: number | null; invoice_number: string | null; open_cents: number | null; reason: string }

const db = () => createSupabaseAdminClient();
const PSP = /\b(mollie|stripe|paypal|adyen|buckaroo|multisafepay|pay\.nl|klarna|ideal)\b/i;
const tag = (xml: string, name: string) => xml.match(new RegExp(`<${name}[^>]*>([^<]*)</${name}>`))?.[1]?.trim() ?? null;
const cents = (text: string) => Math.round(Number(text.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '')) * 100);

/** CAMT.053: one <Ntry> per line. Regex is enough for the fields we keep. */
export function parseCamt053(xml: string): ParsedLine[] {
  const iban = xml.match(/<Acct>[\s\S]*?<IBAN>([^<]+)<\/IBAN>/)?.[1]?.trim() ?? 'onbekend';
  const entries = xml.match(/<Ntry>[\s\S]*?<\/Ntry>/g) ?? [];
  return entries.map((entry, index) => {
    const amount = Math.round(Number(tag(entry, 'Amt') ?? '0') * 100);
    const credit = tag(entry, 'CdtDbtInd') === 'CRDT';
    const party = credit ? entry.match(/<Dbtr>[\s\S]*?<Nm>([^<]*)<\/Nm>/)?.[1] : entry.match(/<Cdtr>[\s\S]*?<Nm>([^<]*)<\/Nm>/)?.[1];
    const partyIban = credit ? entry.match(/<DbtrAcct>[\s\S]*?<IBAN>([^<]*)<\/IBAN>/)?.[1] : entry.match(/<CdtrAcct>[\s\S]*?<IBAN>([^<]*)<\/IBAN>/)?.[1];
    const booked = entry.match(/<BookgDt>[\s\S]*?<Dt>([^<]*)<\/Dt>/)?.[1] ?? entry.match(/<ValDt>[\s\S]*?<Dt>([^<]*)<\/Dt>/)?.[1] ?? '';
    const description = (entry.match(/<Ustrd>([^<]*)<\/Ustrd>/g) ?? []).map((u) => u.replace(/<\/?Ustrd>/g, '')).join(' ').trim() || tag(entry, 'AddtlNtryInf');
    const ref = tag(entry, 'NtryRef') ?? tag(entry, 'AcctSvcrRef') ?? tag(entry, 'EndToEndId')
      ?? createHash('sha1').update(`${booked}|${amount}|${party}|${description}|${index}`).digest('hex').slice(0, 24);
    return { iban, entry_ref: ref, booked_on: booked.slice(0, 10), amount_cents: credit ? amount : -amount, counterparty_name: party?.trim() ?? null, counterparty_iban: partyIban?.trim() ?? null, description: description ?? null, raw: { source: 'camt053' } };
  }).filter((line) => line.booked_on && line.amount_cents !== 0);
}

/** Generic Dutch bank CSV: the header names the columns; ; or , separated. */
export function parseCsv(text: string): ParsedLine[] {
  const rows = text.replace(/^﻿/, '').split(/\r?\n/).filter((r) => r.trim());
  if (rows.length < 2) return [];
  const sep = (rows[0].match(/;/g) ?? []).length >= (rows[0].match(/,/g) ?? []).length ? ';' : ',';
  const split = (row: string) => row.match(new RegExp(`("([^"]|"")*"|[^${sep}]*)(${sep}|$)`, 'g'))!.map((c) => c.replace(new RegExp(`${sep}$`), '').replace(/^"|"$/g, '').replace(/""/g, '"').trim()).slice(0, -1);
  const header = split(rows[0]).map((h) => h.toLowerCase());
  const col = (...names: RegExp[]) => header.findIndex((h) => names.some((n) => n.test(h)));
  const iDate = col(/^(datum|date|boekdatum|transactiedatum|rentedatum)/), iAmount = col(/bedrag|amount/), iName = col(/naam|name|tegenpartij|omschrijving tegen/);
  const iIban = col(/tegenrekening|iban tegen|counter.*iban|tegen.*iban/), iDesc = col(/omschrijving|mededeling|description|notificat/), iRef = col(/referentie|reference|volgnr|transactie.?id/);
  const iOwn = col(/^rekening|^iban$|^account/), iSign = col(/af bij|debet.?credit|credit.?debit|mutatiesoort/);
  if (iDate < 0 || iAmount < 0) throw new StockError('Kolommen voor datum en bedrag niet gevonden. Exporteer met kopregel.');
  return rows.slice(1).map((row, index) => {
    const c = split(row);
    const date = c[iDate] ?? '';
    const dmy = date.match(/^(\d{2})[-/](\d{2})[-/](\d{4})/);
    const booked = /^\d{4}-\d{2}-\d{2}/.test(date) ? date.slice(0, 10) : /^\d{8}$/.test(date) ? `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}` : dmy ? `${dmy[3]}-${dmy[2]}-${dmy[1]}` : '';
    let amount = cents(c[iAmount] ?? '0');
    if (iSign >= 0 && /^(af|debet|d|debit)$/i.test(c[iSign] ?? '')) amount = -Math.abs(amount);
    const name = iName >= 0 ? c[iName] || null : null, desc = iDesc >= 0 ? c[iDesc] || null : null;
    const ref = (iRef >= 0 && c[iRef]) || createHash('sha1').update(`${booked}|${amount}|${name}|${desc}|${index}`).digest('hex').slice(0, 24);
    return { iban: (iOwn >= 0 && c[iOwn]) || 'onbekend', entry_ref: ref, booked_on: booked, amount_cents: amount, counterparty_name: name, counterparty_iban: iIban >= 0 ? c[iIban] || null : null, description: desc, raw: { source: 'csv', row: c } };
  }).filter((line) => line.booked_on && line.amount_cents !== 0);
}

/** Store parsed lines; duplicates by (iban, ref) are skipped. Debits and PSP payouts start as ignored. */
export async function importLines(lines: ParsedLine[]): Promise<{ added: number; skipped: number; ignored: number }> {
  if (!lines.length) throw new StockError('Geen regels gevonden in dit bestand.');
  let added = 0, skipped = 0, ignored = 0;
  for (const line of lines) {
    const reason = line.amount_cents < 0 ? 'uitgaand' : PSP.test(`${line.counterparty_name} ${line.description}`) ? 'betaalprovider' : null;
    const { data, error } = await db().from('kfc_bank_lines').upsert({ ...line, status: reason ? 'ignored' : 'open', ignore_reason: reason }, { onConflict: 'iban,entry_ref', ignoreDuplicates: true }).select('id');
    if (error) throw new StockError(`Bankregel opslaan mislukt: ${error.message}`, 500);
    if (data?.length) { added++; if (reason) ignored++; } else skipped++;
  }
  return { added, skipped, ignored };
}

export async function listLines(status: BankLine['status']): Promise<BankLine[]> {
  const { data, error } = await db().from('kfc_bank_lines').select('id, iban, entry_ref, booked_on, amount_cents, counterparty_name, counterparty_iban, description, status, ignore_reason, matched_entry_id, matched_at').eq('status', status).order('booked_on', { ascending: false }).limit(300);
  if (error) throw new StockError(`Bankregels lezen mislukt: ${error.message}`, 500);
  return data as BankLine[];
}

/** Per open line: the customer whose name matches, or whose open invoice matches the amount or is named in the description. */
export async function suggest(lines: BankLine[]): Promise<Record<string, Suggestion[]>> {
  const [customers, invoices] = await Promise.all([
    db().from('kfc_customers').select('id, company').is('merged_into', null).is('anonymised_at', null),
    db().from('kfc_invoice_open').select('entry_id, customer_id, open_cents, sales_invoices (invoice_number)').gt('open_cents', 0),
  ]);
  const companies = (customers.data ?? []) as { id: string; company: string }[];
  const open = ((invoices.data ?? []) as unknown as { entry_id: number; customer_id: string; open_cents: number; sales_invoices: { invoice_number: string } | null }[]);
  const byCustomer = new Map(companies.map((c) => [c.id, c.company]));
  const result: Record<string, Suggestion[]> = {};
  for (const line of lines) {
    const hay = `${line.counterparty_name ?? ''} ${line.description ?? ''}`.toLowerCase();
    const found: Suggestion[] = [];
    for (const inv of open) {
      const number = inv.sales_invoices?.invoice_number ?? null;
      if (number && hay.includes(number.toLowerCase())) found.push({ customer_id: inv.customer_id, company: byCustomer.get(inv.customer_id) ?? '', invoice_entry_id: inv.entry_id, invoice_number: number, open_cents: inv.open_cents, reason: 'factuurnummer in omschrijving' });
      else if (inv.open_cents === line.amount_cents) found.push({ customer_id: inv.customer_id, company: byCustomer.get(inv.customer_id) ?? '', invoice_entry_id: inv.entry_id, invoice_number: number, open_cents: inv.open_cents, reason: 'bedrag gelijk aan open factuur' });
    }
    for (const c of companies) {
      const words = c.company.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 4 && !['auto', 'sleutel'].includes(w));
      if (words.some((w) => hay.includes(w)) && !found.some((f) => f.customer_id === c.id)) found.push({ customer_id: c.id, company: c.company, invoice_entry_id: null, invoice_number: null, open_cents: null, reason: 'naam komt overeen' });
    }
    result[line.id] = found.slice(0, 3);
  }
  return result;
}

export async function matchLine(lineId: string, customerId: string, invoiceEntryId: number | null, key: string, user: CrmUser): Promise<void> {
  const allocations = invoiceEntryId ? [{ invoice_entry_id: invoiceEntryId, amount_cents: 100_000_000 }] : null; // capped to the entry amount by the function
  const { error } = await db().rpc('kfc_match_bank_line', { p_line: lineId, p_customer: customerId, p_key: key, p_created_by: user.id, p_allocations: allocations });
  if (error) {
    if (error.message.includes('KFC_NOT_A_RECEIPT')) throw new StockError('Alleen ontvangen bedragen kunnen aan een klant gekoppeld worden.', 409);
    throw new StockError(`Koppelen mislukt: ${error.message}`, 500);
  }
}

export async function setLineStatus(lineId: string, status: 'open' | 'ignored', reason?: string): Promise<void> {
  const { error } = await db().from('kfc_bank_lines').update({ status, ignore_reason: status === 'ignored' ? (reason ?? 'handmatig') : null }).eq('id', lineId).neq('status', 'matched');
  if (error) throw new StockError(`Bijwerken mislukt: ${error.message}`, 500);
}
