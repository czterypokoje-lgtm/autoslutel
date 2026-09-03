import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SITE_CONFIG } from '@/config/site.config';
import { shippingFor, VAT_RATE } from '@/lib/catalog';
import { getShopProductBySlug } from '@/lib/shopCatalog';
import { SERVICE_SURCHARGE, SERVICE_LABEL, type ServiceOption } from '@/lib/cart';
import { rateLimit, getClientIp, tooManyRequests } from '@/lib/rateLimit';

/**
 * Creates an order and starts a Mollie payment.
 *
 * This replaces a mock that returned `{ url: '/webshop/success' }` without
 * taking any money — a checkout that reports success without a payment is
 * worse than no checkout at all, so this route fails closed: with no
 * MOLLIE_API_KEY configured it returns 503 and creates nothing.
 *
 * Prices are recalculated here from the catalogue. The basket lives in the
 * customer's localStorage and carries only slugs, quantities and a service
 * choice, so nothing the client sends can change what is charged.
 *
 * Required environment:
 *   MOLLIE_API_KEY   live_… or test_…
 * Optional:
 *   NEXT_PUBLIC_SITE_URL   for the redirect/webhook host in preview builds
 */

export const dynamic = 'force-dynamic';

const RATE_LIMIT = 20;
const RATE_WINDOW = 3600;

const MOLLIE_API = 'https://api.mollie.com/v2/payments';

interface IncomingLine {
  slug: unknown;
  quantity: unknown;
  service: unknown;
}

const SERVICES: ServiceOption[] = ['product_only', 'send_in', 'mobile_tech'];

const clean = (v: unknown, max: number): string | null => {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
};

/** AS24-2026-00042 — a customer cannot be given a database id. */
function orderNumber(seq: number): string {
  return `AS24-${new Date().getFullYear()}-${String(seq).padStart(5, '0')}`;
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = await rateLimit(`checkout:${ip}`, RATE_LIMIT, RATE_WINDOW);
  if (!limit.ok) return tooManyRequests(RATE_WINDOW);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 });
  }

  // Honeypot — answer 200 so a bot learns nothing, but create nothing.
  if (typeof body.company === 'string' && body.company.trim() !== '') {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  /* ── recalculate the basket server-side ── */

  const incoming = Array.isArray(body.lines) ? (body.lines as IncomingLine[]) : [];
  if (!incoming.length) {
    return NextResponse.json({ error: 'Winkelmand is leeg' }, { status: 400 });
  }

  const items: {
    slug: string; sku: string; title: string; quantity: number;
    service: ServiceOption; unitPrice: number; surcharge: number; lineTotal: number;
  }[] = [];

  for (const raw of incoming.slice(0, 50)) {
    const slug = clean(raw.slug, 120);
    if (!slug) continue;
    /*
     * Through the merged catalogue: a price the office corrected has to be the
     * price that is charged, and a product taken offline or out of stock must
     * not be sellable through a stale basket someone left open.
     */
    const product = await getShopProductBySlug(slug);
    if (!product || product.audience !== 'public' || !product.inStock) continue;

    const unitPrice = product.price;
    if (unitPrice == null) continue;

    const quantity = Math.min(20, Math.max(1, Number(raw.quantity) || 1));
    const service = SERVICES.includes(raw.service as ServiceOption)
      ? (raw.service as ServiceOption)
      : 'product_only';
    const surcharge = SERVICE_SURCHARGE[service];

    items.push({
      slug,
      sku: product.id,
      title: product.titleNl,
      quantity,
      service,
      unitPrice,
      surcharge,
      lineTotal: Math.round((unitPrice * quantity + surcharge) * 100) / 100,
    });
  }

  if (!items.length) {
    return NextResponse.json({ error: 'Geen geldige producten' }, { status: 400 });
  }

  const subtotal = Math.round(items.reduce((s, i) => s + i.lineTotal, 0) * 100) / 100;
  const shipping = shippingFor(subtotal);
  const totalInc = Math.round((subtotal + shipping) * 100) / 100;
  const totalExVat = Math.round((totalInc / (1 + VAT_RATE)) * 100) / 100;

  /* ── customer details ── */

  const email = clean(body.email, 160);
  const name = clean(body.name, 120);
  const phone = clean(body.phone, 40);
  const street = clean(body.street, 160);
  const postcode = clean(body.postcode, 12);
  const city = clean(body.city, 80);

  if (!email || !email.includes('@') || !name || !street || !postcode || !city) {
    return NextResponse.json({ error: 'Vul alle verplichte velden in' }, { status: 400 });
  }

  const needsTechnician = items.some((i) => i.service === 'mobile_tech');
  const kenteken = clean(body.kenteken, 12);
  if (needsTechnician && !kenteken) {
    return NextResponse.json(
      { error: 'Voor een monteurbezoek hebben wij uw kenteken nodig' },
      { status: 400 }
    );
  }

  /* ── fail closed without a payment provider ── */

  const mollieKey = process.env.MOLLIE_API_KEY;
  if (!mollieKey) {
    console.error('MOLLIE_API_KEY is not configured — refusing to create an order');
    return NextResponse.json(
      {
        error:
          'Online betalen is nog niet beschikbaar. Bel ons op ' +
          `${SITE_CONFIG.phone} en wij ronden uw bestelling telefonisch af.`,
      },
      { status: 503 }
    );
  }

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.storage_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.storage_SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const base = process.env.NEXT_PUBLIC_SITE_URL || SITE_CONFIG.domain;

  try {
    const { data: order, error } = await supabase
      .from('orders')
      .insert([
        {
          order_number: orderNumber(Date.now() % 100000),
          status: 'pending',
          email,
          name,
          phone,
          street,
          postcode: postcode.toUpperCase().replace(/\s+/g, ''),
          city,
          kenteken,
          items,
          subtotal_inc: subtotal,
          shipping_cost: shipping,
          total_inc: totalInc,
          total_ex_vat: totalExVat,
          total_vat: Math.round((totalInc - totalExVat) * 100) / 100,
          needs_technician: needsTechnician,
        },
      ])
      .select('id, order_number')
      .single();

    if (error || !order) {
      console.error('Order insert failed:', error);
      return NextResponse.json({ error: 'Bestelling kon niet worden aangemaakt' }, { status: 500 });
    }

    // A mobile-technician order is also a job for the service side, so it goes
    // into the same leads table the rest of the site writes to.
    if (needsTechnician) {
      await supabase.from('leads').insert([
        {
          brand: 'Webshop',
          model: items.map((i) => i.title).join(', ').slice(0, 80),
          service: SERVICE_LABEL.mobile_tech,
          location: postcode,
          postcode,
          phone,
          name,
          email,
          source: 'webshop_service',
        },
      ]).then(undefined, (e) => console.error('Lead insert failed', e));
    }

    const payment = await fetch(MOLLIE_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${mollieKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: { currency: 'EUR', value: totalInc.toFixed(2) },
        description: `Autosleutel24 ${order.order_number}`,
        redirectUrl: `${base}/webshop/bedankt?order=${order.order_number}`,
        webhookUrl: `${base}/api/checkout/webhook`,
        metadata: { orderId: order.id, orderNumber: order.order_number },
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!payment.ok) {
      console.error('Mollie rejected the payment', await payment.text());
      return NextResponse.json({ error: 'Betaling kon niet worden gestart' }, { status: 502 });
    }

    const json = await payment.json();
    await supabase
      .from('orders')
      .update({ mollie_payment_id: json.id })
      .eq('id', order.id);

    return NextResponse.json({
      orderNumber: order.order_number,
      checkoutUrl: json._links?.checkout?.href,
    });
  } catch (err) {
    console.error('Checkout failed:', err);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}
