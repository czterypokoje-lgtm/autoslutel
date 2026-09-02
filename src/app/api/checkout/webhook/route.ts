import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
    const { error } = await supabase
      .from('orders')
      .update({ status: next, paid_at: next === 'paid' ? new Date().toISOString() : null })
      .eq('mollie_payment_id', paymentId)
      .eq('status', 'pending');

    if (error) {
      console.error('Order status update failed', error);
      return new NextResponse(null, { status: 500 });
    }

    return new NextResponse(null, { status: 200 });
  } catch (err) {
    console.error('Webhook failed', err);
    return new NextResponse(null, { status: 500 });
  }
}
