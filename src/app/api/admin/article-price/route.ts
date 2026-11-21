import { requireOfficeUserApi } from '@/lib/crmSession';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { WAREHOUSE } from '@/config/install';
import { CRM_READONLY } from '@/lib/readonly';

export const dynamic = 'force-dynamic';

async function access(request: Request) {
  const auth = await requireOfficeUserApi();
  if (auth.response) return auth.response;
  if (!WAREHOUSE) return new Response(null, { status: 404 });
  const code = new URL(request.url).searchParams.get('code');
  if (!code || code.length > 160) return new Response(null, { status: 400 });
  return code;
}

const validPrice = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 2147483647;

export async function GET(request: Request) {
  const code = await access(request);
  if (typeof code !== 'string') return code;
  const { data, error } = await createSupabaseAdminClient().from('kfc_articles')
    .select('sale_price_cents').eq('code', code).maybeSingle();
  if (error || !data) return new Response(null, { status: error ? 500 : 404 });
  return Response.json({ cents: data.sale_price_cents }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(request: Request) {
  const code = await access(request);
  if (typeof code !== 'string') return code;
  if (CRM_READONLY) return new Response(null, { status: 423 });
  const body = await request.json().catch(() => null);
  if (!validPrice(body?.cents) || !(body.previous === null || validPrice(body.previous))) {
    return new Response(null, { status: 400 });
  }
  const update = createSupabaseAdminClient().from('kfc_articles')
    .update({ sale_price_cents: body.cents }).eq('code', code);
  const checked = body.previous === null ? update.is('sale_price_cents', null) : update.eq('sale_price_cents', body.previous);
  const { data, error } = await checked.select('sale_price_cents').maybeSingle();
  if (error || !data) return new Response(null, { status: error ? 500 : 409 });
  return Response.json({ cents: data.sale_price_cents });
}
