import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { db, uniq } from './helpers.mjs';

test('S4 job detail suggests the matching service price and assigned technician cost', async () => {
  const make = uniq('s4');
  let technicianId, jobId;
  async function write(query) {
    const { data, error } = await query;
    assert.equal(error, null, error?.message);
    return data;
  }

  try {
    technicianId = (await write(db.from('technicians').insert({ name: make }).select('id').single())).id;
    const scenario = 'bijmaken';
    const model = 'Corsa';
    await write(db.from('dispatch_pricing').insert([
      { make, model: null, scenario, price: 200 },
      { make, model, scenario, price: 125 },
    ]));
    await write(db.from('technician_coverage').insert({ technician_id: technicianId, make, model, scenario, price: 45 }));
    jobId = (await write(db.from('jobs').insert({
      technician_id: technicianId, scenario, car_make: make, car_model: model,
      scheduled_date: '2026-11-21', slot_start: '10:00', slot_end: '12:00',
    }).select('id').single())).id;

    const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
    const { data, error } = await client.auth.signInWithPassword({ email: process.env.CRM_TEST_EMAIL, password: process.env.CRM_TEST_PASSWORD });
    assert.equal(error, null, error?.message);
    const ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0];
    const cookie = ['sb-' + ref + '-auth-token=base64-', Buffer.from(JSON.stringify(data.session)).toString('base64url')].join('');
    const base = process.env.ERP_TEST_BASE_URL ?? 'http://localhost:3001';
    const detail = async () => {
      const response = await fetch(base + '/admin/jobs/' + jobId, { headers: { cookie } });
      assert.equal(response.status, 200);
      const html = await response.text();
      return html.match(/<dl[^>]*><div><dt>Tarief uit Tarieven[\s\S]*?<\/dl>/)?.[0] ?? '';
    };
    const page = await detail();
    assert.match(page, /Tarief uit Tarieven<\/dt><dd>[^<]*125,00<\/dd>/);
    assert.match(page, /Tarief toegewezen monteur<\/dt><dd>[^<]*45,00<\/dd>/);
    await write(db.from('technician_coverage').delete().eq('technician_id', technicianId));
    assert.match(await detail(), /Tarief toegewezen monteur<\/dt><dd>Geen passend tarief<\/dd>/);
  } finally {
    if (jobId) await write(db.from('jobs').delete().eq('id', jobId));
    if (technicianId) await write(db.from('technicians').delete().eq('id', technicianId));
    await write(db.from('dispatch_pricing').delete().eq('make', make));
  }
});
