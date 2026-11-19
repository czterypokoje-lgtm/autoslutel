/*
 * Notes on a lead.
 *
 * The drawer has had a "Notities" tab since the CRM redesign that switches to
 * an empty panel: there was nowhere to put a note, because `leads` has no
 * column for one.
 *
 * A table rather than a text column on leads, because the thing being
 * recorded is a sequence, not a state. The office's own description of a
 * working day is "called him, he said he'd ring back tomorrow" then "booked
 * the appointment" — two events, two days, possibly two people. A single
 * overwritable field turns that into whichever sentence was typed last, and
 * loses the reason a lead is where it is.
 */
create table if not exists public.lead_notes (
  id uuid primary key default gen_random_uuid(),

  /* on delete cascade: a note about a deleted lead is not a record, it is an
     orphan nothing can ever join back to. */
  lead_id uuid not null references public.leads (id) on delete cascade,

  body text not null check (length(btrim(body)) between 1 and 4000),

  /*
   * Who wrote it. Nullable because a note whose author is gone is still worth
   * keeping — `on delete set null` rather than cascading the note away with
   * the account.
   */
  created_by uuid references auth.users (id) on delete set null,
  author_email text,

  created_at timestamptz not null default now()
);

/* The only lookup this table gets: one lead's notes, newest first. */
create index if not exists lead_notes_lead_idx
  on public.lead_notes (lead_id, created_at desc);

comment on table public.lead_notes is
  'Free-text notes on a lead, appended not overwritten. Office only — the same audience as the leads themselves.';

alter table public.lead_notes enable row level security;

/*
 * Office only, matching public.leads. A monteur sees the job they were given,
 * never the sales conversation that produced it.
 *
 * Insert is policied here, unlike agent_conversations: these rows are written
 * by a signed-in person through their own session, not by a webhook holding
 * the service-role key.
 */
drop policy if exists lead_notes_read on public.lead_notes;
create policy lead_notes_read on public.lead_notes
  for select
  using (public.crm_role() in ('owner', 'kantoor'));

drop policy if exists lead_notes_insert on public.lead_notes;
create policy lead_notes_insert on public.lead_notes
  for insert
  with check (public.crm_role() in ('owner', 'kantoor'));

/*
 * No update policy on purpose. A note is a record of what somebody believed
 * at a moment; correcting it is a new note, not a rewrite of the old one.
 * Deletion stays with the owner alone.
 */
drop policy if exists lead_notes_delete on public.lead_notes;
create policy lead_notes_delete on public.lead_notes
  for delete
  using (public.crm_role() = 'owner');

revoke all on public.lead_notes from authenticated;
grant select, insert, delete on public.lead_notes to authenticated;
