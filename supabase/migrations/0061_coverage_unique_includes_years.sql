-- ============================================================================
-- A monteur cannot save a second price for the same car in different years,
-- even though that is the feature the rest of the system is built around.
--
-- Run after 0060_public_technicians_least_privilege.sql. Idempotent.
--
-- Reported from /admin/mijn-vak: "Je hebt al een prijs voor deze combinatie
-- van model, scenario en sleuteltype" on a perfectly reasonable pair —
--
--     Seat Ibiza  2002-2013  sleutel bijmaken  baard/contact  EUR 120
--     Seat Ibiza  2014-2017  sleutel bijmaken  baard/contact  EUR 250
--
-- which is not a duplicate. It is two generations of Ibiza with different key
-- systems and honestly different prices.
--
-- 0023 rebuilt the unique index as
--
--     (technician_id, make, model, scenario, keyless) nulls not distinct
--
-- to fix a real problem — whole-make rows piling up on each other — but left
-- from_year and to_year out of the key. That makes the year columns
-- unusable: any second row for the same car collides whatever its years.
--
-- Everything else assumes the opposite. capability.ts scores a narrower span
-- above a wider one specifically so an exception resolves, and its comment
-- gives the example: "Niro 2005-2016 at EUR 250, except 2012-2013 which is
-- EUR 350 is two rows, and the narrow one has to win for the years it
-- covers." The price screen has an "Uitzondering" button whose only purpose
-- is to create that second row. Both were unreachable.
--
-- Widening the key is safe in one direction: every row that satisfied the
-- narrow index also satisfies this one, so nothing existing can collide.
-- `nulls not distinct` is kept, so two rows that both leave the years open
-- still collapse onto each other rather than piling up — which is what 0023
-- was protecting.
-- ============================================================================

drop index if exists public.technician_coverage_unique_idx;

create unique index technician_coverage_unique_idx
  on public.technician_coverage (technician_id, make, model, scenario, keyless, from_year, to_year)
  nulls not distinct;

comment on index public.technician_coverage_unique_idx is
  'One price per car, per scenario, per key type, PER YEAR RANGE. The year columns are part of the key because a model with two generations has two honest prices; capability.ts resolves them by preferring the narrower span.';

notify pgrst, 'reload schema';
