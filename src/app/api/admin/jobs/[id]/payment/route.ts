import { NextResponse } from 'next/server';
import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MOLLIE_API = 'https://api.mollie.com/v2/payments';

/** Recorded straight away; nobody has to confirm cash that is already in hand. */
const IMMEDIATE = new Set(['contant', 'pin', 'bank', 'tikkie']);
/** Billed later, so it is not money yet. */
const ON_ACCOUNT = 'factuur';

/**
 * Payment at the kerb.
 *
 * Three shapes, one endpoint:
 *
 *   ideal    a request the customer scans and pays there and then
 *   contant  cash, recorded as received by this monteur
 *   factuur  a business customer who will be invoiced
 *
 * Separate from the webshop's Mollie flow on purpose — its own route, its own
 * webhook, its own metadata. A change to how the shop takes an order must never
 * be able to break how a monteur takes money at 03:00 with a customer waiting.
 *
 * The amount is read from the job, not from the request. Whatever the screen
 * believes, what the customer owes is what the office agreed — otherwise the
 * price becomes whatever the last person to tap the button typed.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireCrmUser();
  const { id } = await params;
  if (!UUID.test(id)) {
    return NextResponse.json({ error: 'Ongeldig klus-id' }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 });
  }

  const method = String(body.method ?? '');
  if (!['ideal', ON_ACCOUNT, ...IMMEDIATE].includes(method)) {
    return NextResponse.json({ error: 'Onbekende betaalmethode' }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  /* RLS decides whether this person may see the job at all. */
  const { data: job } = await supabase
    .from('jobs')
    .select('id, technician_id, final_price, quoted_price, customer_name, kenteken, car_make, car_model')
    .eq('id', id)
    .maybeSingle();

  if (!job) {
    return NextResponse.json({ error: 'Klus niet gevonden' }, { status: 404 });
  }

  const due = Number(job.final_price ?? job.quoted_price) || 0;
  if (due <= 0) {
    return NextResponse.json(
      { error: 'Deze klus heeft nog geen prijs. Vul die eerst in.' },
      { status: 400 }
    );
  }

  /** Who had the money in their hand — null when the office received it. */
  const { data: me } = await supabase
    .from('technicians')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  /* ── cash, pin, bank, or on account: recorded, nothing to wait for ── */
  if (method !== 'ideal') {
    const { data: row, error } = await supabase
      .from('job_payments')
      .insert({
        job_id: id,
        amount: due,
        method,
        received_by: IMMEDIATE.has(method) ? (me?.id ?? null) : null,
        status: method === ON_ACCOUNT ? 'open' : 'betaald',
        created_by: user.id,
        note: typeof body.note === 'string' ? body.note.slice(0, 200) : null,
      })
      .select('id')
      .single();

    if (error) {
      return NextResponse.json(
        {
          error: /column|does not exist/i.test(error.message)
            ? 'Voer supabase/migrations/0021_job_payments_ideal.sql uit.'
            : error.message,
        },
        { status: 500 }
      );
    }

    /* Stamp the commission on anything that is actually money. */
    if (method !== ON_ACCOUNT) {
      await supabase.rpc('crm_settle_payment', { p_payment: row.id, p_status: 'betaald' });
    }

    return NextResponse.json({
      id: row.id,
      method,
      amount: due,
      say:
        method === ON_ACCOUNT
          ? 'Op rekening gezet. Het kantoor factureert dit.'
          : `€ ${due.toFixed(2).replace('.', ',')} genoteerd.`,
    });
  }

  /* ── iDEAL: a request the customer pays from their own banking app ── */
  const mollieKey = process.env.MOLLIE_API_KEY;
  if (!mollieKey) {
    return NextResponse.json({ error: 'Betalen is niet geconfigureerd.' }, { status: 503 });
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.autosleutel24.nl';
  const car = [job.car_make, job.car_model].filter(Boolean).join(' ');

  const { data: row, error } = await supabase
    .from('job_payments')
    .insert({
      job_id: id,
      amount: due,
      method: 'ideal',
      received_by: null, // the money goes to the company, not into a pocket
      status: 'open',
      requested_at: new Date().toISOString(),
      created_by: user.id,
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json(
      {
        error: /column|does not exist/i.test(error.message)
          ? 'Voer supabase/migrations/0021_job_payments_ideal.sql uit.'
          : error.message,
      },
      { status: 500 }
    );
  }

  let mollie: Response;
  try {
    mollie = await fetch(MOLLIE_API, {
      method: 'POST',
      headers: { Authorization: `Bearer ${mollieKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: { currency: 'EUR', value: due.toFixed(2) },
        description: `Autosleutel24 — ${car || 'sleutelservice'}${job.kenteken ? ` (${job.kenteken})` : ''}`,
        redirectUrl: `${base}/betaald`,
        webhookUrl: `${base}/api/jobs/payment-webhook`,
        /* Its own metadata shape, so the webshop webhook can never claim it. */
        metadata: { kind: 'job', jobPaymentId: row.id, jobId: id },
        method: 'ideal',
      }),
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    await supabase.from('job_payments').delete().eq('id', row.id);
    return NextResponse.json({ error: 'Mollie reageerde niet. Probeer het opnieuw.' }, { status: 504 });
  }

  if (!mollie.ok) {
    /* No orphan "open" row for a request that was never created. */
    await supabase.from('job_payments').delete().eq('id', row.id);
    console.error('Mollie rejected the job payment', await mollie.text());
    return NextResponse.json({ error: 'Betaalverzoek kon niet worden aangemaakt.' }, { status: 502 });
  }

  const json = await mollie.json();
  const checkoutUrl = json._links?.checkout?.href ?? null;

  await supabase
    .from('job_payments')
    .update({ mollie_payment_id: json.id, checkout_url: checkoutUrl })
    .eq('id', row.id);

  return NextResponse.json({
    id: row.id,
    method: 'ideal',
    amount: due,
    checkoutUrl,
    say: 'Laat de klant de QR-code scannen.',
  });
}
