import { NextResponse } from 'next/server';
import { WAREHOUSE } from '@/config/install';
import { importOwnOrders } from '@/lib/kfcOwnShop';

export const runtime = 'nodejs';
export const maxDuration = 300;

/**
 * Nightly (vercel.json): re-reads 72 hours of our own webshop's orders
 * (public.orders, in this same database) into the order ledger, so an order
 * the on-view import missed is still picked up.
 */
export async function GET(request: Request) {
  if (!WAREHOUSE) return new NextResponse(null, { status: 404 });
  if (!process.env.CRON_SECRET) return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 });
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const since = new Date(Date.now() - 72 * 3600_000).toISOString();
  return NextResponse.json({ ran: [await importOwnOrders({ since, kind: 'reconcile' })], skipped: [] });
}
