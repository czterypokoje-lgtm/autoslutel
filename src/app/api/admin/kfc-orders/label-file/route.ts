import { WAREHOUSE } from '@/config/install';
import { requireWarehouseUserApi } from '@/lib/crmSession';
import { readLabelFile } from '@/lib/kfcPostnl';

export const runtime = 'nodejs';

const uuid = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;

/**
 * GET ?id=<order> → the carrier label PDF the CRM stored for this order.
 * PostNL returns the label in its answer instead of a link, so it is kept in
 * the CRM's file store (src/lib/kfcPostnl.ts) and opened from here.
 */
export async function GET(request: Request) {
  if (!WAREHOUSE) return new Response(null, { status: 404 });
  const { response } = await requireWarehouseUserApi();
  if (response) return response;
  const id = new URL(request.url).searchParams.get('id') ?? '';
  if (!uuid.test(id)) return Response.json({ error: 'Ongeldige bestelling.' }, { status: 400 });
  const pdf = await readLabelFile(id);
  if (!pdf) return Response.json({ error: 'Geen opgeslagen label voor deze bestelling.' }, { status: 404 });
  return new Response(Buffer.from(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="label-${id.slice(0, 8)}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
