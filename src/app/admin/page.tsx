import { redirect } from 'next/navigation';
import { getCrmUser } from '@/lib/crmSession';

/**
 * /admin has nothing of its own to show — everyone signed in goes to the
 * overview homepage, which then shows the office or the monteur their own
 * view of it.
 */
export default async function AdminIndex() {
  const user = await getCrmUser();
  redirect(user ? '/admin/overzicht' : '/admin/login');
}
