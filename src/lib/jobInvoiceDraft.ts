import type { JobInvoiceLineSource } from './jobInvoiceSources';

export type JobInvoiceDraft = {
  customerName: string;
  technicianId: string;
  agreedTotal: number | null;
  rows: (JobInvoiceLineSource & { id: string; description: string; quantity: number; unitPrice: number | null })[];
};

type Job = {
  customer_name: string | null; technician_id: string | null; service_type: string | null;
  final_price: number | null; quoted_price: number | null; revenue_materials: number | null;
  revenue_labor: number | null; revenue_callout: number | null; revenue_discount: number | null;
};

export function prepareJobInvoice(job: Job, used: { id: string; quantity: number; article_code: string; name?: string }[], serviceTariff?: number): JobInvoiceDraft {
  const agreedTotal = job.final_price ?? job.quoted_price;
  const cents = (value: number) => Math.round(value * 100);
  const materials = job.revenue_materials ?? 0;
  const service = (job.revenue_labor ?? 0) + (job.revenue_callout ?? 0);
  const rows: JobInvoiceDraft['rows'] = used.map((item) => ({
    id: item.id, description: item.name || item.article_code, quantity: item.quantity,
    unitPrice: null, job_stock_id: item.id, job_line_kind: 'product',
  }));
  rows.push({ id: 'job-service', description: job.service_type || 'Arbeid / Programmeren', quantity: 1,
    unitPrice: null, job_stock_id: null, job_line_kind: 'service' });

  // Suggest prices only when both the split and the amount due reconcile.
  if (used.length === 1 && materials > 0 && service > 0 && !job.revenue_discount && agreedTotal !== null) {
    const combined = materials + service;
    const vat = 1.21;
    const basis = cents(combined * vat) === cents(agreedTotal) ? 1 : cents(combined) === cents(agreedTotal) ? vat : null;
    if (basis) {
      const productPrice = cents(materials / basis / used[0].quantity) / 100;
      const servicePrice = cents(service / basis) / 100;
      if (cents((productPrice * used[0].quantity + servicePrice) * vat) === cents(agreedTotal)) {
        rows[0].unitPrice = productPrice;
        rows[1].unitPrice = servicePrice;
      }
    }
  }
  const serviceRow = rows[rows.length - 1];
  if (serviceRow.unitPrice === null && service === 0 && !job.revenue_discount && serviceTariff !== undefined &&
      (agreedTotal === null || cents(serviceTariff * 1.21) <= cents(agreedTotal))) {
    serviceRow.unitPrice = serviceTariff;
    if (used.length === 1 && materials === 0 && agreedTotal !== null) {
      const unitPrice = cents((agreedTotal / 1.21 - serviceTariff) / used[0].quantity) / 100;
      if (unitPrice >= 0 && cents((unitPrice * used[0].quantity + serviceTariff) * 1.21) === cents(agreedTotal)) {
        rows[0].unitPrice = unitPrice;
      }
    }
  }
  return { customerName: job.customer_name ?? '', technicianId: job.technician_id ?? '', agreedTotal, rows };
}
