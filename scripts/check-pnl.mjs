/**
 * The check behind the job-costing chain: `node --env-file=.env.local scripts/check-pnl.mjs`
 *
 * Read-only, service-role, four assertions. Each one fails loudly for a
 * different broken link:
 *
 *   1. cost_materials drifted from the lines it is supposed to sum
 *      → rollup_job_material_costs (0051) is not firing.
 *   2. travel_km and cost_travel disagree about whether they exist
 *      → something wrote a fuel figure without measuring, or vice versa.
 *   3. A stock count went negative
 *      → a deduction path skipped greatest(..., 0).
 *   4. stock_moves does not add up to stock_items.quantity
 *      → the deduction trigger is broken. This is the one that would have
 *        caught patch_vandaag_pim.js the week it landed, instead of 76 jobs
 *        later.
 *
 * Exits non-zero on the first failure, and prints what it checked either way —
 * "0 rows checked, all passed" is not a pass.
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.storage_SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing Supabase credentials. Run with: node --env-file=.env.local scripts/check-pnl.mjs');
  process.exit(2);
}

const db = createClient(url, key, { auth: { persistSession: false } });

const CENT = 0.01;
const failures = [];
const notes = [];

function check(name, ok, detail) {
  if (ok) {
    notes.push(`  ok    ${name}`);
  } else {
    failures.push(`  FAIL  ${name}\n        ${detail}`);
  }
}

const num = (v) => Number(v ?? 0);

// ── 1. cost_materials equals the sum of its lines ────────────────────────────
const { data: materials, error: mErr } = await db
  .from('job_materials')
  .select('job_id, quantity, unit_cost');
if (mErr) throw new Error(`job_materials: ${mErr.message}`);

const summed = new Map();
for (const line of materials ?? []) {
  summed.set(line.job_id, num(summed.get(line.job_id)) + num(line.quantity) * num(line.unit_cost));
}

/*
 * travel_km arrives with 0057. Migrations here are applied by hand in the
 * Supabase editor, so this script has to be runnable on both sides of that —
 * it drops the fuel check rather than refusing to check anything.
 */
let hasTravelKm = true;
let { data: jobs, error: jErr } = await db
  .from('jobs')
  .select('id, status, cost_materials, cost_travel, travel_km');
if (jErr && /travel_km/.test(jErr.message)) {
  hasTravelKm = false;
  ({ data: jobs, error: jErr } = await db
    .from('jobs')
    .select('id, status, cost_materials, cost_travel'));
}
if (jErr) throw new Error(`jobs: ${jErr.message}`);

const drifted = (jobs ?? []).filter((j) => {
  const expected = summed.get(j.id);
  if (expected === undefined) return false;
  return Math.abs(num(j.cost_materials) - expected) > CENT;
});
check(
  `cost_materials matches its lines (${summed.size} job(s) with materials)`,
  drifted.length === 0,
  drifted.map((j) => `job ${j.id}: stored ${num(j.cost_materials)}, lines sum to ${summed.get(j.id)?.toFixed(2)}`).join('\n        ')
);

// ── 2. travel_km and cost_travel are both known or both absent ───────────────
const halfTravel = !hasTravelKm ? [] : (jobs ?? []).filter((j) => {
  const hasKm = j.travel_km !== null;
  const hasEuro = j.cost_travel !== null && num(j.cost_travel) !== 0;
  // A hand-typed euro figure with no km is legitimate — the office looked it
  // up. A km with no euro is not: only fillTravelCost writes km, and it writes
  // both in one statement.
  return hasKm && !hasEuro;
});
check(
  hasTravelKm
    ? `travel_km never without a cost (${(jobs ?? []).filter((j) => j.travel_km !== null).length} measured)`
    : 'travel_km — SKIPPED, run supabase/migrations/0057_job_travel_and_margin.sql',
  halfTravel.length === 0,
  halfTravel.map((j) => `job ${j.id}: ${j.travel_km} km but cost_travel = ${j.cost_travel}`).join('\n        ')
);

// ── 3 & 4. Stock balances, and the ledger that should explain them ───────────
const { data: stock, error: sErr } = await db
  .from('stock_items')
  .select('id, description, quantity');
if (sErr) throw new Error(`stock_items: ${sErr.message}`);

const negative = (stock ?? []).filter((s) => num(s.quantity) < 0);
check(
  `no negative stock (${(stock ?? []).length} article(s))`,
  negative.length === 0,
  negative.map((s) => `${s.description}: ${s.quantity}`).join('\n        ')
);

const { data: moves, error: moveErr } = await db
  .from('stock_moves')
  .select('stock_item_id, delta');
if (moveErr) throw new Error(`stock_moves: ${moveErr.message}`);

const ledger = new Map();
for (const move of moves ?? []) {
  if (!move.stock_item_id) continue;
  ledger.set(move.stock_item_id, num(ledger.get(move.stock_item_id)) + num(move.delta));
}

/*
 * Only articles the log has actually seen. A row created before 0039 has no
 * opening entry, so its ledger would "disagree" for a reason that is history,
 * not a bug.
 */
const tracked = (stock ?? []).filter((s) => ledger.has(s.id));
const unreconciled = tracked.filter((s) => Math.abs(num(s.quantity) - num(ledger.get(s.id))) > CENT);
check(
  `stock_moves reconciles with quantity (${tracked.length} of ${(stock ?? []).length} article(s) logged)`,
  unreconciled.length === 0,
  unreconciled
    .map((s) => `${s.description}: quantity ${s.quantity}, moves sum to ${ledger.get(s.id)}`)
    .join('\n        ')
);

// ── Report ───────────────────────────────────────────────────────────────────
const completed = (jobs ?? []).filter((j) => j.status === 'afgerond');
console.log(`checked ${(jobs ?? []).length} job(s), ${completed.length} afgerond, ${(materials ?? []).length} material line(s), ${(stock ?? []).length} stock row(s)\n`);
for (const line of notes) console.log(line);
for (const line of failures) console.error(line);

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed.`);
  process.exit(1);
}
console.log('\nall checks passed');
