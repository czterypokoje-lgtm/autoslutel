import { format, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';

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

/* The A4 sheet. Dutch only: it is what the customer receives. */
export function InvoicePaper({ invoice }: { invoice: InvoiceFormValues }) {
  const { items, rate, discount, vat, credit, total } = getInvoiceTotals(invoice);
  const discountValue = Number.isFinite(invoice.discountValue) ? invoice.discountValue : 0;
  const discountLabel = invoice.discountType === 'percent' ? `Korting ${discountValue}%` : 'Korting';
  /* The due date is never typed: the ledger derives it from the invoice date. */
  const dueDate = getInvoiceDueDate(invoice);
  const { from, to } = invoice;

  return (
    <article
      style={{ width: INVOICE_PAPER_WIDTH, height: INVOICE_PAPER_HEIGHT }}
      data-print-paper
      className="relative flex flex-col gap-24 bg-neutral-50 px-12.25 py-11 font-mono text-neutral-950"
    >
      <header className="flex flex-col gap-10">
        <div className="grid grid-cols-2 items-start gap-14">
          <svg className="size-12" viewBox="0 0 48 48" aria-hidden="true">
            <rect width="20" height="20" rx="3" fill="currentColor" />
            <rect x="28" width="20" height="20" rx="3" fill="currentColor" />
            <rect y="28" width="20" height="20" rx="3" fill="currentColor" />
            <rect x="28" y="28" width="20" height="20" rx="3" fill="currentColor" />
          </svg>
          <h2 className="text-4xl tracking-widest uppercase">Factuur</h2>
        </div>

        <section className="grid grid-cols-2 gap-14 text-sm leading-relaxed">
          <div>
            <p>Factuurnummer: {invoice.referenceNumber || 'volgt bij opslaan'}</p>
            <p>Factuurdatum: {paperDate(invoice.issuedDate)}</p>
            <p>Vervaldatum: {paperDate(dueDate)}</p>
          </div>
          <div>
            <p>Betaling</p>
            <p>IBAN {from.iban || '—'}</p>
            <p>t.n.v. {from.accountName || from.name}</p>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-14 text-sm leading-relaxed">
          <div>
            <p className="mb-4 font-semibold uppercase">Van</p>
            <p>{from.name}</p>
            {addressLines(from).map((line) => (
              <p key={line}>{line}</p>
            ))}
            {from.kvk && <p>KvK: {from.kvk}</p>}
            {from.btw && <p>Btw-nr: {from.btw}</p>}
          </div>
          <div>
            <p className="mb-4 font-semibold uppercase">Aan</p>
            <p>{to.name || (to.id === WALK_IN_ID ? 'Particulier / contant' : '')}</p>
            {addressLines(to).map((line) => (
              <p key={line}>{line}</p>
            ))}
            {to.btw && <p>Btw-nr: {to.btw}</p>}
          </div>
        </section>
      </header>

      <div className="flex flex-col gap-5">
        <section className="text-sm">
          <div className="grid grid-cols-[1fr_74px_116px_116px] bg-stone-200 px-3 py-3 font-semibold uppercase">
            <span>Omschrijving</span>
            <span className="text-right">Aantal</span>
            <span className="text-right">Prijs</span>
            <span className="text-right">Totaal</span>
          </div>
          {items.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[1fr_74px_116px_116px] border-b border-[oklch(0.86_0_0)] px-3 py-4"
            >
              <span>{item.description}</span>
              <span className="text-right">{item.quantity}</span>
              <span className="text-right">{formatInvoiceCurrency(item.unitPrice)}</span>
              <span className="text-right">{formatInvoiceCurrency(getLineAmount(item))}</span>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-2 gap-14 text-sm leading-relaxed">
          <section className="col-start-2 space-y-2">
            <div>
              <div className="flex justify-between gap-8">
                <span>Netto</span>
                <span>{formatInvoiceCurrency(getInvoiceSubtotal(invoice))}</span>
              </div>
              <div className="flex justify-between gap-8">
                <span>{discountLabel}</span>
                <span>{formatInvoiceCurrency(discount)}</span>
              </div>
              <div className="flex justify-between gap-8">
                <span>Btw {rate}%</span>
                <span>{formatInvoiceCurrency(vat)}</span>
              </div>
              {credit > 0 && (
                <div className="flex justify-between gap-8">
                  <span>Credit</span>
                  <span>-{formatInvoiceCurrency(credit)}</span>
                </div>
              )}
            </div>
            <div className="border-y-2 border-current py-3">
              <div className="flex justify-between gap-8">
                <span className="font-semibold uppercase">Te betalen</span>
                <span className="font-semibold">{formatInvoiceCurrency(total)}</span>
              </div>
            </div>
          </section>
        </div>

        {invoice.notes && <p className="text-sm leading-relaxed whitespace-pre-line">{invoice.notes}</p>}
      </div>

      <footer className="absolute right-12.25 bottom-11 left-12.25 grid grid-cols-2 gap-14 text-sm leading-relaxed text-neutral-500">
        <div>
          <p>{from.email}</p>
          <p>{from.phone}</p>
          <p>{from.website}</p>
        </div>
        <div>
          <p>Gelieve te betalen vóór {paperDate(dueDate)}.</p>
          <p>Opgesteld door {from.name}</p>
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
