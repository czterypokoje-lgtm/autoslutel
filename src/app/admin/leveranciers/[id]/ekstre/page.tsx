import { notFound } from 'next/navigation';
import { PreviewText } from '@/app/admin/PreviewLanguage';
import { BRAND, WAREHOUSE } from '@/config/install';
import { CRM_PREVIEW } from '@/lib/supabase/env';
import { requireOfficeUser } from '@/lib/crmSession';
import { getSupplier } from '@/lib/kfcSuppliers';

export const dynamic = 'force-dynamic';
const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const TYPE: Record<string, string> = { invoice: 'Inkoopfactuur', payment: 'Betaling', credit_note: 'Creditnota', refund: 'Terugbetaling', opening: 'Beginsaldo', write_off: 'Afgeboekt', reversal: 'Tegenboeking' };
const BUCKETS: [string, string][] = [['not_due', 'Niet vervallen'], ['d1_30', '0–30'], ['d31_60', '31–60'], ['d61_90', '61–90'], ['d90p', '> 90']];

/**
 * Supplier statement (ekstre / rekeningoverzicht crediteur): every entry with
 * a running balance and the aging, printable to PDF. ?van=YYYY-MM-DD starts
 * the list at a date with the balance brought forward.
 */
export default async function SupplierStatement({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ van?: string }> }) {
  if (!WAREHOUSE || CRM_PREVIEW) notFound();
  await requireOfficeUser('/admin/leveranciers');
  const { id } = await params;
  if (!/^[a-f0-9-]{36}$/i.test(id)) notFound();
  const data = await getSupplier(id);
  if (!data) notFound();
  const { supplier, balance, entries } = data;
  const { van } = await searchParams;
  const from = van && /^\d{4}-\d{2}-\d{2}$/.test(van) ? van : null;
  const all = [...entries].reverse();
  const before = from ? all.filter((e) => e.entry_date < from) : [];
  const rows = from ? all.filter((e) => e.entry_date >= from) : all;
  const carried = before.length ? before[before.length - 1].running_cents ?? 0 : 0;
  return (
    <div className="mx-auto max-w-3xl bg-white p-4 text-sm text-black sm:p-8 print:p-0">
      <style>{`@media print { aside, header, [data-slot=sidebar-wrapper] > :not([data-slot=sidebar-inset]) { display: none !important } }`}</style>
      <div className="mb-6 flex items-start justify-between gap-6">
        <div>
          <h1 className="text-xl font-semibold"><PreviewText>Rekeningoverzicht leverancier</PreviewText> · Ekstre</h1>
          <p className="font-medium">{supplier.name}</p>
          {supplier.street && <p>{supplier.street}, {supplier.postcode} {supplier.city} {supplier.country !== 'NL' && supplier.country}</p>}
          {supplier.kvk && <p>KvK {supplier.kvk}</p>}
          {supplier.vat_number && <p><PreviewText>Btw</PreviewText> {supplier.vat_number}</p>}
          {supplier.iban && <p>IBAN {supplier.iban}</p>}
          {supplier.customer_number && <p><PreviewText>Ons klantnummer</PreviewText> {supplier.customer_number}</p>}
        </div>
        <div className="text-right">
          <p>{BRAND.name}</p>
          <p>{new Date().toLocaleDateString('nl-NL', { timeZone: 'Europe/Amsterdam' })}</p>
          <p className="mt-2 text-lg font-semibold"><PreviewText>Te betalen</PreviewText>: {MONEY.format(balance.open_cents / 100)}</p>
          {balance.overdue_cents > 0 && <p className="font-semibold text-red-700"><PreviewText>Vervallen</PreviewText>: {MONEY.format(balance.overdue_cents / 100)}</p>}
        </div>
      </div>
      <form className="mb-3 flex items-center gap-2 print:hidden">
        <label className="text-xs"><PreviewText>Vanaf datum</PreviewText> <input type="date" name="van" defaultValue={from ?? ''} className="rounded border px-1" /></label>
        <button className="rounded border px-2 text-xs"><PreviewText>Toon</PreviewText></button>
      </form>
      <table className="w-full border-collapse">
        <thead><tr className="border-b text-left">
          <th className="py-1"><PreviewText>Datum</PreviewText></th><th><PreviewText>Soort</PreviewText></th><th><PreviewText>Factuurnr. / omschrijving</PreviewText></th><th><PreviewText>Vervalt</PreviewText></th>
          <th className="text-right"><PreviewText>Debet</PreviewText></th><th className="text-right">Credit</th><th className="text-right"><PreviewText>Saldo</PreviewText></th>
        </tr></thead>
        <tbody>
          {from && <tr className="border-b border-gray-200 italic"><td className="py-1">{from}</td><td colSpan={5}><PreviewText>Saldo van eerdere boekingen</PreviewText></td><td className="text-right tabular-nums">{MONEY.format(carried / 100)}</td></tr>}
          {rows.map((e) => (
            <tr key={e.id} className="border-b border-gray-200">
              <td className="py-1">{e.entry_date}</td><td>{TYPE[e.entry_type]}</td><td>{[e.invoice_ref, e.note].filter(Boolean).join(' · ')}</td><td>{e.due_date ?? ''}</td>
              <td className="text-right tabular-nums">{e.amount_cents < 0 ? MONEY.format(-e.amount_cents / 100) : ''}</td>
              <td className="text-right tabular-nums">{e.amount_cents > 0 ? MONEY.format(e.amount_cents / 100) : ''}</td>
              <td className="text-right tabular-nums">{MONEY.format((e.running_cents ?? 0) / 100)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <table className="mt-6 w-full border-collapse text-xs">
        <thead><tr className="border-b">{BUCKETS.map(([, label]) => <th key={label} className="py-1 text-right">{label}</th>)}</tr></thead>
        <tbody><tr>{BUCKETS.map(([key]) => <td key={key} className="py-1 text-right tabular-nums">{MONEY.format(Number(balance[key as keyof typeof balance] ?? 0) / 100)}</td>)}</tr></tbody>
      </table>
      <p className="mt-6 text-xs text-gray-500"><PreviewText>Betalingstermijn</PreviewText> {supplier.terms_days} <PreviewText>dagen</PreviewText>.</p>
      <p className="mt-4 text-xs text-gray-500 print:hidden"><PreviewText>Opslaan als PDF: Ctrl+P of ⌘P, bestemming &quot;Opslaan als PDF&quot;.</PreviewText></p>
    </div>
  );
}
