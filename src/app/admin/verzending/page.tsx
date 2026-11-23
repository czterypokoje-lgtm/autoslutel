import { requireOfficeUser } from '@/lib/crmSession';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/** Shipments are made per order: this address opens the form for a new one. */
export default async function ShippingPage() {
  await requireOfficeUser('/admin/verzending');
  redirect('/admin/verzending/nieuw');
}
