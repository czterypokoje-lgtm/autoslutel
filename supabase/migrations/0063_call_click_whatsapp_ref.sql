/*
 * A short code in the WhatsApp message, so a chat can be tied to its ad click.
 *
 * call_clicks already records the click id of every tel:/WhatsApp tap, but
 * nothing links that row to the chat that follows — the office was left
 * guessing by time, and across days that guess is a coin toss (see
 * api/admin/jobs/[id]/call-clicks). When the visitor arrived from an ad,
 * PhoneConversionTracker now writes a four-character code into the
 * pre-filled WhatsApp text ("[K7F2] Hallo, ...") and stores the same code
 * here. The office types the code from the chat into the job, and the job
 * claims exactly that click — no guessing.
 *
 * Run after 0062_technician_business_profile_and_privacy.sql. Idempotent.
 */
alter table public.call_clicks
  add column if not exists ref text;

comment on column public.call_clicks.ref is
  'Four-character code written into the pre-filled WhatsApp message for this click (e.g. K7F2). Null for tel: taps and for visitors without an ad click id.';

/* One code, one click: a duplicate insert fails instead of making a code ambiguous. */
create unique index if not exists call_clicks_ref_key
  on public.call_clicks (ref)
  where ref is not null;
