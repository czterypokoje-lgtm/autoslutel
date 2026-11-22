import 'server-only';
import { IS_KEYFORCARS } from '@/config/install';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { carriers, type TestParcel } from './kfcShippingTestModel';

export const shippingTestEnabled = IS_KEYFORCARS && (process.env.KFC_DEMO_MODE === '1' ||
  (process.env.NODE_ENV === 'development' && process.env.KFC_SHIPPING_TEST === '1'));
export const shippingUuid = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
const db = () => createSupabaseAdminClient();

export async function listTestParcels(orderIds: string[]) {
  if (!orderIds.length) return [];
  const { data, error } = await db().from('kfc_shipping_test_parcels').select('*').in('order_id', orderIds).order('parcel_no');
  if (error) throw new Error('Could not load test parcels');
  return data as TestParcel[];
}

export async function getTestParcel(id: string) {
  if (!shippingUuid.test(id)) return null;
  const { data, error } = await db().from('kfc_shipping_test_parcels').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error('Could not load test parcel');
  return data as TestParcel | null;
}

export async function createTestParcel(fields: FormData) {
  const order = String(fields.get('order') ?? '');
  const service = String(fields.get('service') ?? '');
  const destination = String(fields.get('destination') ?? '').trim();
  const integer = (name: string, max: number) => {
    const value = Number(fields.get(name));
    if (!Number.isInteger(value) || value < 1 || value > max) throw new Error('Invalid parcel dimensions');
    return value;
  };
  const latitude = String(fields.get('latitude') ?? '').trim();
  const longitude = String(fields.get('longitude') ?? '').trim();
  const lat = latitude ? Number(latitude) : null;
  const lng = longitude ? Number(longitude) : null;
  if (!shippingUuid.test(order) || !carriers.some((carrier) => carrier.id === service) ||
      !destination || destination.length > 250 || (lat === null) !== (lng === null) ||
      (lat !== null && (!Number.isFinite(lat) || Math.abs(lat) > 90)) ||
      (lng !== null && (!Number.isFinite(lng) || Math.abs(lng) > 180))) throw new Error('Invalid parcel');
  const parcelNo = integer('parcel_no', 20);
  const payload = { order_id: order, parcel_no: parcelNo, service, destination, latitude: lat, longitude: lng,
    weight_grams: integer('weight', 70000), length_cm: integer('length', 200), width_cm: integer('width', 200), height_cm: integer('height', 200) };
  const { data: eligible, error: lookupError } = await db().from('kfc_shop_orders').select('id').eq('id', order)
    .eq('status', 'processing').in('fulfilment', ['open', 'picked']).eq('raw->>source', 'sample').maybeSingle();
  if (lookupError || !eligible) throw new Error('Order is not eligible for this test');
  const { error } = await db().from('kfc_shipping_test_parcels').upsert(payload, { onConflict: 'order_id,parcel_no', ignoreDuplicates: true });
  if (error) throw new Error('Could not save the test parcel');
  const { data, error: readError } = await db().from('kfc_shipping_test_parcels').select('id').eq('order_id', order).eq('parcel_no', parcelNo).single();
  if (readError) throw new Error('Could not read the test label');
  return { order, id: data.id as string };
}
