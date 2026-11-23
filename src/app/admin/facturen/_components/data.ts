import { invoiceDay, invoiceDueDate, invoiceToday, PAYMENT_REMINDER_DAYS, PAYMENT_TERM_DAYS } from '@/lib/invoiceDue';

/*
 * Row shape and money/date rules for the Studio facturen list. Every rule here
 * is the one FacturenTable.tsx already applied — the due-soon count, what
 * counts as "te laat", the month-over-month paid comparison — moved out of the
 * old component so the shadcn table and the CSS-module table cannot drift.
 */

export interface InvoiceRow {
  id: string;
  invoice_number: string;
  issue_date: string;
  client_name: string;
  client_city: string | null;
  client_email: string | null;
  client_phone: string | null;
  total: number | string;
  status: 'concept' | 'verzonden' | 'betaald';
  technician_name: string | null;
  logo: string | null;
  job?: {
    id: string;
    car_make: string | null;
    car_model: string | null;
    kenteken: string | null;
    service_type: string | null;
  } | null;
}

/** The filter keys, which double as the status column's values. */
export type InvoiceFilter = 'alle' | 'concept' | 'open' | 'laat' | 'betaald';

export const ALL: InvoiceFilter = 'alle';

export const invoiceFilters: { id: InvoiceFilter; label: string }[] = [
  { id: 'alle', label: 'Alle' },
  { id: 'concept', label: 'Concept' },
  { id: 'open', label: 'Openstaand' },
  { id: 'laat', label: 'Te laat' },
  { id: 'betaald', label: 'Betaald' },
];

/** Verzonden and past the payment term — the same test the old list used. */
export const isOverdue = (row: { status: string; issue_date: string }) =>
  row.status === 'verzonden' && invoiceDay(row.issue_date) + PAYMENT_TERM_DAYS < invoiceDay(invoiceToday());

/** Which bucket a row sits in: the status column's accessor and the chip filter share it. */
export function invoiceBucket(row: InvoiceRow): Exclude<InvoiceFilter, 'alle'> {
  if (row.status === 'betaald') return 'betaald';
  if (row.status === 'concept') return 'concept';
  return isOverdue(row) ? 'laat' : 'open';
}

export const bucketLabel: Record<Exclude<InvoiceFilter, 'alle'>, string> = {
  concept: 'Concept',
  open: 'Openstaand',
  laat: 'Te laat',
  betaald: 'Betaald',
};

export const bucketMeta: Record<Exclude<InvoiceFilter, 'alle'>, { badgeClass: string; dotClass: string }> = {
  concept: {
    badgeClass: 'border-border bg-muted/40 text-muted-foreground',
    dotClass: 'bg-muted-foreground',
  },
  open: {
    badgeClass: 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400',
    dotClass: 'bg-amber-500',
  },
  laat: {
    badgeClass: 'border-destructive/20 bg-destructive/10 text-destructive',
    dotClass: 'bg-destructive',
  },
  betaald: {
    badgeClass: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    dotClass: 'bg-emerald-500',
  },
};

export const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

export const dateFormatter = (english: boolean) =>
  new Intl.DateTimeFormat(english ? 'en-GB' : 'nl-NL', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

/** Auto van de klus, of niets als er geen klus aan hangt. */
export const carOf = (row: InvoiceRow) =>
  row.job ? [row.job.car_make, row.job.car_model].filter(Boolean).join(' ') || 'Auto' : null;

/** The three headline numbers above the table, unchanged from the old list. */
export function invoiceMetrics(rows: InvoiceRow[]) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const sum = (list: InvoiceRow[]) => list.reduce((total, row) => total + (Number(row.total) || 0), 0);
  const open = rows.filter((row) => row.status === 'verzonden' && !isOverdue(row));
  const late = rows.filter((row) => isOverdue(row));
  const paid = rows.filter((row) => row.status === 'betaald');
  const paidThis = sum(paid.filter((row) => new Date(row.issue_date) >= monthStart));
  const paidPrev = sum(paid.filter((row) => {
    const date = new Date(row.issue_date);
    return date >= prevStart && date < monthStart;
  }));
  return {
    open: { n: open.length, sum: sum(open) },
    late: { n: late.length, sum: sum(late) },
    concept: rows.filter((row) => row.status === 'concept').length,
    paidThis,
    paidPrev,
    change: paidPrev > 0 ? Math.round(((paidThis - paidPrev) / paidPrev) * 100) : null,
  };
}

export { invoiceDueDate, PAYMENT_REMINDER_DAYS };
