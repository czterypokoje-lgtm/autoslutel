-- ============================================================================
-- CRM fase 60: een naam bij een campagnenummer.
--
-- Run after 0064_ad_campaign_and_keyword.sql. Idempotent.
--
-- Google hands over `24286719575`, never "Sleutel bijmaken - NL". The number
-- is what rides along on the landing URL and the only thing this system can
-- know on its own; the name lives in the Ads account and no route here talks
-- to that API — the Google Ads client was deliberately never built (see
-- /admin/instellingen, which says so plainly rather than showing a figure it
-- cannot stand behind).
--
-- So the office types a name once and every screen reads it after that. Seven
-- campaigns have sent calls so far; seven lines of typing beats recognising
-- eleven-digit numbers on a screen somebody looks at every day.
--
-- Nothing depends on a row existing. An unnamed campaign keeps showing its
-- number, which is exactly what it does today.
-- ============================================================================

create table if not exists public.ad_campaigns (
  /* Google's own id, as it arrives on the URL. Text, not bigint: it is an
     identifier that happens to be digits, and nothing ever does arithmetic
     on it. */
  campaign_id text primary key,
  name        text not null,
  /** 'google' | 'microsoft' — kept so a Bing campaign id can never collide. */
  network     text not null default 'google',
  note        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger ad_campaigns_updated_at
  before update on public.ad_campaigns
  for each row execute function public.touch_updated_at();

alter table public.ad_campaigns enable row level security;

grant select, insert, update, delete on public.ad_campaigns to authenticated;

/*
 * Office only, read and write. A monteur has no screen that shows campaigns
 * and no reason to rename one.
 */
drop policy if exists ad_campaigns_office on public.ad_campaigns;
create policy ad_campaigns_office on public.ad_campaigns
  for all
  using (public.crm_role() in ('owner', 'kantoor'))
  with check (public.crm_role() in ('owner', 'kantoor'));

notify pgrst, 'reload schema';
