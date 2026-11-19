import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * Mollie's callback for a payment taken at the kerb.
 *
 * Its own route, separate from the webshop's. Mollie posts nothing but a
 * payment id, so both webhooks would otherwise have to guess whether an id
 * belongs to an order or to a job — and a wrong guess marks the wrong thing
 * paid. Two routes, two webhookUrls, no guessing.
 *
 * Mollie sends only the id and never a status, which is deliberate on their
 * side: a forged POST cannot mark anything paid, because the status is always
 * fetched back from Mollie with our own key.
 *
 * Idempotent, because Mollie retries until it gets a 200. crm_settle_payment
 * returns 'ongewijzigd' when the state already matches, and a retry then costs
 * one query and changes nothing.
 */
const STATE: Record<string, 'betaald' | 'mislukt' | 'terugbetaald'> = {
  paid: 'betaald',
  canceled: 'mislukt',
  expired: 'mislukt',
  failed: 'mislukt',
};

export async function POST(request: Request) {
  const key = process.env.MOLLIE_API_KEY;
  if (!key) {
    console.error('Job payment webhook called without MOLLIE_API_KEY');
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

  if (!paymentId) {
    // 200: a malformed callback must not make Mollie retry forever.
    return new NextResponse(null, { status: 200 });
  }

  const response = await fetch(`https://api.mollie.com/v2/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(10000),
  }).catch(() => null);

  if (!response?.ok) {
    // 500 so Mollie tries again — this one is worth retrying.
    console.error('Could not read payment back from Mollie:', paymentId);
    return new NextResponse(null, { status: 500 });
  }

  const payment = await response.json();

  /*
   * Only ours. The webshop's payments carry no `kind`, so an id that reaches
   * the wrong webhook is ignored rather than applied to a random row.
   */
  if (payment?.metadata?.kind !== 'job' || !payment?.metadata?.jobPaymentId) {
    return new NextResponse(null, { status: 200 });
  }

  const state = STATE[String(payment.status)];
  if (!state) {
    // 'open' or 'pending': nothing decided yet, and nothing to write.
    return new NextResponse(null, { status: 200 });
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.rpc('crm_settle_payment', {
    p_payment: payment.metadata.jobPaymentId,
    p_status: state,
  });

  if (error) {
    console.error('Settling the job payment failed:', error.message);
    return new NextResponse(null, { status: 500 });
  }

  return new NextResponse(null, { status: 200 });
}
