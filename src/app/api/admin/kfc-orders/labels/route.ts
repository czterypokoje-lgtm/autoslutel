import { PDFDocument } from 'pdf-lib';
import { IS_KEYFORCARS } from '@/config/install';
import { CRM_PREVIEW } from '@/lib/supabase/env';
import { requireWarehouseUserApi } from '@/lib/crmSession';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const maxDuration = 120;

const uuid = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;

/**
 * GET ?ids=a,b,c → one PDF with every Sendcloud label in the batch, in order.
 * Sendcloud label URLs need the API credentials, so the browser cannot open
 * them directly; this fetches and merges them server-side (pdf-lib).
 */
export async function GET(request: Request) {
  if (!IS_KEYFORCARS || CRM_PREVIEW) return new Response(null, { status: 404 });
  const { response } = await requireWarehouseUserApi();
  if (response) return response;
  const ids = (new URL(request.url).searchParams.get('ids') ?? '').split(',').filter((id) => uuid.test(id)).slice(0, 200);
  if (!ids.length) return Response.json({ error: 'Geen bestellingen.' }, { status: 400 });
  const key = process.env.SENDCLOUD_PUBLIC_KEY, secret = process.env.SENDCLOUD_SECRET_KEY;
  if (!key || !secret) return Response.json({ error: 'Sendcloud is niet ingesteld; eigen labels print je via /admin/bestellingen/labels.' }, { status: 409 });

  const { data } = await createSupabaseAdminClient().from('kfc_shop_orders').select('id, shop, number, carrier, label_url').in('id', ids);
  const byId = new Map((data ?? []).map((o) => [o.id as string, o]));
  const auth = `Basic ${Buffer.from(`${key}:${secret}`).toString('base64')}`;
  const merged = await PDFDocument.create();
  const missing: string[] = [];
  for (const id of ids) {
    const order = byId.get(id);
    if (!order?.label_url || order.carrier === 'eigen') { if (order) missing.push(`${order.shop} #${order.number}`); continue; }
    const res = await fetch(order.label_url as string, { headers: { Authorization: auth }, cache: 'no-store' }).catch(() => null);
    if (!res?.ok) { missing.push(`${order.shop} #${order.number}`); continue; }
    const doc = await PDFDocument.load(await res.arrayBuffer());
    for (const page of await merged.copyPages(doc, doc.getPageIndices())) merged.addPage(page);
  }
  if (merged.getPageCount() === 0) return Response.json({ error: `Geen Sendcloud-labels gevonden${missing.length ? ` (${missing.join(', ')})` : ''}.` }, { status: 404 });
  const bytes = await merged.save();
  return new Response(Buffer.from(bytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="labels-${new Date().toISOString().slice(0, 10)}.pdf"`,
      'Cache-Control': 'no-store',
      ...(missing.length ? { 'X-Missing-Labels': encodeURIComponent(missing.join(', ')) } : {}),
    },
  });
}
