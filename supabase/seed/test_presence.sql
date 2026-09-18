/*
 * TEST DATA — not a migration. Delete when you are done looking at it.
 *
 * Deliberately not in supabase/migrations/: a migration runs everywhere and
 * forever, and these rows are neither. Run this by hand, look at the
 * sidebar, then run the cleanup block at the bottom.
 *
 * It creates real technician rows so the presence counts are real counts of
 * real rows. Nothing here invents a number — chat_server_presence counts
 * what exists, and after this, this exists:
 *
 *     Nederland   10 leden,  4 online   (6 real + 4 test)
 *     Duitsland   34 leden, 14 online
 *     België      18 leden,  7 online
 *
 * WHY THESE ROWS CANNOT TAKE REAL WORK
 *
 * technicians is the same table live dispatch reads, and dispatch does not
 * filter by server — a technician on the Belgian server is still a row in
 * the list the office picks from. Three things keep these inert:
 *
 *   - no technician_coverage rows, so coversCar() returns false for every
 *     car and scenario. That is the same mechanism that silently took live
 *     dispatch to zero once before, used deliberately here.
 *   - werkgebied is empty, so suggestTechnicians() marks them as outside
 *     every postcode range.
 *   - user_id is null, so none of them can log in.
 *
 * The names start with [TEST] so nobody assigns a job to one by hand.
 */

insert into public.technicians (name, server_id, active, online, werkgebied, user_id, phone, color)
select
  format('[TEST] %s-%s', p.code, lpad(i::text, 2, '0')),
  p.server_id,
  true,            -- chat_server_presence counts active technicians only
  i <= p.online,   -- the first N of each country are the ones online
  '{}'::text[],    -- covers no postcode range
  null,            -- cannot log in
  null,
  '#3b3b3b'
from (values
  ('NL', '00000000-0000-0000-0000-000000000001'::uuid,  4,  4),
  ('DE', '00000000-0000-0000-0000-000000000002'::uuid, 34, 14),
  ('BE', '00000000-0000-0000-0000-000000000003'::uuid, 18,  7)
) as p(code, server_id, rows, online)
cross join lateral generate_series(1, p.rows) as i
where not exists (
  -- Idempotent: running this twice does not double the network.
  select 1 from public.technicians t
  where t.name = format('[TEST] %s-%s', p.code, lpad(i::text, 2, '0'))
);


-- Check what it produced.
select server_name, online_count, member_count
from public.chat_server_presence
order by server_name;


/* ────────────────────────────────────────────────────────────────────────
 * CLEANUP — run this when you are finished testing.
 *
 * Matches on the [TEST] prefix only, so it cannot touch a real monteur.
 * Coverage, subscriptions and chat messages cascade from the FK, and these
 * rows have none of the first two anyway.
 *
 *     delete from public.technicians where name like '[TEST] %';
 *
 * To check first:
 *
 *     select count(*) from public.technicians where name like '[TEST] %';
 * ──────────────────────────────────────────────────────────────────────── */
