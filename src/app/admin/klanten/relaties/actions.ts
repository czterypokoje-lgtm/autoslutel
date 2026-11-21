'use server';

import { redirect } from 'next/navigation';
import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const path = '/admin/klanten/relaties';
const phonePattern = /^\+[1-9]\d{7,14}$/;
const field = (form: FormData, key: string) => String(form.get(key) ?? '').trim();
const phoneField = (form: FormData) => field(form, 'phone').replace(/[\s()-]/g, '').replace(/^00/, '+');

function result(status: string, account?: string): never {
  redirect(path + '?' + new URLSearchParams({ status, ...(account && { account }) }));
}

export async function createAccount(form: FormData) {
  const user = await requireOfficeUser(path);
  const name = field(form, 'name');
  const kind = field(form, 'kind');
  const phone = phoneField(form);
  if (!name || name.length > 160 || (kind !== 'company' && kind !== 'person') || (phone && !phonePattern.test(phone))) result('invalid');
  const { data, error } = await createSupabaseAdminClient().from('kfc_customers')
    .insert({ company: name, account_kind: kind, phone: phone || null, created_by: user.id }).select('id').single();
  if (error) result('failed');
  result('saved', data.id);
}

export async function addContact(account: string, form: FormData) {
  await requireOfficeUser(path);
  const name = field(form, 'name');
  const position = field(form, 'position');
  const phone = phoneField(form);
  if (!name || name.length > 120 || !position || position.length > 80 || !phonePattern.test(phone)) result('invalid', account);
  const { error } = await createSupabaseAdminClient().rpc('kfc_link_customer_contact', {
    p_customer: account, p_phone: phone, p_name: name, p_position: position,
  });
  if (error) result(error.message.includes('CRM_CONTACT_REVIEW') ? 'review' : 'failed', account);
  result('saved', account);
}
