-- ============================================================================
-- CRM: job room, third review fixes. NOT APPLIED: owner reviews first.
-- Run after 0078 to 0083, in that order. Idempotent.
--
-- 1. 'approved' needs more than a matching approval row: the approval must
--    come from an ACTIVE approver (decided_by is that contact's id), and once
--    shadow is lifted a decision made by 'system' no longer counts.
-- 2. Erasure keeps the evidence: events of kind outbox.blocked, approval.refused
--    and privacy.redacted (ids, hashes and reason codes only) are never blanked,
--    and the function refuses owner, staff and approver contacts. It also
--    redacts events of the contact's own jobs that carry no contact id, and it
--    anonymises the contact row (name, WhatsApp name, city, number) and drops
--    its aliases, so nothing personal stays behind.
-- 3. A contact that has events cannot be deleted. Run
--    job_redact_contact_messages(contact, reason code) FIRST, which anonymises
--    the contact; the row itself then stays, because the log refers to it.
-- ============================================================================

-- 1. outbox trigger: the approval must come from an active approver -------------
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
         select 1
           from public.job_approvals a
           join public.job_approvers ap on ap.contact_id::text = a.decided_by and ap.active
          where a.outbox_id = new.id
            and a.decision = 'approved'
            and a.text_hash = new.text_hash
            and (new.shadow or a.decided_via <> 'system')) then
      raise exception 'job_outbox: approved needs a matching approved job_approvals row by an active approver';
    end if;
  end if;
  return new;
end $$;

-- 2. erasure that keeps the evidence ------------------------------------------------
create or replace function public.job_redact_contact_messages(p_contact_id uuid, p_reason text)
returns table (events_redacted integer, outbox_redacted integer)
language plpgsql set search_path = public, pg_temp as $$
declare e integer; o integer;
begin
  if p_reason is null or length(btrim(p_reason)) < 3 then
    raise exception 'a reason code is required';
  end if;
  if not exists (select 1 from public.contacts where id = p_contact_id) then
    raise exception 'unknown contact';
  end if;
  if exists (select 1 from public.contacts where id = p_contact_id and role in ('owner', 'staff'))
     or exists (select 1 from public.job_approvers where contact_id = p_contact_id) then
    raise exception 'owner, staff and approver contacts cannot be redacted';
  end if;

  perform set_config('app.job_redaction', 'on', true);
  -- Evidence kinds hold ids, hashes and reason codes only and are kept.
  update public.job_events
     set body = case when body is null then null else '[verwijderd]' end,
         meta = '{}'::jsonb,
         redacted_at = now()
   where redacted_at is null
     and kind not in ('outbox.blocked', 'approval.refused', 'privacy.redacted')
     and (contact_id = p_contact_id
          or (contact_id is null and job_room_id in (select id from public.job_rooms where customer_contact_id = p_contact_id)));
  get diagnostics e = row_count;
  update public.job_outbox
     set body = '[verwijderd]', redacted_at = now()
   where contact_id = p_contact_id and redacted_at is null and state in ('sent', 'cancelled', 'failed');
  get diagnostics o = row_count;
  perform set_config('app.job_redaction', 'off', true);

  -- The contact row stays (the log points at it) but holds nothing personal.
  delete from public.contact_aliases where contact_id = p_contact_id;
  update public.contacts
     set display_name = '[verwijderd]', wa_name = null, city = null, active = false,
         phone_e164 = '+999' || lpad((('x' || substr(md5(p_contact_id::text), 1, 8))::bit(32)::bigint % 1000000000)::text, 9, '0')
   where id = p_contact_id;

  insert into public.job_events (direction, channel, actor, kind, status, meta)
  values ('internal', 'system', 'jobroom-privacy', 'privacy.redacted', 'recorded',
          jsonb_build_object('contact_id', p_contact_id, 'events', e, 'outbox', o, 'reason', left(p_reason, 100)));
  return query select e, o;
end $$;

revoke all on function public.job_redact_contact_messages(uuid, text) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.job_redact_contact_messages(uuid, text) to service_role;
  end if;
end $$;

-- 3. a contact with events is never deleted -----------------------------------------
create or replace function public.job_contact_delete_guard()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if exists (select 1 from public.job_events where contact_id = old.id) then
    raise exception 'contacts: this contact has events; run job_redact_contact_messages first (it anonymises the row), the row stays';
  end if;
  return old;
end $$;

drop trigger if exists contacts_delete_guard_trg on public.contacts;
create trigger contacts_delete_guard_trg
  before delete on public.contacts
  for each row execute function public.job_contact_delete_guard();
