import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { db, uniq } from './helpers.mjs';

test('P4 shares a contact by exact phone while keeping the individual account and company role separate', async () => {
  const tag = uniq('p4-contact');
  const phone = '+31970' + String(Date.now()).slice(-8);
  const ids = [];
  let jobId;
  async function read(request) {
    const { data, error } = await request;
    assert.equal(error, null, error?.message);
    return data;
  }
  try {
    const company = await read(db.from('kfc_customers').insert({ company: tag + '-company', account_kind: 'company' }).select('id').single());
    ids.push(company.id);
    const person = await read(db.from('kfc_customers').insert({ company: tag + '-person', account_kind: 'person', phone }).select('id').single());
    ids.push(person.id);
    const link = { p_customer: company.id, p_phone: phone, p_name: tag + '-person', p_position: 'Planning' };
    await read(db.rpc('kfc_link_customer_contact', link));
    await read(db.rpc('kfc_link_customer_contact', link));
    const mismatch = await db.rpc('kfc_link_customer_contact', { ...link, p_name: 'Another person' });
    assert.match(mismatch.error?.message ?? '', /CRM_CONTACT_REVIEW/);
    const individual = await db.rpc('kfc_link_customer_contact', { ...link, p_customer: person.id });
    assert.match(individual.error?.message ?? '', /CRM_COMPANY_REQUIRED/);
    const memberships = await read(db.from('kfc_customer_contacts').select('position').eq('customer_id', company.id));
    assert.deepEqual(memberships, [{ position: 'Planning' }]);
    const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
    const { session } = await read(anon.auth.signInWithPassword({ email: process.env.CRM_TEST_EMAIL, password: process.env.CRM_TEST_PASSWORD }));
    const ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0];
    const cookie = 'sb-' + ref + '-auth-token=base64-' + Buffer.from(JSON.stringify(session)).toString('base64url');
    const base = process.env.ERP_TEST_BASE_URL ?? 'http://localhost:3001';
    const url = base + '/admin/klanten/relaties?' + new URLSearchParams({ q: phone, account: company.id });
    const response = await fetch(url, { headers: { cookie } });
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.ok(html.includes(tag + '-company') && html.includes(tag + '-person') && html.includes(phone));
    assert.ok(html.includes(tag + '-person<!-- --> · <!-- -->Planning') || html.includes('Functie bij bedrijf'));

    const { id: contactId } = await read(db.from('contacts').select('id').eq('phone_e164', phone).single());
    const createJob = (contact) => fetch(base + '/api/admin/jobs', {
      method: 'POST', headers: { cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ billing_account_id: company.id, communication_contact_id: contact,
        scheduled_date: '2026-11-21', slot_start: '10:00', slot_end: '12:00' }),
    });
    assert.equal((await createJob(randomUUID())).status, 400);
    const created = await createJob(contactId);
    assert.equal(created.status, 201, await created.clone().text());
    ({ job: { id: jobId } } = await created.json());
    assert.ok(jobId);
    const linked = await read(db.from('jobs').select('billing_account_id,communication_contact_id,customer_name,customer_phone').eq('id', jobId).single());
    assert.deepEqual(linked, { billing_account_id: company.id, communication_contact_id: contactId, customer_name: tag + '-person', customer_phone: phone });
    const form = await fetch(base + '/admin/jobs/nieuw', { headers: { cookie } });
    assert.equal(form.status, 200);
    assert.ok((await form.text()).includes('Aan wie factureren we?'));
    const invoice = await fetch(base + '/admin/facturen/nieuw?klus=' + jobId, { headers: { cookie } });
    assert.equal(invoice.status, 200);
    assert.ok((await invoice.text()).includes(tag + '-company'), 'the company is the invoice recipient');
    await read(db.from('kfc_customers').delete().eq('id', company.id));
    const afterDelete = await read(db.from('jobs').select('billing_account_id,communication_contact_id').eq('id', jobId).single());
    assert.deepEqual(afterDelete, { billing_account_id: null, communication_contact_id: null });


  } finally {
    if (jobId) await read(db.from('jobs').delete().eq('id', jobId));
    if (ids.length) await read(db.from('kfc_customers').delete().in('id', ids));
    await read(db.from('contacts').delete().eq('phone_e164', phone).eq('display_name', tag + '-person'));
  }
});
