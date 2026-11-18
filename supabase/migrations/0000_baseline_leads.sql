-- ============================================================================
-- Baseline: the `leads` table as it existed before migrations were kept.
--
-- 0001 alters `leads` but nothing ever created it: the live table was made by
-- hand in the dashboard. A fresh project (a customer install, a test database)
-- therefore failed at the very first migration. This recreates the original
-- shape — the columns /api/leads still writes as its "legacy row" — so the
-- numbered migrations can run on an empty database.
--
-- Harmless on the live database: `if not exists` makes it a no-op there.
-- ============================================================================

create extension if not exists pgcrypto;

create table if not exists public.leads (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  brand      text,
  model      text,
  year       text,
  service    text,
  location   text,
  photo_url  text,
  gclid      text,
  wbraid     text,
  gbraid     text
);
