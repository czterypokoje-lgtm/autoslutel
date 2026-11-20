'use server';
import { notFound, redirect } from 'next/navigation';
import { requireWarehouseUser } from '@/lib/crmSession';
import { createTestParcel, shippingTestEnabled, shippingUuid } from '@/lib/kfcShippingTest';

export async function prepareShippingTestParcel(fields: FormData) {
  if (!shippingTestEnabled) notFound();
  await requireWarehouseUser('/admin/verzending');
  let result;
  try {
    result = await createTestParcel(fields);
  } catch {
    const order = String(fields.get('order') ?? '');
    redirect('/admin/verzending?' + new URLSearchParams({ ...(shippingUuid.test(order) ? { order } : {}), error: 'parcel' }));
  }
  redirect('/admin/verzending?' + new URLSearchParams({ order: result.order, parcel: result.id, print: '1' }));
}
