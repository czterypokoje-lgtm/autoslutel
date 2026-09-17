'use server';

import { getCrmUser, OFFICE_ROLES } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function deleteJob(id: string): Promise<string | null> {
  const user = await getCrmUser();
  if (!user || !user.role || !OFFICE_ROLES.includes(user.role)) {
    return 'Alleen het kantoor kan klussen verwijderen.';
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('jobs').delete().eq('id', id);

  if (error) {
    return error.message;
  }

  revalidatePath('/admin/jobs');
  revalidatePath('/admin/monteurs/[id]', 'page');
  return null;
}
