import type { SupabaseClient } from '@supabase/supabase-js';

export type JobInvoiceLineSource = { job_line_kind: 'product' | 'service' | null; job_stock_id: string | null };

export function readJobInvoiceLineSource(raw: Record<string, unknown>): JobInvoiceLineSource | null {
  const kind = raw.job_line_kind ?? null;
  const stock = raw.job_stock_id ?? null;
  if (kind !== null && kind !== 'product' && kind !== 'service') return null;
  if (stock !== null && (kind !== 'product' || typeof stock !== 'string' ||
    !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(stock))) return null;
  return { job_line_kind: kind, job_stock_id: stock };
}

export async function jobInvoiceSourcesValid(
  admin: SupabaseClient, jobId: string | null, lines: (JobInvoiceLineSource & { quantity: number })[],
) {
  if (lines.every((line) => !line.job_line_kind)) return true;
  if (!jobId) return false;
  const sources = lines.filter((line) => line.job_stock_id);
  if (!sources.length) return true;
  const ids = sources.map((line) => line.job_stock_id!);
  if (new Set(ids).size !== ids.length) return false;
  const { data, error } = await admin.from('kfc_job_stock').select('id, quantity').eq('job_id', jobId).eq('state', 'used').in('id', ids);
  if (error) throw error;
  const quantities = new Map(data.map((row) => [row.id, row.quantity]));
  return sources.every((line) => line.quantity <= (quantities.get(line.job_stock_id!) ?? 0));
}
