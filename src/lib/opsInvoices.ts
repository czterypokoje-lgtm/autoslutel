/** Same term as the invoice page in /admin/facturen. */
export const PAYMENT_TERM_DAYS = 14;

const DAY = 86_400_000;
const MAX_LISTED = 10;

export interface InvoiceRow {
  invoice_number: string;
  issue_date: string;
  client_name: string;
  total: number | string;
  status: 'concept' | 'verzonden' | 'betaald';
}

export interface InvoiceItem {
  number: string;
  date: string;
  client: string;
  total: number;
  status: InvoiceRow['status'];
  daysOverdue: number;
}

const cents = (value: number) => Math.round(value * 100) / 100;

/** Days past the payment term, 0 when it has not passed. Both dates are yyyy-mm-dd. */
function daysOverdue(issueDate: string, today: string) {
  const age = (Date.parse(today) - Date.parse(issueDate)) / DAY;
  return Math.max(0, Math.round(age) - PAYMENT_TERM_DAYS);
}

/**
 * The invoice position in one read. Only sent invoices can be overdue: a concept
 * is not owed yet and a paid one is settled.
 */
export function summarizeInvoices(rows: InvoiceRow[], today: string) {
  const items: InvoiceItem[] = rows.map((row) => ({
    number: row.invoice_number,
    date: row.issue_date,
    client: row.client_name,
    total: Number(row.total) || 0,
    status: row.status,
    daysOverdue: row.status === 'verzonden' ? daysOverdue(row.issue_date, today) : 0,
  }));

  const open = items.filter((i) => i.status === 'verzonden');
  const overdue = open.filter((i) => i.daysOverdue > 0);
  const sum = (list: InvoiceItem[]) => cents(list.reduce((total, i) => total + i.total, 0));

  return {
    counts: {
      concept: items.filter((i) => i.status === 'concept').length,
      open: open.length,
      overdue: overdue.length,
      paid: items.filter((i) => i.status === 'betaald').length,
    },
    openAmount: sum(open),
    overdueAmount: sum(overdue),
    overdue: [...overdue].sort((a, b) => b.daysOverdue - a.daysOverdue).slice(0, MAX_LISTED),
    latest: items.slice(0, MAX_LISTED),
  };
}
