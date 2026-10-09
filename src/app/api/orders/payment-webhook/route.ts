import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

/**
 * Mollie's callback for a webshop order.
 *
 * Its own route, next to the job one at /api/jobs/payment-webhook, and for
 * the reason that route's comment gives: Mollie posts nothing but a payment
 * id, so a single webhook would have to guess whether an id belongs to an
 * order or a job — and a wrong guess marks the wrong thing paid. Two routes,
 * two webhookUrls, no guessing.
 *
 * There is no signature to check and none is needed: Mollie never sends a
 * status, so a forged POST cannot mark anything paid. The status is always
 * read back from Mollie with our own API key, and only `metadata.kind ===
 * 'order'` is acted on.
 *
 * Idempotent, because Mollie retries until it gets a 200. Writing the same
 * status twice is a no-op, and `paid_at` is only set when it is still null so
 * a retry cannot move the payment date.
 */

export const dynamic = 'force-dynamic';

/** Mollie's payment status → our order status. */
const STATE: Record<string, 'paid' | 'cancelled' | 'refunded'> = {
  paid: 'paid',
  canceled: 'cancelled',
  expired: 'cancelled',
  failed: 'cancelled',
};

export async function POST(request: Request) {
  const key = process.env.MOLLIE_API_KEY;
  if (!key) {
    console.error('Order payment webhook called without MOLLIE_API_KEY');
    return new NextResponse(null, { status: 500 });
  }

  let paymentId: string | null = null;
  try {
    const form = await request.formData();
    const value = form.get('id');
    paymentId = typeof value === 'string' ? value : null;
  } catch {
    paymentId = null;
  }

  // 200: a malformed callback must not make Mollie retry forever.
  if (!paymentId) return new NextResponse(null, { status: 200 });

  const response = await fetch(
    `https://api.mollie.com/v2/payments/${encodeURIComponent(paymentId)}`,
    {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(10000),
    }
  ).catch(() => null);

  if (!response?.ok) {
    // 500 so Mollie tries again — this one is worth retrying.
    console.error('Could not read order payment back from Mollie:', paymentId);
    return new NextResponse(null, { status: 500 });
  }

  const payment = await response.json();

  // Not ours. A job payment reaching this route is ignored, not applied.
  if (payment?.metadata?.kind !== 'order' || !payment?.metadata?.orderId) {
    return new NextResponse(null, { status: 200 });
  }

  const state = STATE[String(payment.status)];
  // 'open' or 'pending': nothing decided yet, and nothing to write.
  if (!state) return new NextResponse(null, { status: 200 });

  const db = createSupabaseAdminClient();

  /*
   * Only ever moves an order forward out of `pending`.
   *
   * The `.eq('status', 'pending')` is what makes a retry safe and what stops
   * a late 'expired' callback from cancelling an order the office has already
   * shipped. Mollie can deliver callbacks out of order; the order's own
   * status is the authority once a human has touched it.
   */
  const patch: Record<string, unknown> = { status: state };
  if (state === 'paid') patch.paid_at = payment.paidAt ?? new Date().toISOString();

  const { error } = await db
    .from('orders')
    .update(patch)
    .eq('id', payment.metadata.orderId)
    .eq('mollie_payment_id', paymentId)
    .eq('status', 'pending');

  if (error) {
    console.error('Settling the order failed:', error.message);
    return new NextResponse(null, { status: 500 });
  }

  return new NextResponse(null, { status: 200 });
}
