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

export async function createLabel(orderId: string): Promise<{ carrier: string; tracking: string | null; label_url: string; provider: 'sendcloud' | 'eigen' }> {
  const db = createSupabaseAdminClient();
  const { data: order, error } = await db.from('kfc_shop_orders').select('id, shop, number, status, fulfilment, ship_name, ship_company, ship_street, ship_postcode, ship_city, country, ship_phone, ship_email, weight_grams, label_url, carrier, tracking_code').eq('id', orderId).maybeSingle();
  if (error || !order) throw new StockError('Bestelling niet gevonden.', 404);
  if (order.status !== 'processing') throw new StockError('Alleen betaalde bestellingen krijgen een label.', 409);
  if (order.label_url && order.carrier) return { carrier: order.carrier, tracking: order.tracking_code, label_url: order.label_url, provider: order.carrier === 'eigen' ? 'eigen' : 'sendcloud' };
  if (!order.ship_name || !order.ship_street || !order.ship_postcode || !order.ship_city) throw new StockError('Geen volledig verzendadres op deze bestelling.', 409);

  if (sendcloudConfigured()) {
    const auth = Buffer.from(`${process.env.SENDCLOUD_PUBLIC_KEY}:${process.env.SENDCLOUD_SECRET_KEY}`).toString('base64');
    const body = { parcel: {
      name: order.ship_name, company_name: order.ship_company ?? '', address: order.ship_street, city: order.ship_city, postal_code: order.ship_postcode,
      country: order.country ?? 'NL', telephone: order.ship_phone ?? '', email: order.ship_email ?? '', order_number: `${order.shop} #${order.number}`,
      weight: ((order.weight_grams ?? 250) / 1000).toFixed(3), request_label: true,
      ...(process.env.SENDCLOUD_SHIPPING_METHOD_ID ? { shipment: { id: Number(process.env.SENDCLOUD_SHIPPING_METHOD_ID) } } : {}),
    } };
    const response = await fetch('https://panel.sendcloud.sc/api/v2/parcels', { method: 'POST', headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body), cache: 'no-store' });
    const json = await response.json().catch(() => null);
    if (!response.ok) throw new StockError(`Sendcloud: ${json?.error?.message ?? `HTTP ${response.status}`}`, 502);
    const parcel = json.parcel;
    const result = { carrier: parcel?.carrier?.code ?? 'sendcloud', tracking: parcel?.tracking_number ?? null, label_url: parcel?.label?.label_printer?.[0] ?? parcel?.label?.normal_printer?.[0] ?? '', provider: 'sendcloud' as const };
    await db.from('kfc_shop_orders').update({ carrier: result.carrier, tracking_code: result.tracking, label_url: result.label_url, label_created_at: new Date().toISOString() }).eq('id', orderId);
    return result;
  }
  const result = { carrier: 'eigen', tracking: null, label_url: `/admin/bestellingen/${orderId}/label`, provider: 'eigen' as const };
  await db.from('kfc_shop_orders').update({ carrier: 'eigen', label_url: result.label_url, label_created_at: new Date().toISOString() }).eq('id', orderId);
  return result;
}

/** Hand-typed carrier and tracking code, for the own-label path. */
export async function setTracking(orderId: string, carrier: string, tracking: string): Promise<void> {
  const { error } = await createSupabaseAdminClient().from('kfc_shop_orders').update({ carrier: carrier.trim().slice(0, 40) || 'eigen', tracking_code: tracking.trim().slice(0, 80) || null }).eq('id', orderId);
  if (error) throw new StockError(`Opslaan mislukt: ${error.message}`, 500);
}
