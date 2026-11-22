'use server';

import { redirect } from 'next/navigation';
import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const path = '/admin/leads/opvolging';
const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

export async function openFollowup(form: FormData) {
  await requireOfficeUser(path);
  const lead = String(form.get('lead') ?? '');
  if (!uuid.test(lead)) redirect(path + '?result=error');
  const { error } = await createSupabaseAdminClient().rpc('crm_open_lead_followup', { p_lead: lead });
  redirect(path + '?result=' + (error?.message.includes('CRM_LEAD_NOT_WAITING') ? 'changed' : error ? 'error' : 'opened'));
}

export async function completeFollowup(form: FormData) {
  await requireOfficeUser(path);
  const task = String(form.get('task') ?? '');
  if (!uuid.test(task)) redirect(path + '?result=error');
  const { error } = await createSupabaseAdminClient().from('crm_tasks')
    .update({ completed_at: new Date().toISOString() }).eq('id', task).eq('task_type', 'lead_followup').is('completed_at', null);
  redirect(path + '?result=' + (error ? 'error' : 'completed'));
}
