/*
 * Attribution for phone-call jobs that never touch the web form.
 *
 * A phone-in customer never submits /api/leads, so their job (see
 * api/admin/jobs, "normally from a lead, sometimes by hand") can have no
 * lead_id and therefore no gclid/wbraid/gbraid/msclkid — api/export-
 * conversions' old leads!inner join could never see it, no matter how real
 * or how paid the job was.
 *
 * There is no session shared between the customer's phone and the office's
 * CRM to link the two directly. The only bridge available without buying a
 * call-tracking phone number is time: this business runs one phone line, so
 * the click that happened shortly before the office logs the call is, in
 * practice, almost always the right one. call_clicks records every tel:/
 * WhatsApp click anonymously (no name, no number — just a click id and a
 * timestamp); api/admin/jobs claims the closest unclaimed one within a
 * short window when a job is created by hand. See CALL_CLICK_WINDOW_MINUTES
 * in src/lib/adClickId.ts for the exact window and its trade-off.
 */
create table if not exists public.call_clicks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  gclid text,
  wbraid text,
  gbraid text,
  msclkid text,

  /* Which page the click happened on — useful when triaging a bad match, never required. */
  source_url text,

  /* Set once a job claims this click. A claimed click is never offered to a second job. */
  claimed_by_job_id uuid references public.jobs (id) on delete set null
);

comment on table public.call_clicks is
  'Anonymous tel:/WhatsApp click events, captured to attribute phone-only jobs back to an ad click by time proximity. No customer identity is ever stored here.';

/* The only lookup this table gets: the newest unclaimed click before a given moment. */
create index if not exists call_clicks_unclaimed_idx
  on public.call_clicks (created_at desc)
  where claimed_by_job_id is null;

alter table public.call_clicks enable row level security;

/*
 * Office only, same audience as jobs/leads. Written by the public
 * /api/track-call-conversion route using the service-role key (a visitor
 * clicking a phone number is never signed in), so no insert policy for
 * `authenticated` is needed here — only read (to find a match) and update
 * (to claim one).
 */
drop policy if exists call_clicks_read on public.call_clicks;
create policy call_clicks_read on public.call_clicks
  for select
  using (public.crm_role() in ('owner', 'kantoor'));

drop policy if exists call_clicks_claim on public.call_clicks;
create policy call_clicks_claim on public.call_clicks
  for update
  using (public.crm_role() in ('owner', 'kantoor'))
  with check (public.crm_role() in ('owner', 'kantoor'));

revoke all on public.call_clicks from authenticated;
grant select, update on public.call_clicks to authenticated;

/*
 * The click id lives on the job itself once claimed — export-conversions
 * reads it directly, the same way it already reads a lead's gclid, so a
 * hand-created job needs no lead row at all to become attributable.
 */
alter table public.jobs
  add column if not exists gclid text,
  add column if not exists wbraid text,
  add column if not exists gbraid text,
  add column if not exists msclkid text,
  add column if not exists click_captured_at timestamptz;

comment on column public.jobs.click_captured_at is
  'When the claimed call_clicks row was captured — the actual ad-click time, not when the office logged the job. Null when this job was never matched to a click (booked via the web form instead, or no click was found).';

/*
 * Positive conversions are read straight from jobs (see api/export-
 * conversions' own comment: "the money event is the source now"), but
 * nothing on jobs ever recorded that a job had already been reported —
 * only leads.exported_at existed, which a job-sourced row never touches.
 * Without this, every completed job with a value would be re-offered for
 * export on every visit to /offline-conversions, forever.
 */
alter table public.jobs
  add column if not exists exported_at timestamptz;

comment on column public.jobs.exported_at is
  'Set once this job has been reported to Google Ads as a "Job Completed" conversion, so it is never offered for export twice.';
