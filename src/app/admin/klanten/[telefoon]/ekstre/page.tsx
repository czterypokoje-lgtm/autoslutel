import { PreviewText } from '@/app/admin/PreviewLanguage';
import { notFound } from 'next/navigation';
import { IS_KEYFORCARS } from '@/config/install';
import { requireOfficeUser } from '@/lib/crmSession';
import { getCustomer } from '@/lib/kfcReceivables';

export const dynamic = 'force-dynamic';
const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const TYPE: Record<string, string> = { invoice: 'Factuur', payment: 'Betaling', credit_note: 'Creditnota', refund: 'Terugbetaling', opening: 'Beginsaldo', write_off: 'Afgeboekt', reversal: 'Tegenboeking' };

/** The statement (ekstre / rekeningoverzicht): every entry with a running balance, printable to PDF. */
export default async function StatementPage({ params }: { params: Promise<{ telefoon: string }> }) {
  if (!IS_KEYFORCARS) notFound();
  await requireOfficeUser('/admin/klanten');
  const { telefoon: id } = await params;
  if (!/^[a-f0-9-]{36}$/i.test(id)) notFound();
  const data = await getCustomer(id);
  if (!data) notFound();
  const { customer, balance, entries } = data;
  const rows = [...entries].reverse();
  return (
    <div className="mx-auto max-w-3xl bg-white p-4 text-sm text-black sm:p-8 print:p-0">
      <style>{`@media print { aside, header, [data-slot=sidebar-wrapper] > :not([data-slot=sidebar-inset]) { display: none !important } }`}</style>
      <div className="mb-6 flex items-start justify-between">
        <div><h1 className="text-xl font-semibold">Rekeningoverzicht · Ekstre</h1><p>{customer.company}</p>{customer.street && <p>{customer.street}, {customer.postcode} {customer.city}</p>}{customer.vat_number && <p><PreviewText>{"Btw"}</PreviewText> {customer.vat_number}</p>}</div>
        <div className="text-right"><p>KeyForCars</p><p>{new Date().toLocaleDateString('nl-NL')}</p><p className="mt-2 text-lg font-semibold">Open: {MONEY.format(balance.open_cents / 100)}</p>{balance.overdue_cents > 0 && <p className="font-semibold text-red-700">Vervallen: {MONEY.format(balance.overdue_cents / 100)}</p>}</div>
      </div>
      <table className="w-full border-collapse">
        <thead><tr className="border-b text-left"><th className="py-1"><PreviewText>{"Datum"}</PreviewText></th><th><PreviewText>{"Soort"}</PreviewText></th><th><PreviewText>{"Omschrijving"}</PreviewText></th><th><PreviewText>{"Vervalt"}</PreviewText></th><th className="text-right"><PreviewText>{"Debet"}</PreviewText></th><th className="text-right">Credit</th><th className="text-right"><PreviewText>{"Saldo"}</PreviewText></th></tr></thead>
        <tbody>
          {rows.map((e) => (
            <tr key={e.id} className="border-b border-gray-200">
              <td className="py-1">{e.entry_date}</td><td>{TYPE[e.entry_type]}</td><td>{e.note ?? e.invoice_number ?? ''}</td><td>{e.due_date ?? ''}</td>
              <td className="text-right tabular-nums">{e.amount_cents > 0 ? MONEY.format(e.amount_cents / 100) : ''}</td>
              <td className="text-right tabular-nums">{e.amount_cents < 0 ? MONEY.format(-e.amount_cents / 100) : ''}</td>
              <td className="text-right tabular-nums">{MONEY.format((e.running_cents ?? 0) / 100)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-6 text-xs text-gray-500">Betalingstermijn {customer.terms_days} dagen. Vragen over dit overzicht: antwoord op de factuurmail.</p>
      <p className="mt-4 text-xs text-gray-500 print:hidden">Opslaan als PDF: Ctrl+P of ⌘P, bestemming &quot;Opslaan als PDF&quot;.</p>
    </div>
  );
}
