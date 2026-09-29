-- ============================================================================
-- Tighten public_technicians. Two things it should not have been publishing.
--
-- Run after 0059_gross_margin_reads_commission.sql. Idempotent.
--
-- Verified against the live database with the anon key: the view answers a
-- stranger with all 66 technician rows. Every other table correctly returns
-- nothing — RLS is doing its job everywhere else — so this view is the whole
-- public surface, and it was wider than it needed to be.
--
-- 1. PHONE. The city page never renders it. The call-to-action deliberately
--    uses the central number so leads route through the CRM and stay
--    attributable; a technician's own line would bypass both. So the column
--    bought nothing and published the personal mobile of every zzp'er on the
--    roster. Under the AVG that is personal data with no purpose attached,
--    which is the definition of one we should not be processing.
--
-- 2. ROWS WITH NOTHING IN THEM. `active = true` was the only filter, and all
--    66 rows are active — including 56 named "[TEST] ...", 34 of those German
--    DE-* accounts. They are readable right now by anyone with the anon key,
--    which ships in the browser bundle of every page.
--
--    Deleting them is the real fix and is the owner's call. Until then the
--    view publishes only technicians who are actually set up to serve
--    somewhere: a declared werkgebied, or a base to measure from. That is the
--    same test src/lib/cityTechnician.ts applies before naming anyone on a
--    page, so the two agree instead of the database being more generous than
--    the code that reads it.
-- ============================================================================

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
    photo_url
  from public.technicians
  where active = true
    and (
      coalesce(array_length(werkgebied, 1), 0) > 0
      or (base_lat is not null and base_lng is not null)
    );

comment on view public.public_technicians is
  'The only technician data the public site may read. No phone: the site calls the central number so leads stay attributable. Only technicians with a werkgebied or a base appear — the same publishable test cityTechnician.ts applies, so a half-set-up or test row cannot reach a public page. Coordinates rounded to ~1km because a zzp base is often a home address.';

grant select on public.public_technicians to anon, authenticated;
