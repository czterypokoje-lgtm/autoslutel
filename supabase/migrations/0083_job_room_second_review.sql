-- ============================================================================
-- CRM: job room, second review fixes. NOT APPLIED: owner reviews first.
-- Run after 0078 to 0082, in that order. Idempotent.
--
-- 1. Roles: a contact's role cannot change once set, and the roles 'owner' and
--    'staff' (which unlock the internal audience) can only be created in SQL,
--    in a session that sets   select set_config('app.allow_staff_roles','on',true);
-- 2. Outbox state machine in the database: states only move forward
--    (proposed -> approved|cancelled|failed, approved -> claimed|cancelled|failed,
--    claimed -> sent|unknown|failed, unknown -> sent|failed); a row can become
--    'approved' only if an approved job_approvals row with the same text hash
--    exists; rows are inserted as 'proposed' only.
-- 3. TRUNCATE is refused on the three append-only tables, and anon,
--    authenticated and public lose every privilege on the job room tables
--    except the owner-readable SELECT (Supabase grants new tables to anon and
--    authenticated by default; RLS does not cover TRUNCATE).
-- 4. Every function and trigger function pins   search_path = public, pg_temp.
-- 5. Erasure: job_redact_contact_messages(contact, reason) blanks the stored
--    message bodies of one contact (events: body and meta; finished outbox
--    rows: body), keeps hashes, ids and times, and writes its own event
--    'privacy.redacted' with counts only. For the service role / SQL editor.
--    Cancel or let expire a contact's waiting messages first: only finished
--    outbox rows (sent, cancelled, failed) are redacted. Give a reason CODE
--    (for example 'avg-verzoek 2026-11'), never personal data.
-- ============================================================================

alter table public.job_events add column if not exists redacted_at timestamptz;
alter table public.job_outbox add column if not exists redacted_at timestamptz;

-- 1. contact roles ------------------------------------------------------------
create or replace function public.job_contact_role_guard()
returns trigger language plpgsql set search_path = public, pg_temp as $$
declare allowed boolean := coalesce(current_setting('app.allow_staff_roles', true), '') = 'on';
begin
  if tg_op = 'INSERT' then
    if new.role in ('owner', 'staff') and not allowed then
      raise exception 'contacts: owner and staff are created in SQL only (set app.allow_staff_roles)';
    end if;
  elsif new.role is distinct from old.role and not allowed then
    raise exception 'contacts: a role cannot change once set';
  end if;
  return new;
end $$;

drop trigger if exists contacts_role_guard_trg on public.contacts;
create trigger contacts_role_guard_trg
  before insert or update on public.contacts
  for each row execute function public.job_contact_role_guard();

-- 2. outbox: immutable, forward-only, approved only with an approval ----------
create or replace function public.job_outbox_immutable()
returns trigger language plpgsql set search_path = public, pg_temp as $$
declare
  progress text[] := array['state','updated_at','approved_by','approved_at','claimed_by',
                           'lease_until','attempts','provider_message_id','last_error','sent_at'];
  redacting boolean := coalesce(current_setting('app.job_redaction', true), '') = 'on';
begin
  if tg_op = 'DELETE' then
    raise exception 'job_outbox rows are never deleted';
  end if;
  if tg_op = 'INSERT' then
    if new.shadow is distinct from true then
      raise exception 'job_outbox: only shadow rows may be inserted before go-live';
    end if;
    if new.state <> 'proposed' then
      raise exception 'job_outbox: rows are inserted as proposed';
    end if;
    return new;
  end if;

  if redacting then
    if old.state not in ('sent', 'cancelled', 'failed')
       or (to_jsonb(new) - array['body','redacted_at','updated_at']) is distinct from (to_jsonb(old) - array['body','redacted_at','updated_at']) then
      raise exception 'job_outbox: redaction may only blank the body of a finished row';
    end if;
    return new;
  end if;

  if (to_jsonb(new) - progress) is distinct from (to_jsonb(old) - progress) then
    raise exception 'job_outbox: only progress columns may change after insert (shadow included)';
  end if;

  if new.state is distinct from old.state then
    if not ((old.state, new.state) in (
         ('proposed','approved'), ('proposed','cancelled'), ('proposed','failed'),
         ('approved','claimed'),  ('approved','cancelled'), ('approved','failed'),
         ('claimed','sent'),      ('claimed','unknown'),    ('claimed','failed'),
         ('unknown','sent'),      ('unknown','failed'))) then
      raise exception 'job_outbox: illegal transition % -> %', old.state, new.state;
    end if;
    if new.state = 'approved' and not exists (
         select 1 from public.job_approvals a
          where a.outbox_id = new.id and a.decision = 'approved' and a.text_hash = new.text_hash) then
      raise exception 'job_outbox: approved needs a matching approved job_approvals row';
    end if;
  end if;
  return new;
end $$;

-- 3. events stay append-only, except the redaction function -------------------
create or replace function public.job_events_guard()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if tg_op = 'UPDATE'
     and coalesce(current_setting('app.job_redaction', true), '') = 'on'
     and (to_jsonb(new) - array['body','meta','redacted_at']) is not distinct from (to_jsonb(old) - array['body','meta','redacted_at']) then
    return new;
  end if;
  raise exception 'job_events is append-only';
end $$;

drop trigger if exists job_events_append_only_trg on public.job_events;
create trigger job_events_append_only_trg
  before update or delete on public.job_events
  for each row execute function public.job_events_guard();

-- TRUNCATE ----------------------------------------------------------------------
create or replace function public.job_no_truncate()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  raise exception '% cannot be truncated', tg_table_name;
end $$;

drop trigger if exists job_events_no_truncate_trg on public.job_events;
create trigger job_events_no_truncate_trg before truncate on public.job_events
  for each statement execute function public.job_no_truncate();
drop trigger if exists job_approvals_no_truncate_trg on public.job_approvals;
create trigger job_approvals_no_truncate_trg before truncate on public.job_approvals
  for each statement execute function public.job_no_truncate();
drop trigger if exists job_outbox_no_truncate_trg on public.job_outbox;
create trigger job_outbox_no_truncate_trg before truncate on public.job_outbox
  for each statement execute function public.job_no_truncate();

-- Privileges: nobody but the service role writes; the owner reads through RLS.
revoke all on public.contacts, public.contact_aliases, public.job_rooms, public.job_parties,
  public.job_events, public.job_outbox, public.job_approvals, public.job_approvers,
  public.job_heartbeats from public, anon, authenticated;
grant select on public.contacts, public.contact_aliases, public.job_rooms, public.job_parties,
  public.job_events, public.job_outbox, public.job_approvals, public.job_approvers,
  public.job_heartbeats to authenticated;

-- 4. search_path on every function ----------------------------------------------
alter function public.job_room_touch() set search_path = public, pg_temp;
alter function public.job_append_only() set search_path = public, pg_temp;
alter function public.job_approver_role_check() set search_path = public, pg_temp;
alter function public.job_decide_approval(uuid, text, text, text, text) set search_path = public, pg_temp;
alter function public.job_heartbeat_claim_alert(text, integer) set search_path = public, pg_temp;

-- 5. erasure ------------------------------------------------------------------------
create or replace function public.job_redact_contact_messages(p_contact_id uuid, p_reason text)
returns table (events_redacted integer, outbox_redacted integer)
language plpgsql set search_path = public, pg_temp as $$
declare e integer; o integer;
begin
  if p_reason is null or length(btrim(p_reason)) < 3 then
    raise exception 'a reason code is required';
  end if;
  perform set_config('app.job_redaction', 'on', true);
  update public.job_events
     set body = case when body is null then null else '[verwijderd]' end,
         meta = '{}'::jsonb,
         redacted_at = now()
   where contact_id = p_contact_id and redacted_at is null;
  get diagnostics e = row_count;
  update public.job_outbox
     set body = '[verwijderd]', redacted_at = now()
   where contact_id = p_contact_id and redacted_at is null and state in ('sent', 'cancelled', 'failed');
  get diagnostics o = row_count;
  perform set_config('app.job_redaction', 'off', true);

  insert into public.job_events (direction, channel, actor, kind, status, meta)
  values ('internal', 'system', 'jobroom-privacy', 'privacy.redacted', 'recorded',
          jsonb_build_object('contact_id', p_contact_id, 'events', e, 'outbox', o, 'reason', left(p_reason, 100)));
  return query select e, o;
end $$;

-- Only the service role (and the SQL editor) may call the functions.
revoke all on function public.job_redact_contact_messages(uuid, text) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.job_redact_contact_messages(uuid, text) to service_role;
    grant execute on function public.job_decide_approval(uuid, text, text, text, text) to service_role;
    grant execute on function public.job_heartbeat_claim_alert(text, integer) to service_role;
  end if;
end $$;
