import 'server-only';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { fetchAll } from '@/lib/kfcOrders';

export type JobAccountOption = {
  id: string; company: string; phone: string | null; account_kind: 'person' | 'company';
  contacts: { id: string; name: string; phone: string; position: string }[];
};
export type JobBillingRecipient = {
  id: string; company: string; phone: string | null; email: string | null; street: string | null;
  postcode: string | null; city: string | null; vat_number: string | null;
};
type Membership = { customer_id: string; contact_id: string; position: string; contacts: { display_name: string; phone_e164: string } };

export async function jobAccountOptions() {
  const db = createSupabaseAdminClient();
  const [accounts, contacts] = await Promise.all([
    fetchAll<Omit<JobAccountOption, 'contacts'>>((a, b) => db.from('kfc_customers').select('id, company, phone, account_kind')
      .not('account_kind', 'is', null).is('merged_into', null).is('anonymised_at', null).order('company').order('id').range(a, b)),
    fetchAll<Membership>((a, b) => db.from('kfc_customer_contacts').select('customer_id, contact_id, position, contacts!inner(display_name, phone_e164)')
      .eq('contacts.active', true).order('customer_id').order('contact_id').range(a, b) as unknown as PromiseLike<{ data: Membership[] | null; error: { message: string } | null }>),
  ]);
  const grouped = new Map<string, JobAccountOption['contacts']>();
  for (const row of contacts) {
    const list = grouped.get(row.customer_id) ?? [];
    list.push({ id: row.contact_id, name: row.contacts.display_name, phone: row.contacts.phone_e164, position: row.position });
    grouped.set(row.customer_id, list);
  }
  return accounts.map((account) => ({ ...account, contacts: grouped.get(account.id) ?? [] }));
}
