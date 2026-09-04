import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendMail, orderConfirmation, orderNotification } from '@/lib/email';

interface OrderLine {
  title: string;
  quantity: number;
  lineTotal: number;
}

/**
 * Mollie payment webhook.
 *
 * Mollie posts only a payment id — never an amount or a status — so the status
 * has to be fetched back from the API. That is deliberate on their side: it
 * means a forged POST cannot mark an order paid, because we always ask Mollie
 * what actually happened.
 *
 * Must be idempotent: Mollie retries until it gets a 200, so the same id can
 * arrive several times. Orders are only ever moved forward, never back.
 */

export const dynamic = 'force-dynamic';

const STATUS_MAP: Record<string, string> = {
  paid: 'paid',
  canceled: 'cancelled',
  expired: 'cancelled',
  failed: 'cancelled',
};

export async function POST(request: Request) {
  const mollieKey = process.env.MOLLIE_API_KEY;
  if (!mollieKey) {
    console.error('Webhook received but MOLLIE_API_KEY is not configured');
    return new NextResponse(null, { status: 500 });
  }

  let paymentId: string | null = null;
  try {
    const form = await request.formData();
    const id = form.get('id');
    if (typeof id === 'string') paymentId = id;
  } catch {
    // Mollie sends form-encoded; anything else is not a webhook we recognise.
  }

  if (!paymentId || !/^tr_[A-Za-z0-9]+$/.test(paymentId)) {
    return new NextResponse(null, { status: 400 });
  }

  try {
    const res = await fetch(`https://api.mollie.com/v2/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${mollieKey}` },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      console.error('Could not read payment back from Mollie', paymentId);
      // 500 so Mollie retries rather than giving up on a transient failure.
      return new NextResponse(null, { status: 500 });
    }

    const payment = await res.json();
    const next = STATUS_MAP[payment.status];
    if (!next) return new NextResponse(null, { status: 200 }); // open/pending

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.storage_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.storage_SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) return new NextResponse(null, { status: 500 });

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Only ever advance a pending order. A late "expired" callback must not
    // undo an order that Mollie already reported as paid.
    const { data: updated, error } = await supabase
      .from('orders')
      .update({ status: next, paid_at: next === 'paid' ? new Date().toISOString() : null })
      .eq('mollie_payment_id', paymentId)
      .eq('status', 'pending')
      .select(
        'order_number, name, email, phone, street, postcode, city, items, total_inc, shipping_cost, needs_technician'
      );

    if (error) {
      console.error('Order status update failed', error);
      return new NextResponse(null, { status: 500 });
    }

    /*
     * Confirm the order to the customer, and tell the office.
     *
     * Only on the row this call actually moved from pending to paid — Mollie
     * retries until it gets a 200, and the update matching zero rows is how we
     * know a retry has already been handled. Without that check every retry
     * would send another confirmation.
     *
     * The mail is awaited but never fails the webhook: Mollie must not keep
     * retrying a payment that is correctly recorded because an e-mail provider
     * was briefly down.
     */
    const order = next === 'paid' ? updated?.[0] : undefined;
    if (order) {
      const items = Array.isArray(order.items) ? (order.items as OrderLine[]) : [];
      const payload = { ...order, items } as Parameters<typeof orderConfirmation>[0];

      await Promise.allSettled([
        sendMail(orderConfirmation(payload)),
        sendMail(orderNotification({ ...payload, phone: order.phone ?? null })),
      ]);
    }

    return new NextResponse(null, { status: 200 });
  } catch (err) {
    console.error('Webhook failed', err);
    return new NextResponse(null, { status: 500 });
  }
}
