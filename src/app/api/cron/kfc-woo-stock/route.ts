import { NextResponse } from 'next/server';
import { IS_KEYFORCARS } from '@/config/install';
import { runStockPush } from '@/lib/kfcWooStock';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * The stock-push worker (vercel.json, every few minutes; docs/woo-sync-retour.md).
 * Drains kfc_woo_stock_outbox for every shop whose WOO_<SHOP>_STOCK_PUSH is
 * "on" (live) or "dry" (logged only). With every shop off it does nothing and
 * leaves the queue as it is.
 */
export async function GET(request: Request) {
  if (!IS_KEYFORCARS) return new NextResponse(null, { status: 404 });
  if (!process.env.CRON_SECRET) return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 });
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const result = await runStockPush({ budgetMs: 50_000 });
    return NextResponse.json({
      claimed: result.claimed, skipped: result.skipped,
      shops: result.results.map(({ shop, mode, articles, updated, skipped, failed, error }) => ({ shop, mode, articles, updated, skipped, failed, error })),
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
