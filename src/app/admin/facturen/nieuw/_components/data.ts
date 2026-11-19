import { addDays, format } from 'date-fns';

/*
 * Form model for the KeyForCars invoice screen (ported from Studio Admin's
 * /dashboard/invoice). One tax rate and one discount for the whole invoice,
 * like the template; `toApiPayload` spreads them over the per-line fields the
 * existing /api/admin/invoices route expects, so the API is untouched.
 */

export interface InvoiceLineItem {
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
  issuedDate: string;
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
  id: WALK_IN_ID, name: '', email: '', phone: '', street: '', postcode: '', city: '', btw: '', termsDays: 14,
};

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

export function defaultInvoiceValues(from: InvoiceFromDetails, to: InvoiceToDetails): InvoiceFormValues {
  const issuedDate = format(new Date(), 'yyyy-MM-dd');
  return {
    referenceNumber: '',
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

export function getInvoiceTax(invoice: InvoiceFormValues) {
  const taxRate = getInvoiceTaxOption(invoice).rate;
  return Math.max(getInvoiceSubtotal(invoice) - getInvoiceDiscount(invoice), 0) * (taxRate / 100);
}

export function getInvoiceCredit(invoice: InvoiceFormValues) {
  return Number.isFinite(invoice.creditApplied) ? Math.max(invoice.creditApplied, 0) : 0;
}

export function getInvoiceTotal(invoice: InvoiceFormValues) {
  return Math.max(getInvoiceSubtotal(invoice) - getInvoiceDiscount(invoice), 0) + getInvoiceTax(invoice) - getInvoiceCredit(invoice);
}

/**
 * The existing route stores discount and vat per line. The invoice-level
 * discount is spread proportionally (cents), the rounding remainder on the
 * last line, so the stored total equals what the preview showed.
 */
export function toApiPayload(invoice: InvoiceFormValues) {
  const items = getInvoiceItems(invoice);
  const rate = getInvoiceTaxOption(invoice).rate;
  const subtotal = getInvoiceSubtotal(invoice);
  const discount = round2(getInvoiceDiscount(invoice));
  let allocated = 0;
  const lines = items.map((item, index) => {
    const last = index === items.length - 1;
    const share = last ? round2(discount - allocated) : round2(subtotal > 0 ? (discount * getLineAmount(item)) / subtotal : 0);
    allocated = round2(allocated + share);
    return { description: item.description.trim(), quantity: item.quantity, unitPrice: item.unitPrice, discount: share, vatRate: rate };
  });
  const { from, to } = invoice;
  return {
    biller_name: from.name, biller_street: from.street, biller_postcode: from.postcode, biller_city: from.city,
    biller_email: from.email, biller_phone: from.phone, biller_kvk: from.kvk, biller_btw: from.btw, biller_iban: from.iban,
    client_name: to.name, customer_id: to.id === WALK_IN_ID ? null : to.id,
    client_street: to.street, client_postcode: to.postcode, client_city: to.city,
    client_email: to.email, client_phone: to.phone, client_btw: to.btw,
    credit_applied: getInvoiceCredit(invoice),
    notes: invoice.notes,
    lines,
  };
}
