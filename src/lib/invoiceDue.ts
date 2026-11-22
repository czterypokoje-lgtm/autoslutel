export const PAYMENT_TERM_DAYS = 14;
export const PAYMENT_REMINDER_DAYS = 3;
const DAY_MS = 86_400_000;

export function invoiceDay(date: string) {
  return Math.floor(Date.parse(date.slice(0, 10) + 'T00:00:00Z') / DAY_MS);
}

export function invoiceDueDate(issueDate: string) {
  return new Date((invoiceDay(issueDate) + PAYMENT_TERM_DAYS) * DAY_MS);
}

export function invoiceToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
