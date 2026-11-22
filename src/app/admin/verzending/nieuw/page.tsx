import { requireOfficeUser } from '@/lib/crmSession';
import ShippingSetup from '../ShippingSetup';

export default async function CreateShipmentPage() {
  await requireOfficeUser('/admin/verzending/nieuw');
  return <ShippingSetup />;
}
