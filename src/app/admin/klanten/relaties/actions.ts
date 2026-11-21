'use server';

import { redirect } from 'next/navigation';
import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { ACCOUNT_PROBLEMS, customerFromForm, type AccountProblem } from '@/lib/accountValidation';
import { cleanCustomer } from '@/lib/kfcReceivables';

const path = '/admin/klanten/relaties';
const phonePattern = /^\+[1-9]\d{7,14}$/;
const field = (form: FormData, key: string) => String(form.get(key) ?? '').trim();
const phoneField = (form: FormData) => field(form, 'phone').replace(/[\s()-]/g, '').replace(/^00/, '+');

function result(status: string, account?: string): never {
  redirect(path + '?' + new URLSearchParams({ status, ...(account && { account }) }));
}

/** Map a validation message back to its key, so the redirect carries a fixed code, never free text. */
function problemCode(error: unknown): string {
  const message = error instanceof Error ? error.message : '';
  return (Object.keys(ACCOUNT_PROBLEMS) as AccountProblem[]).find((key) => ACCOUNT_PROBLEMS[key] === message) ?? 'failed';
}

/** Validated row for kfc_customers, or a redirect with the problem (same rules as the cari dialog). */
function accountRow(form: FormData, account?: string) {
  const input = customerFromForm(form);
  const phone = input.phone.replace(/[\s()-]/g, '').replace(/^00/, '+');
  if (phone && !phonePattern.test(phone)) result('phone', account);
  if (input.account_kind !== 'company' && input.account_kind !== 'person') result('kind', account);
  try {
    return cleanCustomer({ ...input, phone });
  } catch (error) {
    result(problemCode(error), account);
  }
}

export async function createAccount(form: FormData) {
  const user = await requireOfficeUser(path);
  const row = accountRow(form);
  const { data, error } = await createSupabaseAdminClient().from('kfc_customers')
    .insert({ ...row, created_by: user.id }).select('id').single();
  if (error) result('failed');
  result('saved', data.id);
}

export async function updateAccount(account: string, form: FormData) {
  await requireOfficeUser(path);
  if (!/^[a-f0-9-]{36}$/i.test(account)) result('failed');
  const row = accountRow(form, account);
  const { error } = await createSupabaseAdminClient().from('kfc_customers')
    .update({ ...row, updated_at: new Date().toISOString() }).eq('id', account).is('merged_into', null).is('anonymised_at', null);
  if (error) result('failed', account);
  result('saved', account);
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
