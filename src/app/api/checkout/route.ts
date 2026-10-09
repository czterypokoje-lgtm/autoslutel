import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getShopProductBySlug } from '@/lib/shopCatalog';
import { isSellable } from '@/lib/finder';
import { MAX_QTY_PER_LINE } from '@/lib/cart';
import { shippingFor, VAT_RATE } from '@/lib/catalog';
import { rateLimit, getClientIp, tooManyRequests } from '@/lib/rateLimit';

/**
 * Turns a basket into an order and a Mollie payment.
 *
 * **Nothing about money is read from the request.** The body carries slugs
 * and quantities; every price, the VAT split, the shipping and the total are
 * computed here from the catalogue. The basket lives in the visitor's own
 * localStorage, so a posted price is a number the customer chose — accepting
 * one would let anyone buy a €249 smart key for a cent.
 *
 * This is the same rule `/api/agent/book` follows for the voice agent, and
 * for the same reason: the price the customer was shown is a claim, and the
 * price we charge has to be ours.
 *
 * Two further refusals, both deliberate:
 *   - A `programming` article cannot be bought. The shop sells what can be
 *     posted; a key that must be learned at the car is a visit, and letting
 *     one through here would ship a customer a part that cannot work.
 *   - An unpublished or unpriced article is not an error to work around. The
 *     order is refused and says which line, so the basket can show it.
 */

export const dynamic = 'force-dynamic';

const RATE_LIMIT = 10; // checkouts
const RATE_WINDOW = 600; // per 10 minutes, per IP
const MAX_LINES = 30;

/** Exactly what we accept. Everything else in the body is ignored. */
interface Body {
  lines?: { slug?: unknown; qty?: unknown }[];
  email?: unknown;
  name?: unknown;
  phone?: unknown;
  street?: unknown;
  postcode?: unknown;
  city?: unknown;
}

const text = (value: unknown, max: number): string =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';

/*
 * Deliberately permissive: a real address is a thing a human reads, and a
 * strict regex on a Dutch street name rejects "'s-Gravenweg" and "Burg. de
 * Withstraat". A wrong address is a parcel that comes back, not a security
 * problem — so this checks that a field was filled in, not that it is valid.
 */
const EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const POSTCODE = /^\d{4}\s?[A-Za-z]{2}$/;

/** AS24-2026-00042 — a customer cannot be given a uuid. */
async function nextOrderNumber(
  db: ReturnType<typeof createSupabaseAdminClient>
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `AS24-${year}-`;

  /*
   * Highest number this year, plus one. A sequence would be tidier, but this
   * table already exists and a gap-free number is not a requirement — only a
   * unique one is, which the column constraint guarantees. On a collision the
   * insert fails and the customer retries, which is rare enough to accept.
   */
  const { data } = await db
    .from('orders')
    .select('order_number')
    .like('order_number', `${prefix}%`)
    .order('order_number', { ascending: false })
    .limit(1);

  const last = data?.[0]?.order_number as string | undefined;
  const n = last ? Number(last.slice(prefix.length)) : 0;
  return `${prefix}${String((Number.isFinite(n) ? n : 0) + 1).padStart(5, '0')}`;
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = await rateLimit(`checkout:${ip}`, RATE_LIMIT, RATE_WINDOW);
  if (!limit.ok) return tooManyRequests(RATE_WINDOW) as NextResponse;

  const key = process.env.MOLLIE_API_KEY;
  if (!key) {
    // Fail closed and say nothing useful: an order we cannot take payment for
    // is worse than no order.
    console.error('Checkout called without MOLLIE_API_KEY');
    return NextResponse.json(
      { error: 'Afrekenen is tijdelijk niet mogelijk. Bel ons even.' },
      { status: 503 }
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Ongeldig verzoek.' }, { status: 400 });
  }

  /* ── the customer ─────────────────────────────────────────────────── */

  const email = text(body.email, 200);
  const name = text(body.name, 120);
  const phone = text(body.phone, 40);
  const street = text(body.street, 200);
  const postcode = text(body.postcode, 10).toUpperCase().replace(/\s+/g, ' ');
  const city = text(body.city, 120);

  const missing: string[] = [];
  if (!EMAIL.test(email)) missing.push('e-mailadres');
  if (!name) missing.push('naam');
  if (!street) missing.push('adres');
  if (!POSTCODE.test(postcode)) missing.push('postcode');
  if (!city) missing.push('woonplaats');

  if (missing.length) {
    return NextResponse.json(
      { error: `Vul nog in: ${missing.join(', ')}.` },
      { status: 400 }
    );
  }

  /* ── the lines, priced by us ──────────────────────────────────────── */

  const requested = Array.isArray(body.lines) ? body.lines.slice(0, MAX_LINES) : [];
  if (!requested.length) {
    return NextResponse.json({ error: 'Uw mandje is leeg.' }, { status: 400 });
  }

  // One line per article, so ten lines of the same slug cannot multiply past
  // the per-line cap.
  const wanted = new Map<string, number>();
  for (const line of requested) {
    const slug = text(line.slug, 200);
    const qty = Math.floor(Number(line.qty));
    if (!slug || !Number.isFinite(qty) || qty < 1) continue;
    wanted.set(slug, Math.min(MAX_QTY_PER_LINE, (wanted.get(slug) ?? 0) + qty));
  }

  if (!wanted.size) {
    return NextResponse.json({ error: 'Uw mandje is leeg.' }, { status: 400 });
  }

  const items: {
    slug: string;
    title: string;
    qty: number;
    unit_price_inc: number;
    line_total_inc: number;
    article_code: string | null;
  }[] = [];
  const rejected: { slug: string; reason: string }[] = [];
  let subtotalInc = 0;

  for (const [slug, qty] of wanted) {
    const product = await getShopProductBySlug(slug);

    if (!product) {
      rejected.push({ slug, reason: 'Dit artikel bestaat niet meer.' });
      continue;
    }
    if (!isSellable(product)) {
      // The one refusal that is a feature, not a failure.
      rejected.push({
        slug,
        reason:
          'Deze sleutel moet bij de auto ingeleerd worden en versturen we niet. Bel ons voor een afspraak.',
      });
      continue;
    }
    if (product.price == null) {
      rejected.push({ slug, reason: 'Van dit artikel is de prijs nog niet bekend.' });
      continue;
    }
    if (!product.inStock) {
      rejected.push({ slug, reason: 'Dit artikel is tijdelijk niet op voorraad.' });
      continue;
    }

    const unit = Math.round(product.price * 100) / 100;
    const lineTotal = Math.round(unit * qty * 100) / 100;
    subtotalInc += lineTotal;

    items.push({
      slug,
      title: product.titleNl || product.title,
      qty,
      unit_price_inc: unit,
      line_total_inc: lineTotal,
      article_code: product.articleCode ?? null,
    });
  }

  if (rejected.length) {
    /*
     * All-or-nothing. Silently dropping a line and charging for the rest means
     * a customer pays and then finds the part they came for is missing — and
     * the one line most likely to be rejected is exactly the one they wanted.
     */
    return NextResponse.json(
      {
        error: 'Een of meer artikelen kunnen niet besteld worden.',
        rejected,
      },
      { status: 409 }
    );
  }

  subtotalInc = Math.round(subtotalInc * 100) / 100;
  const shipping = shippingFor(subtotalInc);
  const totalInc = Math.round((subtotalInc + shipping) * 100) / 100;

  /*
   * The BTW split, derived from the gross total rather than summed per line.
   * Summing a per-line rounded VAT gives a figure that disagrees with
   * 21% of the total by a cent or two, and a return has to reconcile.
   */
  const totalEx = Math.round((totalInc / (1 + VAT_RATE)) * 100) / 100;
  const totalVat = Math.round((totalInc - totalEx) * 100) / 100;

  /* ── the order ────────────────────────────────────────────────────── */

  /*
   * No service-role key means no order can be recorded. Refuse before taking
   * any money: a payment with no order behind it is the one failure mode
   * there is no clean way back from.
   */
  let db;
  try {
    db = createSupabaseAdminClient();
  } catch {
    console.error('Checkout called without service-role Supabase credentials');
    return NextResponse.json(
      { error: 'Afrekenen is tijdelijk niet mogelijk. Bel ons even.' },
      { status: 503 }
    );
  }

  const orderNumber = await nextOrderNumber(db);

  const { data: order, error: insertError } = await db
    .from('orders')
    .insert({
      order_number: orderNumber,
      status: 'pending',
      email,
      name,
      phone: phone || null,
      street,
      postcode,
      city,
      country: 'NL',
      // Parts only. A shop order never needs a technician, by construction —
      // anything that did was refused above.
      needs_technician: false,
      items,
      subtotal_inc: subtotalInc,
      shipping_cost: shipping,
      total_inc: totalInc,
      total_ex_vat: totalEx,
      total_vat: totalVat,
      currency: 'EUR',
    })
    .select('id, order_number')
    .single();

  if (insertError || !order) {
    console.error('Order insert failed:', insertError?.message);
    return NextResponse.json(
      { error: 'Bestellen lukte niet. Probeer het opnieuw of bel ons.' },
      { status: 500 }
    );
  }

  /* ── the payment ──────────────────────────────────────────────────── */

  const origin = new URL(request.url).origin;

  const payment = await fetch('https://api.mollie.com/v2/payments', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: { currency: 'EUR', value: totalInc.toFixed(2) },
      description: `Autosleutel24 bestelling ${order.order_number}`,
      redirectUrl: `${origin}/winkel/bestelling/${order.order_number}`,
      webhookUrl: `${origin}/api/orders/payment-webhook`,
      /*
       * `kind: 'order'` is what keeps the two webhooks apart. The job webhook
       * ignores anything that is not `kind: 'job'` and this one ignores
       * anything that is not `kind: 'order'`, so a payment id arriving at the
       * wrong route changes nothing instead of marking the wrong thing paid.
       */
      metadata: { kind: 'order', orderId: order.id, orderNumber: order.order_number },
    }),
    signal: AbortSignal.timeout(10000),
  }).catch(() => null);

  if (!payment?.ok) {
    console.error('Mollie payment creation failed for', order.order_number);
    /*
     * The order row stays, in `pending`, with no payment id. That is the
     * honest record: someone tried to order and we could not take the money,
     * which the office can see and follow up. Deleting it would erase the
     * only trace of a lost sale.
     */
    return NextResponse.json(
      { error: 'De betaling kon niet gestart worden. Probeer het opnieuw.' },
      { status: 502 }
    );
  }

  const created = await payment.json();
  const checkoutUrl = created?._links?.checkout?.href;

  if (!checkoutUrl) {
    console.error('Mollie returned no checkout url for', order.order_number);
    return NextResponse.json(
      { error: 'De betaling kon niet gestart worden. Probeer het opnieuw.' },
      { status: 502 }
    );
  }

  await db
    .from('orders')
    .update({ mollie_payment_id: created.id })
    .eq('id', order.id);

  return NextResponse.json({
    orderNumber: order.order_number,
    checkoutUrl,
  });
}
