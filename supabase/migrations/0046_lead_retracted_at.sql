/*
 * When a conversion was withdrawn from Google Ads.
 *
 * `exported_at` records that a lead was reported as a conversion. It cannot
 * also record that the conversion was later retracted: the two are different
 * events, and a lead that has been retracted must not be retracted again —
 * Google rejects the second attempt, and the export would keep offering the
 * same rows forever.
 *
 * Nullable with no default: almost every lead never gets retracted, and null
 * is the honest value for "this has not happened".
 */
alter table public.leads
  add column if not exists retracted_at timestamptz;

comment on column public.leads.retracted_at is
  'Set when a RETRACT adjustment for this lead was accepted by Google Ads. Only a lead with exported_at set can be retracted — a conversion Google never received cannot be withdrawn.';

create index if not exists leads_retractable_idx
  on public.leads (status)
  where exported_at is not null and retracted_at is null;
