import { addDays, format } from 'date-fns';
import type { JobInvoiceLineSource } from '@/lib/jobInvoiceSources';

/*
 * Form model for the KeyForCars invoice screen (ported from Studio Admin's
 * /dashboard/invoice). One tax rate and one discount for the whole invoice,
 * like the template; `toApiPayload` spreads them over the per-line fields the
 * existing /api/admin/invoices route expects, so the API is untouched.
 */

export interface InvoiceLineItem extends Partial<JobInvoiceLineSource> {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceTaxOption {
  id: string;
  name: string;
  rate: number;
}

export type InvoiceDiscountType = 'fixed' | 'percent';

/* A4 at 96 dpi (the template used US Letter). */
export const INVOICE_PAPER_WIDTH = 794;
export const INVOICE_PAPER_HEIGHT = 1123;
export const INVOICE_PAPER_SCALE = 0.6;

export interface InvoiceFromDetails {
  name: string;
  email: string;
  phone: string;
  website: string;
  street: string;
  postcode: string;
  city: string;
  kvk: string;
  btw: string;
  iban: string;
  accountName: string;
}

export interface InvoiceToDetails {
  id: string;
  name: string;
  email: string;
  phone: string;
  street: string;
  postcode: string;
  city: string;
  btw: string;
  termsDays: number;
}

export interface InvoiceFormValues {
  referenceNumber: string;
  /**
   * Autosleutel24 only: "op naam van monteur" — not who typed the invoice but
   * who it is FOR, which is what puts it in that monteur's own Facturen
   * screen. Absent on KeyForCars, where the route resolves it from the signed
   * in user, and `toApiPayload` then sends the same null the route already
   * derived for an office user.
   */
  technicianId?: string;
  issuedDate: string;
  /* Derived, never typed: the ledger's due date is issue_date + terms_days
     (trigger kfc_post_invoice in 0093). Kept in the model only because the
     client selector refreshes it; everything shown reads getInvoiceDueDate. */
  paymentDueDate: string;
  from: InvoiceFromDetails;
  to: InvoiceToDetails;
  taxId: string;
  discountType: InvoiceDiscountType;
  discountValue: number;
  creditApplied: number;
  notes: string;
  items: InvoiceLineItem[];
}

/** Row shape from kfcReceivables.customerOptions(). */
export interface CustomerOption {
  id: string;
  company: string;
  email: string | null;
  phone: string | null;
  street: string | null;
  postcode: string | null;
  city: string | null;
  vat_number: string | null;
  terms_days: number;
}

/** A buyer without a ledger account: name and address typed by hand. */
export const WALK_IN_ID = 'walk-in';
export const walkInClient: InvoiceToDetails = {
  id: WALK_IN_ID, name: '', email: '', phone: '', street: '', postcode: '', city: '', btw: '', termsDays: 1,
};

/**
 * Autosleutel24 has no ledger accounts: the "bekende klanten" list is simply
 * the distinct client blocks off earlier invoices, exactly the rows the old
 * InvoiceForm offered under "Kies bekende klant".
 */
export interface PreviousClientOption {
  client_name: string;
  client_street?: string | null;
  client_postcode?: string | null;
  client_city?: string | null;
  client_email?: string | null;
  client_phone?: string | null;
  client_btw?: string | null;
}

export function previousClientToDetails(c: PreviousClientOption, termsDays: number): InvoiceToDetails {
  return {
    id: WALK_IN_ID, name: c.client_name ?? '', email: c.client_email ?? '', phone: c.client_phone ?? '',
    street: c.client_street ?? '', postcode: c.client_postcode ?? '', city: c.client_city ?? '',
    btw: c.client_btw ?? '', termsDays,
  };
}

export function customerToDetails(c: CustomerOption): InvoiceToDetails {
  return {
    id: c.id, name: c.company, email: c.email ?? '', phone: c.phone ?? '', street: c.street ?? '',
    postcode: c.postcode ?? '', city: c.city ?? '', btw: c.vat_number ?? '', termsDays: c.terms_days,
  };
}

export const invoiceTaxOptions: InvoiceTaxOption[] = [
  { id: '21', name: 'Btw hoog', rate: 21 },
  { id: '9', name: 'Btw laag', rate: 9 },
  { id: '0', name: 'Geen btw / verlegd', rate: 0 },
];

export function dueDateFor(issuedDate: string, termsDays: number) {
  const issued = new Date(issuedDate);
  return format(addDays(Number.isNaN(issued.getTime()) ? new Date() : issued, termsDays), 'yyyy-MM-dd');
}

/** The date the ledger will carry: issue date + the customer's payment term. */
export function getInvoiceDueDate(invoice: InvoiceFormValues) {
  return dueDateFor(invoice.issuedDate, invoice.to?.termsDays ?? walkInClient.termsDays);
}

export function defaultInvoiceValues(from: InvoiceFromDetails, to: InvoiceToDetails): InvoiceFormValues {
  const issuedDate = format(new Date(), 'yyyy-MM-dd');
  return {
    referenceNumber: '',
    technicianId: '',
    issuedDate,
    paymentDueDate: dueDateFor(issuedDate, to.termsDays),
    from,
    to,
    taxId: '21',
    discountType: 'fixed',
    discountValue: 0,
    creditApplied: 0,
    notes: '',
    items: [{ id: 'item-1', description: '', quantity: 1, unitPrice: 0 }],
  };
}

export function addressLines(x: { street: string; postcode: string; city: string }) {
  return [x.street, [x.postcode, x.city].filter(Boolean).join(' ')].filter(Boolean);
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function getLineAmount(item?: InvoiceLineItem) {
  if (!item) return 0;
  const quantity = Number.isFinite(item.quantity) ? item.quantity : 0;
  const unitPrice = Number.isFinite(item.unitPrice) ? item.unitPrice : 0;
  return quantity * unitPrice;
}

/** The rows that will be saved: a description and a positive quantity. The sheet shows exactly these. */
export function getInvoiceItems(invoice: InvoiceFormValues) {
  return (invoice.items ?? []).filter((i) => i?.description?.trim() && i.quantity > 0 && Number.isFinite(i.unitPrice) && i.unitPrice >= 0);
}

export function getInvoiceSubtotal(invoice: InvoiceFormValues) {
  return getInvoiceItems(invoice).reduce((subtotal, item) => subtotal + getLineAmount(item), 0);
}

export function getInvoiceTaxOption(invoice: InvoiceFormValues) {
  return invoiceTaxOptions.find((taxOption) => taxOption.id === invoice.taxId) ?? invoiceTaxOptions[0];
}

export function getInvoiceDiscount(invoice: InvoiceFormValues) {
  const subtotal = getInvoiceSubtotal(invoice);
  const discountValue = Number.isFinite(invoice.discountValue) ? invoice.discountValue : 0;
  const discount = invoice.discountType === 'percent' ? subtotal * (discountValue / 100) : discountValue;
  return Math.min(Math.max(discount, 0), subtotal);
}

export function getInvoiceCredit(invoice: InvoiceFormValues) {
  return Number.isFinite(invoice.creditApplied) ? Math.max(invoice.creditApplied, 0) : 0;
}

const cents = (n: number) => Math.round(n * 100);

/**
 * The invoice-wide discount split over the lines, in whole cents: a
 * proportional floor first, then the leftover cents one at a time over the
 * lines that still have room. Never negative, never more than the line it sits
 * on — so no line base can turn negative — and the shares add up to the
 * capped discount exactly.
 */
export function allocateLineDiscounts(items: InvoiceLineItem[], discount: number): number[] {
  const amounts = items.map((item) => cents(getLineAmount(item)));
  const subtotal = amounts.reduce((sum, amount) => sum + amount, 0);
  const target = Math.min(Math.max(cents(discount), 0), subtotal);
  const shares = amounts.map((amount) => (subtotal > 0 ? Math.min(Math.floor((target * amount) / subtotal), amount) : 0));
  let left = target - shares.reduce((sum, share) => sum + share, 0);
  for (let index = 0; left > 0 && index < shares.length; index++) {
    const room = Math.min(amounts[index] - shares[index], left);
    shares[index] += room;
    left -= room;
  }
  return shares.map((share) => share / 100);
}

/**
 * Exactly the arithmetic /api/admin/invoices does with the payload below: per
 * line a base of amount − its allocated discount, vat per line on that base,
 * both sums rounded once, credit capped at what is owed. The preview and the
 * stored row can therefore never show two different totals.
 */
export function getInvoiceTotals(invoice: InvoiceFormValues) {
  const items = getInvoiceItems(invoice);
  const rate = getInvoiceTaxOption(invoice).rate;
  const discount = round2(getInvoiceDiscount(invoice));
  const lineDiscounts = allocateLineDiscounts(items, discount);
  let net = 0;
  let vat = 0;
  items.forEach((item, index) => {
    const base = getLineAmount(item) - lineDiscounts[index];
    net += base;
    vat += base * (rate / 100);
  });
  net = Math.max(round2(net), 0);
  vat = Math.max(round2(vat), 0);
  const credit = Math.min(round2(getInvoiceCredit(invoice)), round2(net + vat));
  return { items, rate, discount, lineDiscounts, net, vat, credit, total: round2(net + vat - credit) };
}

export function getInvoiceTax(invoice: InvoiceFormValues) {
  return getInvoiceTotals(invoice).vat;
}

export function getInvoiceTotal(invoice: InvoiceFormValues) {
  return getInvoiceTotals(invoice).total;
}

/** The route stores discount and vat per line; the shares come from the same math. */
export function toApiPayload(invoice: InvoiceFormValues) {
  const { items, rate, lineDiscounts, credit } = getInvoiceTotals(invoice);
  const lines = items.map((item, index) => ({
    description: item.description.trim(), quantity: item.quantity, unitPrice: item.unitPrice, discount: lineDiscounts[index], vatRate: rate,
    job_line_kind: item.job_line_kind, job_stock_id: item.job_stock_id,
  }));
  const { from, to } = invoice;
  return {
    issue_date: invoice.issuedDate,
    biller_name: from.name, biller_street: from.street, biller_postcode: from.postcode, biller_city: from.city,
    biller_email: from.email, biller_phone: from.phone, biller_kvk: from.kvk, biller_btw: from.btw, biller_iban: from.iban,
    client_name: to.name, customer_id: to.id === WALK_IN_ID ? null : to.id,
    client_street: to.street, client_postcode: to.postcode, client_city: to.city,
    client_email: to.email, client_phone: to.phone, client_btw: to.btw,
    /* Null for an office user either way — the route ignores it for a monteur. */
    technician_id: invoice.technicianId || null,
    credit_applied: credit,
    notes: invoice.notes,
    lines,
  };
}
