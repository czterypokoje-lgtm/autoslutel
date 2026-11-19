import { requireOfficeUser } from '@/lib/crmSession';
import IntegrationSetup from './IntegrationSetup';

export default async function IntegrationsPage() {
  await requireOfficeUser('/admin/integraties');
  return <IntegrationSetup />;
}
