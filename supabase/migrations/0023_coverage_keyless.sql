-- ============================================================================
-- CRM fase 23: keyless is een vak, geen bijzaak.
--
-- Run after 0022_job_tech_history.sql. Idempotent.
--
-- Coverage said "I can do a Toyota" and dispatch believed it for both a
-- bladed key and a smart key — two different skills, two different tools,
-- and a technician who owns neither an Autel nor a smart-key blank for one of
-- them was still offered that half of the work. This adds the missing column
-- and nothing else; `null` means "both", matching how every existing row
-- behaves today, so nothing already declared silently narrows.
--
-- The unique index changes shape, not just gains a column. PostgREST's
-- upsert only matches a target list of *plain* columns — it cannot see
-- through `lower(make)` or `coalesce(model, '')` the way raw SQL can, so an
-- upsert built with those expressions in the index silently fails to find
-- the conflict and inserts a duplicate instead of merging. `nulls not
-- distinct` gets the same result the coalesce trick was reaching for —
-- "whole make" (`model = null`) rows collapse onto each other instead of
-- piling up — without needing an expression the client can't target.
-- ============================================================================

alter table public.technician_coverage add column if not exists keyless boolean;

drop index if exists public.technician_coverage_unique_idx;
create unique index if not exists technician_coverage_unique_idx
  on public.technician_coverage (technician_id, make, model, scenario, keyless)
  nulls not distinct;

notify pgrst, 'reload schema';
