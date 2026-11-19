import 'server-only';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { StockError } from '@/lib/kfcInventory';

/*
 * The label step between picking and shipping.
 *
 * With SENDCLOUD_PUBLIC_KEY and SENDCLOUD_SECRET_KEY set, a parcel is created
 * at Sendcloud with a label requested; the carrier, tracking code and label
 * PDF come back and are stored on the order. Without them the CRM prints its
 * own label (QR with the order number, sender and recipient) from
 * /admin/bestellingen/<id>/label, and the carrier is filled in by hand.
 * SENDCLOUD_SHIPPING_METHOD_ID picks the method; unset = Sendcloud's default.
 */

export const sendcloudConfigured = () => !!(process.env.SENDCLOUD_PUBLIC_KEY && process.env.SENDCLOUD_SECRET_KEY);

type Label = { carrier: string; tracking: string | null; label_url: string; provider: 'sendcloud' | 'eigen' };

const ORDER_COLUMNS = 'id, shop, number, status, fulfilment, ship_name, ship_company, ship_street, ship_postcode, ship_city, country, ship_phone, ship_email, weight_grams, label_url, carrier, tracking_code, sendcloud_parcel_id, label_claimed_at';

/* A label that already exists. The parcel id is the reliable proof: label_url
   alone was the old test and it lies, because Sendcloud can answer without a
   label URL and '' then read as "no parcel yet". A url-with-carrier is still
   accepted for rows labelled before 0098, which have no parcel id. */
function existing(order: { carrier: string | null; tracking_code: string | null; label_url: string | null; sendcloud_parcel_id: string | null }): Label | null {
  if (order.sendcloud_parcel_id) return { carrier: order.carrier ?? 'sendcloud', tracking: order.tracking_code, label_url: order.label_url ?? '', provider: 'sendcloud' };
  if (order.label_url && order.carrier) return { carrier: order.carrier, tracking: order.tracking_code, label_url: order.label_url, provider: order.carrier === 'eigen' ? 'eigen' : 'sendcloud' };
  return null;
}

export async function createLabel(orderId: string): Promise<Label> {
  const db = createSupabaseAdminClient();
  const { data: order, error } = await db.from('kfc_shop_orders').select(ORDER_COLUMNS).eq('id', orderId).maybeSingle();
  if (error || !order) throw new StockError('Bestelling niet gevonden.', 404);
  if (order.status !== 'processing') throw new StockError('Alleen betaalde bestellingen krijgen een label.', 409);
  const already = existing(order);
  if (already) return already;
  if (!order.ship_name || !order.ship_street || !order.ship_postcode || !order.ship_city) throw new StockError('Geen volledig verzendadres op deze bestelling.', 409);

  /* The own label is a URL, not a purchase: no claim needed, repeating is free. */
  if (!sendcloudConfigured()) {
    const result: Label = { carrier: 'eigen', tracking: null, label_url: `/admin/bestellingen/${orderId}/label`, provider: 'eigen' };
    const { error: saveError } = await db.from('kfc_shop_orders').update({ carrier: 'eigen', label_url: result.label_url, label_created_at: new Date().toISOString() }).eq('id', orderId);
    if (saveError) throw new StockError(`Label opslaan mislukt: ${saveError.message}`, 500);
    return result;
  }

  /* Claim first — a paid parcel must not be bought twice. Two concurrent calls
     both passed the read above; only the one that flips label_claimed_at from
     null may call Sendcloud. */
  const { data: claim, error: claimError } = await db.from('kfc_shop_orders')
    .update({ label_claimed_at: new Date().toISOString() }).eq('id', orderId).is('label_claimed_at', null).select('id').maybeSingle();
  if (claimError) throw new StockError(`Label claimen mislukt: ${claimError.message}`, 500);
  if (!claim) {
    const { data: fresh } = await db.from('kfc_shop_orders').select(ORDER_COLUMNS).eq('id', orderId).maybeSingle();
    const done = fresh && existing(fresh);
    if (done) return done;
    /* ponytail: a claim left behind by a process that died mid-call keeps the
       order at 409 until someone clears label_claimed_at — the safe side of
       the trade. A reaper (claim older than a few minutes and no parcel id)
       is the upgrade if it turns into a daily annoyance. */
    throw new StockError('Label wordt al gemaakt.', 409);
  }
  const release = () => db.from('kfc_shop_orders').update({ label_claimed_at: null }).eq('id', orderId);

  const auth = Buffer.from(`${process.env.SENDCLOUD_PUBLIC_KEY}:${process.env.SENDCLOUD_SECRET_KEY}`).toString('base64');
  const body = { parcel: {
    name: order.ship_name, company_name: order.ship_company ?? '', address: order.ship_street, city: order.ship_city, postal_code: order.ship_postcode,
    country: order.country ?? 'NL', telephone: order.ship_phone ?? '', email: order.ship_email ?? '', order_number: `${order.shop} #${order.number}`,
    weight: ((order.weight_grams ?? 250) / 1000).toFixed(3), request_label: true,
    ...(process.env.SENDCLOUD_SHIPPING_METHOD_ID ? { shipment: { id: Number(process.env.SENDCLOUD_SHIPPING_METHOD_ID) } } : {}),
  } };

  let json: { parcel?: { id?: number | string; carrier?: { code?: string }; tracking_number?: string; label?: { label_printer?: string[]; normal_printer?: string[] } }; error?: { message?: string } } | null;
  let response: Response;
  try {
    response = await fetch('https://panel.sendcloud.sc/api/v2/parcels', { method: 'POST', headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body), cache: 'no-store' });
    json = await response.json().catch(() => null);
  } catch (fetchError) {
    /* The request never completed, so in all but the unlucky case no parcel
       was created: release, so the order is not stuck on a network blip.
       ponytail: a parcel created behind a connection that then died would be
       bought twice on the retry — a Sendcloud idempotency key on
       order_number is the upgrade if that ever actually happens. */
    await release();
    throw new StockError(`Sendcloud onbereikbaar: ${(fetchError as Error).message}`, 502);
  }
  if (!response.ok) {
    await release();
    throw new StockError(`Sendcloud: ${json?.error?.message ?? `HTTP ${response.status}`}`, 502);
  }

  const parcel = json?.parcel;
  const result: Label = { carrier: parcel?.carrier?.code ?? 'sendcloud', tracking: parcel?.tracking_number ?? null, label_url: parcel?.label?.label_printer?.[0] ?? parcel?.label?.normal_printer?.[0] ?? '', provider: 'sendcloud' };
  const { error: saveError } = await db.from('kfc_shop_orders')
    .update({ carrier: result.carrier, tracking_code: result.tracking, label_url: result.label_url, sendcloud_parcel_id: parcel?.id ? String(parcel.id) : null, label_created_at: new Date().toISOString() })
    .eq('id', orderId);
  if (saveError) {
    /* The parcel is bought and paid for. Keeping the claim is the point: a
       retry would buy a second one. The id goes in the message so the carrier
       and tracking code can be typed in by hand. */
    throw new StockError(`Parcel ${parcel?.id ?? '?'} is bij Sendcloud gemaakt, maar opslaan mislukte: ${saveError.message}. Vul vervoerder en trackingcode met de hand in.`, 500);
  }
  return result;
}

/** Hand-typed carrier and tracking code, for the own-label path. */
export async function setTracking(orderId: string, carrier: string, tracking: string): Promise<void> {
  const { error } = await createSupabaseAdminClient().from('kfc_shop_orders').update({ carrier: carrier.trim().slice(0, 40) || 'eigen', tracking_code: tracking.trim().slice(0, 80) || null }).eq('id', orderId);
  if (error) throw new StockError(`Opslaan mislukt: ${error.message}`, 500);
}
