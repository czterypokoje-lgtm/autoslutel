import { requireOfficeUser } from '@/lib/crmSession';
import AccountingSandbox from './AccountingSandbox';

export default async function AccountingSandboxPage() {
  await requireOfficeUser('/admin/boekhoudtest');
  return <AccountingSandbox />;
}
