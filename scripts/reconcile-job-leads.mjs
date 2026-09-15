import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Reconciles completed jobs that have no lead_id (phone-agent bookings,
// WhatsApp-sourced jobs) against existing `leads` rows that DO carry a
// gclid/wbraid/gbraid, by matching on phone number. This lets the existing
// /api/export-conversions pipeline pick these jobs up as real Google Ads
// offline conversions — right now it only reads `leads`, so a completed job
// with no lead_id is invisible to it no matter how real the sale was.
//
// Dry-run by default: prints every match it would make and does not touch
// the database. Pass --apply to actually write the links.
//
// Matching rule, deliberately conservative:
//   - job.customer_phone normalized to +31... must equal lead.phone_e164
//   - the lead must carry a gclid/wbraid/gbraid (no click id = nothing to
//     report to Ads, so nothing to link)
//   - the lead must not already be exported (exported_at is null)
//   - the lead must have been created before the job's scheduled_date
//     (a lead can't be a match for a job that happened before it existed)
//   - exactly ONE candidate lead — if a phone number matches more than one
//     un-exported gclid lead, it's ambiguous and is skipped for manual
//     review rather than guessed at.

const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim();
const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const APPLY = process.argv.includes('--apply');
const APPLY_LEADS = process.argv.includes('--apply-leads');

function normalizePhone(raw) {
  if (!raw) return null;
  let p = raw.replace(/[\s\-()]/g, '');
  if (p.startsWith('0')) p = '+31' + p.slice(1);
  if (p.startsWith('31') && !p.startsWith('+')) p = '+' + p;
  if (!p.startsWith('+')) return null;
  return p;
}

async function run() {
  const { data: jobs, error: jobsErr } = await supabase
    .from('jobs')
    .select('id, lead_id, customer_phone, status, scheduled_date, final_price, quoted_price, created_at, tech_note')
    .is('lead_id', null)
    .not('customer_phone', 'is', null);
  if (jobsErr) { console.error('jobs error:', jobsErr.message); return; }

  const { data: leads, error: leadsErr } = await supabase
    .from('leads')
    .select('id, phone_e164, phone, created_at, status, gclid, wbraid, gbraid, exported_at, sale_price')
    .is('exported_at', null)
    .or('gclid.not.is.null,wbraid.not.is.null,gbraid.not.is.null');
  if (leadsErr) { console.error('leads error:', leadsErr.message); return; }

  console.log(`${jobs.length} lead-less jobs with a phone number, ${leads.length} un-exported gclid-bearing leads.\n`);

  const byPhone = new Map();
  for (const l of leads) {
    const p = normalizePhone(l.phone_e164 || l.phone);
    if (!p) continue;
    if (!byPhone.has(p)) byPhone.set(p, []);
    byPhone.get(p).push(l);
  }

  const links = [];
  const ambiguous = [];
  const unmatched = [];

  for (const j of jobs) {
    const jp = normalizePhone(j.customer_phone);
    if (!jp) { unmatched.push(j); continue; }
    const candidates = (byPhone.get(jp) || []).filter(
      (l) => new Date(l.created_at) <= new Date(j.scheduled_date || j.created_at)
    );
    if (candidates.length === 1) links.push({ job: j, lead: candidates[0] });
    else if (candidates.length > 1) ambiguous.push({ job: j, candidates });
    else unmatched.push(j);
  }

  console.log(`Confident matches: ${links.length}`);
  for (const { job, lead } of links) {
    const value = job.final_price ?? job.quoted_price ?? lead.sale_price ?? null;
    console.log(
      `  job ${job.id} (${job.status}, ${job.scheduled_date}, €${value ?? '?'}) -> lead ${lead.id} (gclid=${!!lead.gclid}, wbraid=${!!lead.wbraid}, gbraid=${!!lead.gbraid}, created ${lead.created_at})`
    );
  }

  console.log(`\nAmbiguous (skipped, needs manual review): ${ambiguous.length}`);
  for (const { job, candidates } of ambiguous) {
    console.log(`  job ${job.id} (${job.customer_phone}) matches ${candidates.length} leads: ${candidates.map((c) => c.id).join(', ')}`);
  }

  console.log(`\nUnmatched (no gclid-bearing lead exists for this phone at all — real conversion, but nothing to report to Ads): ${unmatched.length}`);
  const unmatchedWithPhone = unmatched.filter((j) => normalizePhone(j.customer_phone));
  for (const j of unmatchedWithPhone) {
    const value = j.final_price ?? j.quoted_price ?? null;
    console.log(`  job ${j.id} (${j.status}, ${j.scheduled_date}, ${normalizePhone(j.customer_phone)}, €${value ?? '?'}) — would create a new leads row, source='phone', status='sold', no gclid`);
  }

  if (!APPLY && !APPLY_LEADS) {
    console.log('\nDry run only — nothing written. Re-run with --apply to link the confident gclid matches, or --apply-leads to backfill CRM-only lead rows for the unmatched jobs above (never exportable to Ads — no click id exists for them).');
    return;
  }

  if (APPLY) {
    console.log('\nApplying confident gclid matches...');
    for (const { job, lead } of links) {
      const value = job.final_price ?? job.quoted_price ?? null;
      const { error: jobErr } = await supabase.from('jobs').update({ lead_id: lead.id }).eq('id', job.id);
      if (jobErr) { console.error(`  job ${job.id} update failed:`, jobErr.message); continue; }

      // Only overwrite the lead's status/price if it's still sitting at a
      // pre-decision status — never clobber a status the office already set.
      if (['new', 'contacted'].includes(lead.status)) {
        const isPositive = job.status === 'afgerond';
        const { error: leadErr } = await supabase
          .from('leads')
          .update({
            status: isPositive ? 'sold' : lead.status,
            sale_price: isPositive ? value : lead.sale_price,
          })
          .eq('id', lead.id);
        if (leadErr) console.error(`  lead ${lead.id} update failed:`, leadErr.message);
      }
      console.log(`  linked job ${job.id} -> lead ${lead.id}`);
    }
  }

  if (APPLY_LEADS) {
    console.log('\nBackfilling CRM-only lead rows for unmatched jobs (source=phone, no gclid)...');
    for (const j of unmatchedWithPhone) {
      const phoneE164 = normalizePhone(j.customer_phone);
      const value = j.final_price ?? j.quoted_price ?? null;
      const createdAt = j.scheduled_date ? new Date(`${j.scheduled_date}T12:00:00Z`).toISOString() : j.created_at;

      const { data: newLead, error: leadErr } = await supabase
        .from('leads')
        .insert({
          phone: j.customer_phone,
          phone_e164: phoneE164,
          source: 'phone',
          status: j.status === 'afgerond' ? 'sold' : 'rejected',
          sale_price: j.status === 'afgerond' ? value : null,
          created_at: createdAt,
        })
        .select('id')
        .single();

      if (leadErr) {
        // Unique index on (phone_e164, created_date) — same phone, same day
        // as an existing lead. Skip rather than guess; flag for manual look.
        console.error(`  job ${j.id} (${phoneE164}, ${j.scheduled_date}) skipped — ${leadErr.message}`);
        continue;
      }

      const { error: jobErr } = await supabase.from('jobs').update({ lead_id: newLead.id }).eq('id', j.id);
      if (jobErr) console.error(`  job ${j.id} lead_id backfill failed:`, jobErr.message);
      console.log(`  created lead ${newLead.id} for job ${j.id} (${phoneE164}, €${value ?? '?'})`);
    }
  }

  console.log('Done.');
}

run();
