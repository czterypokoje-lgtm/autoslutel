import { after } from 'next/server';
import { IS_KEYFORCARS } from '@/config/install';
import { isWooShop, upsertOrder, verifyWebhook, type WooOrder } from '@/lib/kfcWoo';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { runStockPush } from '@/lib/kfcWooStock';

export const runtime = 'nodejs';

/**
 * WooCommerce order webhooks, one URL per shop: /api/woo/keyforcars.nl.
 *
 * Signature first (HMAC-SHA256 of the raw body, base64), answer 200 fast,
 * do the upsert in after(). WooCommerce disables a webhook after 5 failures
 * in a row, so a database hiccup must not surface as a non-2xx here; the
 * nightly reconcile catches what a webhook missed.
 */
export async function POST(request: Request, { params }: { params: Promise<{ shop: string }> }) {
  if (!IS_KEYFORCARS) return new Response(null, { status: 404 });
  const { shop } = await params;
  if (!isWooShop(shop)) return new Response(null, { status: 404 });
  const raw = await request.text();
  if (!verifyWebhook(shop, raw, request.headers.get('x-wc-webhook-signature'))) return new Response('bad signature', { status: 401 });
  // WooCommerce pings the URL once on creation with no order body.
  if (!raw || raw.startsWith('webhook_id=')) return Response.json({ ok: true });
  let order: WooOrder;
  try { order = JSON.parse(raw); } catch { return Response.json({ ok: false }, { status: 200 }); }
  if (!order || typeof order.id !== 'number') return Response.json({ ok: true });
  after(async () => {
    const db = createSupabaseAdminClient();
    try {
      await upsertOrder(shop, order);
      await db.from('kfc_import_runs').insert({ shop, kind: 'webhook', finished_at: new Date().toISOString(), orders: 1 });
    } catch (error) {
      await db.from('kfc_import_runs').insert({ shop, kind: 'webhook', finished_at: new Date().toISOString(), orders: 0, error: (error as Error).message });
    }
    // A new or changed order moves reservations, so other shops' numbers change: push
    // right away (a no-op while every WOO_<SHOP>_STOCK_PUSH is off). The cron catches misses.
    await runStockPush({ budgetMs: 8_000, limit: 50 }).catch(() => undefined);
  });
  return Response.json({ ok: true });
}
