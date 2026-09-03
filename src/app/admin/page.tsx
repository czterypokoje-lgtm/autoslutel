import { redirect } from 'next/navigation';
import { getCrmUser, homeForRole } from '@/lib/crmSession';

/**
 * /admin has nothing of its own to show. Where it sends you depends on who you
 * are: the office starts at the leads pipeline, a monteur at today's work.
 */
export default async function AdminIndex() {
  const user = await getCrmUser();
  redirect(user ? homeForRole(user.role) : '/admin/login');
}
