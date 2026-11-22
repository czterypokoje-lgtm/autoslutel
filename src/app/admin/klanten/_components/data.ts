import type { Balance, Customer } from '@/lib/kfcReceivables';

/* Klanten list, ported from Studio Admin's /dashboard/users; rows come from kfcReceivables.listCustomers(). */
export type CustomerRow = Customer & Balance;

export type CustomerStatus = 'Vervallen' | 'Over limiet' | 'Openstaand' | 'Bij';

export const ALL = 'Alle';

export function customerStatus(r: CustomerRow): CustomerStatus {
  if (r.overdue_cents > 0) return 'Vervallen';
  if (r.credit_limit_cents != null && r.open_cents >= r.credit_limit_cents) return 'Over limiet';
  if (r.open_cents > 0) return 'Openstaand';
  return 'Bij';
}

export const statusOptions: CustomerStatus[] = ['Vervallen', 'Over limiet', 'Openstaand', 'Bij'];

export const statusMeta: Record<CustomerStatus, { badgeClass: string; dotClass: string }> = {
  Bij: {
    badgeClass: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    dotClass: 'bg-emerald-500',
  },
  Openstaand: {
    badgeClass: 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400',
    dotClass: 'bg-amber-500',
  },
  Vervallen: {
    badgeClass: 'border-destructive/20 bg-destructive/10 text-destructive',
    dotClass: 'bg-destructive',
  },
  'Over limiet': {
    badgeClass: 'border-orange-500/20 bg-orange-500/10 text-orange-600 dark:text-orange-400',
    dotClass: 'bg-orange-500',
  },
};

export const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
export const DATE = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });

/** Days since the last ledger entry; null when there is none. */
export function daysSince(date: string | null) {
  if (!date) return null;
  const ms = Date.now() - new Date(date).getTime();
  return Number.isFinite(ms) ? Math.floor(ms / 86_400_000) : null;
}
