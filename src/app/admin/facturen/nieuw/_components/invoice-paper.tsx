import { PreviewText } from '@/app/admin/PreviewLanguage';
import { format, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';

import { IS_KEYFORCARS } from '@/config/install';
import { formatCurrency } from '@/lib/utils';

import {
  addressLines,
  getInvoiceDueDate,
  getInvoiceSubtotal,
  getInvoiceTotals,
  getLineAmount,
  INVOICE_PAPER_HEIGHT,
  INVOICE_PAPER_WIDTH,
  type InvoiceFormValues,
  WALK_IN_ID,
} from './data';

/*
 * The A4 sheet. Dutch only: it is what the customer receives.
 *
 * One page by construction: fixed A4 box, a footer pinned to the bottom, and
 * the line table takes whatever is left in between. Proportional type, the
 * logo at the top left (/logo.png is Autosleutel24's mark; another install
 * prints its own name), the invoice facts at the top right.
 */
export function InvoicePaper({ invoice }: { invoice: InvoiceFormValues }) {
  const { items, rate, discount, vat, credit, total } = getInvoiceTotals(invoice);
  const discountValue = Number.isFinite(invoice.discountValue) ? invoice.discountValue : 0;
  const discountLabel = invoice.discountType === 'percent' ? `Korting ${discountValue}%` : 'Korting';
  /* The due date is never typed: the ledger derives it from the invoice date. */
  const dueDate = getInvoiceDueDate(invoice);
  const { from, to } = invoice;
  const cols = 'grid grid-cols-[1fr_64px_108px_108px] gap-x-3';

  return (
    <article
      style={{ width: INVOICE_PAPER_WIDTH, height: INVOICE_PAPER_HEIGHT }}
      data-print-paper
      className="relative flex flex-col bg-white px-14 pt-12 pb-32 font-sans text-[13px] leading-normal text-neutral-900"
    >
      <header className="flex items-start justify-between gap-10">
        {IS_KEYFORCARS
          ? <strong className="text-2xl tracking-tight">{from.name}</strong>
          // eslint-disable-next-line @next/next/no-img-element
          : <img src="/logo.png" alt={from.name} width={190} height={56} className="h-14 w-auto" />}
        <div className="text-right">
          <h2 className="text-3xl font-semibold tracking-wide text-neutral-950"><PreviewText>{"Factuur"}</PreviewText></h2>
          <p className="mt-2">{invoice.referenceNumber ? <>Factuurnummer <strong>{invoice.referenceNumber}</strong></> : <span className="text-neutral-500">Factuurnummer volgt bij opslaan</span>}</p>
          <p>Factuurdatum {paperDate(invoice.issuedDate)}</p>
          <p>Vervaldatum {paperDate(dueDate)}</p>
        </div>
      </header>

      <section className="mt-10 grid grid-cols-2 gap-10">
        <div>
          <p className="mb-1 text-[11px] font-semibold tracking-wider text-neutral-500 uppercase"><PreviewText>{"Van"}</PreviewText></p>
          <p className="font-semibold">{from.name}</p>
          {addressLines(from).map((line) => <p key={line}>{line}</p>)}
          {from.kvk && <p>KvK {from.kvk}</p>}
          {from.btw && <p>Btw-id {from.btw}</p>}
        </div>
        <div>
          <p className="mb-1 text-[11px] font-semibold tracking-wider text-neutral-500 uppercase">Aan</p>
          <p className="font-semibold">{to.name || (to.id === WALK_IN_ID ? 'Particulier / contant' : '')}</p>
          {addressLines(to).map((line) => <p key={line}>{line}</p>)}
          {to.btw && <p>Btw-id {to.btw}</p>}
        </div>
      </section>

      <section className="mt-10">
        <div className={`${cols} border-b-2 border-neutral-900 pb-2 text-[11px] font-semibold tracking-wider text-neutral-600 uppercase`}>
          <span><PreviewText>{"Omschrijving"}</PreviewText></span>
          <span className="text-right"><PreviewText>{"Aantal"}</PreviewText></span>
          <span className="text-right"><PreviewText>{"Prijs"}</PreviewText></span>
          <span className="text-right"><PreviewText>{"Totaal"}</PreviewText></span>
        </div>
        {items.map((item) => (
          <div key={item.id} className={`${cols} border-b border-neutral-200 py-2.5`}>
            <span>{item.description}</span>
            <span className="text-right tabular-nums">{item.quantity}</span>
            <span className="text-right tabular-nums">{formatInvoiceCurrency(item.unitPrice)}</span>
            <span className="text-right tabular-nums">{formatInvoiceCurrency(getLineAmount(item))}</span>
          </div>
        ))}
      </section>

      <section className="mt-5 ml-auto w-[300px] space-y-1 tabular-nums">
        <div className="flex justify-between"><span>Netto</span><span>{formatInvoiceCurrency(getInvoiceSubtotal(invoice))}</span></div>
        {discount > 0 && <div className="flex justify-between"><span>{discountLabel}</span><span>-{formatInvoiceCurrency(discount)}</span></div>}
        <div className="flex justify-between"><span><PreviewText>{"Btw"}</PreviewText> {rate}%</span><span>{formatInvoiceCurrency(vat)}</span></div>
        {credit > 0 && <div className="flex justify-between"><span>Credit</span><span>-{formatInvoiceCurrency(credit)}</span></div>}
        <div className="mt-2 flex justify-between border-t-2 border-neutral-900 pt-2 text-base font-semibold">
          <span className="uppercase">Te betalen</span><span>{formatInvoiceCurrency(total)}</span>
        </div>
      </section>

      {invoice.notes && <p className="mt-6 whitespace-pre-line text-neutral-700">{invoice.notes}</p>}

      <footer className="absolute right-14 bottom-12 left-14 grid grid-cols-2 gap-10 border-t border-neutral-200 pt-4 text-[12px] leading-relaxed text-neutral-600">
        <div>
          <p className="font-semibold text-neutral-800">Betaling</p>
          <p>Gelieve te betalen vóór {paperDate(dueDate)} op IBAN {from.iban || '—'}</p>
          <p>t.n.v. {from.accountName || from.name}{invoice.referenceNumber ? <>, o.v.v. {invoice.referenceNumber}</> : null}</p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-neutral-800">{from.name}</p>
          {[from.email, from.phone, from.website].filter(Boolean).map((line) => <p key={String(line)}>{line}</p>)}
        </div>
      </footer>
    </article>
  );
}

function paperDate(value: string) {
  const date = parseISO(value);
  return Number.isNaN(date.getTime()) ? '—' : format(date, 'd MMMM yyyy', { locale: nl });
}

function formatInvoiceCurrency(value: number) {
  return formatCurrency(Number.isFinite(value) ? value : 0, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
