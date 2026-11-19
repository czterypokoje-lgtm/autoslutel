import { requireOfficeUser } from '@/lib/crmSession';
import ShippingSetup from './ShippingSetup';

export default async function ShippingPage() {
  await requireOfficeUser('/admin/verzending');
  return <ShippingSetup />;
}
