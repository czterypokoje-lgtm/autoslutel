import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { db, uniq } from './helpers.mjs';

test('P4 opens one follow-up from a new lead and lets the office complete it', async () => {
  const name = uniq('p4-followup');
  let lead;
  async function read(request) {
    const { data, error } = await request;
    assert.equal(error, null, error?.message);
    return data;
  }

  try {
    lead = await read(db.from('leads').insert({ name, status: 'new', phone: '+12025550123' }).select('id').single());
    const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
    const { session } = await read(client.auth.signInWithPassword({ email: process.env.CRM_TEST_EMAIL, password: process.env.CRM_TEST_PASSWORD }));
    const ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0];
    const cookie = 'sb-' + ref + '-auth-token=base64-' + Buffer.from(JSON.stringify(session)).toString('base64url');
    const url = (process.env.ERP_TEST_BASE_URL ?? 'http://localhost:3001') + '/admin/leads/opvolging';
    const page = async () => {
      const response = await fetch(url, { headers: { cookie } });
      assert.equal(response.status, 200);
      return response.text();
    };
    const submission = (html, field, value) => {
      const form = [...html.matchAll(/<form\b[^>]*>[\s\S]*?<\/form>/g)]
        .find(([body]) => body.includes('name="' + field + '"') && body.includes('value="' + value + '"'));
      assert.ok(form, 'action form for ' + field);
      const action = form[0].match(/name="(\$ACTION_ID_[^"]+)"/);
      assert.ok(action, 'server action field');
      const body = new FormData();
      body.set(action[1], '');
      body.set(field, value);
      return () => fetch(url, { method: 'POST', headers: { cookie }, body, redirect: 'manual' });
    };
    const open = submission(await page(), 'lead', lead.id);
    for (const response of await Promise.all([open(), open()])) {
      assert.equal(response.status, 303);
      assert.match(response.headers.get('location') ?? '', /result=opened/);
    }
    const task = await read(db.from('crm_tasks').select('id,completed_at').eq('lead_id', lead.id).single());
    assert.equal(task.completed_at, null);
    const complete = submission(await page(), 'task', task.id);
    const completed = await complete();
    assert.equal(completed.status, 303);
    assert.match(completed.headers.get('location') ?? '', /result=completed/);
    assert.ok((await read(db.from('crm_tasks').select('completed_at').eq('id', task.id).single())).completed_at);
    await read(db.from('leads').update({ status: 'contacted' }).eq('id', lead.id));
    const stale = await open();
    assert.match(stale.headers.get('location') ?? '', /result=changed/);
    assert.ok(!(await page()).includes(name));
  } finally {
    if (lead) await read(db.from('leads').delete().eq('id', lead.id));
  }
});
