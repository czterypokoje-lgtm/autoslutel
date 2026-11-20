import { NextResponse } from 'next/server';
import { IS_KEYFORCARS, WAREHOUSE } from '@/config/install';
import { WOO_SHOPS, reconcile, wooConfigured, type WooShop } from '@/lib/kfcWoo';
import { importOwnOrders } from '@/lib/kfcOwnShop';

export const runtime = 'nodejs';
export const maxDuration = 300;

/**
 * Nightly (vercel.json): 72 hours of changes per shop, plus missed write-backs.
 * KeyForCars reads its three WooCommerce shops; a warehouse Autosleutel24
 * re-reads its own orders table in this same database instead.
 */
export async function GET(request: Request) {
  if (!WAREHOUSE) return new NextResponse(null, { status: 404 });
  if (!process.env.CRON_SECRET) return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 });
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!IS_KEYFORCARS) {
    const since = new Date(Date.now() - 72 * 3600_000).toISOString();
    return NextResponse.json({ ran: [await importOwnOrders({ since, kind: 'reconcile' })], skipped: [] });
  }
  const shops = (Object.keys(WOO_SHOPS) as WooShop[]).filter(wooConfigured);
  const results = [];
  for (const shop of shops) results.push(await reconcile(shop));
  return NextResponse.json({ ran: results, skipped: (Object.keys(WOO_SHOPS) as WooShop[]).filter((s) => !wooConfigured(s)) });
}
