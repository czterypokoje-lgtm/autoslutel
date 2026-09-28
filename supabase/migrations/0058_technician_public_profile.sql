-- ============================================================================
-- What a technician looks like on the public site.
--
-- Run after 0057_job_travel_and_margin.sql. Idempotent.
--
-- The site became a network: partner technicians trade under their own names
-- and cover Den Haag, Rotterdam, Alkmaar, Utrecht, Gelderland and Limburg.
-- The 62 city pages did not know that. Every one of them rendered the same
-- name, the same photo and the same "binnen 30-60 min", Maastricht included,
-- which is about 210 km from the Bussum base.
--
-- The lookup that fixes it (src/lib/cityTechnician.ts) can already find the
-- right person: werkgebied holds postcode ranges and City.postcode now holds a
-- prefix. What it cannot do is say anything about them, because three of the
-- things a city page needs to print do not exist in this table.
-- ============================================================================

/*
 * The town a technician actually works out of, as a name.
 *
 * base_lat/base_lng (0015_routing_maps.sql) place someone precisely enough to
 * compute a drive time, and not at all for a sentence: you cannot print
 * "50.8514, 5.6910" to a customer deciding whether to trust a stranger with
 * their car. Nullable because a technician who has not been placed yet should
 * not block the row, and the page can fall back to saying nothing.
 */
alter table public.technicians add column if not exists base_city text;

/*
 * What this person is certified on — 'Autel IM608 Pro II', 'AVDI Abrites'.
 *
 * Deliberately NOT technician_tools (0013_technician_platform.sql), which
 * records which tools someone owns and whose own comment warns that ownership
 * is not the source of truth for capability. This is the claim we are willing
 * to publish under their name, which is a smaller and more careful set.
 *
 * Until now these two strings existed only as marketing prose hardcoded into
 * the city page, asserted identically about all 62 cities and about whoever
 * turned up.
 */
alter table public.technicians add column if not exists certifications text[] not null default '{}';

/*
 * The technician's own Google Business Profile.
 *
 * A profile ranks in the map pack by proximity to the searcher, so one Bussum
 * listing cannot rank in Maastricht however good the site gets. The partners
 * already hold profiles in their own regions; this column is what lets a city
 * page link to the right one and name it in sameAs, so the page and the
 * profile corroborate each other instead of being two unrelated claims.
 */
alter table public.technicians add column if not exists gbp_url text;

comment on column public.technicians.base_city is
  'Town the technician works out of, for display. base_lat/base_lng are for routing; this is for the sentence a customer reads.';
comment on column public.technicians.certifications is
  'Publishable certifications, e.g. {"Autel IM608 Pro II","AVDI Abrites"}. Not technician_tools, which is ownership rather than a published claim.';
comment on column public.technicians.gbp_url is
  'The technician''s own Google Business Profile. The map pack ranks on proximity, so a partner profile is the only listing that can rank in their region.';

-- ── What the public site is allowed to see ───────────────────────────────────
/*
 * `technicians` is granted to `authenticated` only (0004_jobs_agenda.sql:122)
 * and that is correct: the row carries iban, kvk_nummer, btw_nummer and a
 * telegram chat id. A public page must never hold the key that reads it.
 *
 * The alternative — building the city pages with the service-role client —
 * would put a credential that bypasses every RLS policy into the render path
 * of a marketing page, to print somebody's first name. This view is the
 * smaller thing: it publishes the handful of columns a city page shows, and
 * nothing else can be reached through it.
 *
 * base_lat/base_lng are ROUNDED TO TWO DECIMALS, about a kilometre. Many of
 * these technicians are zzp'ers whose base coordinate is their house. A
 * kilometre is plenty to estimate a drive time from and not enough to point
 * at a front door, and the page only ever renders the derived estimate.
 *
 * Only active technicians appear. Someone who has left should not keep
 * answering for a city.
 */
/*
 * security_invoker = false (the default, stated here so it reads as a choice).
 *
 * An invoker-rights view would run under the caller's permissions, hit the
 * technicians_read policy — `to authenticated` — and hand anon an empty set,
 * silently. Every city page would fall back to no technician and nobody would
 * see an error. Definer rights are the point: this view IS the boundary, and
 * the column list above is what makes that safe.
 */
create or replace view public.public_technicians
with (security_invoker = false) as
  select
    id,
    name,
    werkgebied,
    round(base_lat, 2) as base_lat,
    round(base_lng, 2) as base_lng,
    base_city,
    certifications,
    gbp_url,
    photo_url,
    phone
  from public.technicians
  where active = true;

comment on view public.public_technicians is
  'The only technician data the public site may read. Coordinates rounded to ~1km because a zzp base is often a home address; full precision stays in technicians, behind RLS.';

grant select on public.public_technicians to anon, authenticated;
