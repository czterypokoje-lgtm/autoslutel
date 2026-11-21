// Regression: technicians could never see their offers (/admin/aanbod), because the
// screen joined jobs they are not allowed to read. Migration 0109 adds
// crm_my_open_offers(). This checks, signed in as the demo technician, that open
// offers come back, that they carry no customer data, and that direct job reads
// stay closed. Read-only: it writes nothing.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { db } from './helpers.mjs';

test('technician sees own open offers without customer details', async () => {
  const email = process.env.CRM_TECH_EMAIL;
  const password = process.env.CRM_TECH_PASSWORD;
  assert.ok(email && password, 'CRM_TECH_EMAIL / CRM_TECH_PASSWORD missing in .env.local');

  const tech = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { error: loginError } = await tech.auth.signInWithPassword({ email, password });
  assert.equal(loginError, null, loginError?.message);

  // What the database says this technician should see right now.
  const { data: me } = await db.from('technicians').select('id').eq('user_id', (await tech.auth.getUser()).data.user.id).single();
  const nowIso = new Date().toISOString();
  const { data: expected } = await db.from('job_offers').select('id, jobs!inner(technician_id)')
    .eq('technician_id', me.id).is('response', null).lte('offered_at', nowIso).gt('expires_at', nowIso).is('jobs.technician_id', null);

  const { data, error } = await tech.rpc('crm_my_open_offers');
  assert.equal(error, null, error?.message);
  assert.equal(data.length, expected.length, 'every open offer on an unassigned job is returned');
  assert.ok(data.length > 0, 'demo data should give this technician at least one open offer');

  for (const row of data) {
    for (const field of ['customer_name', 'customer_phone', 'street', 'quoted_price']) {
      assert.ok(!(field in row.jobs), `offer must not expose ${field}`);
    }
  }

  const { data: direct } = await tech.from('jobs').select('id').is('technician_id', null).limit(1);
  assert.deepEqual(direct, [], 'unassigned jobs stay unreadable directly');
});
