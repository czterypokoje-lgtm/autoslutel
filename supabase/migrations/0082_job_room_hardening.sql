-- ============================================================================
-- CRM: job room hardening (review fixes after S1 to S8). NOT APPLIED: owner
-- reviews first. Run after 0078, 0079, 0080 and 0081, in that order. Idempotent.
--
-- 1. An outbox row cannot be edited after it is proposed. Only its progress
--    columns (state, approval, claim, result) may change. This is what makes the
--    approval hash mean something: the text, recipient, audience, tier, kind and
--    attachment an approver saw are the ones that go out.
-- 2. The shadow flag cannot be turned off, and no row can be inserted without it. Going live is a deliberate later
--    migration that drops job_outbox_immutable_trg, not a code path.
-- 3. job_events and job_approvals are append-only; job_outbox rows are never
--    deleted. (A job room therefore cannot be deleted either: its events would
--    have to be changed. That is intended: the log outlives the job.)
-- 4. An approver's role must match the contact: an owner approver is a contact
--    with role 'owner', an assistant approver one with role 'staff'. A customer
--    or technician contact can never be an approver.
-- 5. Approving is one transaction (job_decide_approval): the approval row and
--    the outbox change succeed or fail together, under a row lock, so a failed
--    update no longer leaves an approval behind that blocks every retry.
-- 6. job_heartbeat_claim_alert claims the right to alert atomically, so two
--    overlapping checks cannot both alert.
-- ============================================================================

create or replace function public.job_outbox_immutable()
returns trigger language plpgsql as $$
declare
  progress text[] := array['state','updated_at','approved_by','approved_at','claimed_by',
                           'lease_until','attempts','provider_message_id','last_error','sent_at'];
begin
  if tg_op = 'DELETE' then
    raise exception 'job_outbox rows are never deleted';
  end if;
  if tg_op = 'INSERT' then
    -- Shadow rows only, until go-live drops this trigger. A row inserted with
    -- shadow = false would sidestep the lock on the flag.
    if new.shadow is distinct from true then
      raise exception 'job_outbox: only shadow rows may be inserted before go-live';
    end if;
    return new;
  end if;
  if (to_jsonb(new) - progress) is distinct from (to_jsonb(old) - progress) then
    raise exception 'job_outbox: only progress columns may change after insert (shadow included)';
  end if;
  return new;
end $$;

drop trigger if exists job_outbox_immutable_trg on public.job_outbox;
create trigger job_outbox_immutable_trg
  before insert or update or delete on public.job_outbox
  for each row execute function public.job_outbox_immutable();

create or replace function public.job_append_only()
returns trigger language plpgsql as $$
begin
  raise exception '% is append-only', tg_table_name;
end $$;

drop trigger if exists job_events_append_only_trg on public.job_events;
create trigger job_events_append_only_trg
  before update or delete on public.job_events
  for each row execute function public.job_append_only();

drop trigger if exists job_approvals_append_only_trg on public.job_approvals;
create trigger job_approvals_append_only_trg
  before update or delete on public.job_approvals
  for each row execute function public.job_append_only();

-- Approver role must match the contact's role.
create or replace function public.job_approver_role_check()
returns trigger language plpgsql as $$
declare contact_role text;
begin
  select role into contact_role from public.contacts where id = new.contact_id;
  if contact_role is null
     or (new.role = 'owner' and contact_role <> 'owner')
     or (new.role = 'assistant' and contact_role <> 'staff') then
    raise exception 'approver role % does not match contact role %', new.role, contact_role;
  end if;
  return new;
end $$;

drop trigger if exists job_approvers_role_trg on public.job_approvers;
create trigger job_approvers_role_trg
  before insert or update on public.job_approvers
  for each row execute function public.job_approver_role_check();

-- Approve or refuse one outbox row, atomically.
create or replace function public.job_decide_approval(
  p_outbox_id   uuid,
  p_decision    text,
  p_text_hash   text,
  p_decided_by  text,
  p_decided_via text
) returns table (code bigint, new_state text)
language plpgsql as $$
declare
  o public.job_outbox%rowtype;
  a public.job_approvals%rowtype;
  s text;
begin
  select * into o from public.job_outbox where id = p_outbox_id for update;
  if not found then raise exception 'not_found'; end if;
  if o.state <> 'proposed' then raise exception 'already_decided'; end if;
  if o.text_hash <> p_text_hash then raise exception 'hash_changed'; end if;

  insert into public.job_approvals (outbox_id, job_room_id, decision, text_hash, decided_by, decided_via)
  values (o.id, o.job_room_id, p_decision, p_text_hash, p_decided_by, p_decided_via)
  returning * into a;

  s := case when p_decision = 'approved' then 'approved' else 'cancelled' end;
  update public.job_outbox
     set state = s,
         approved_by = case when p_decision = 'approved' then p_decided_by else approved_by end,
         approved_at = case when p_decision = 'approved' then now() else approved_at end
   where id = o.id;

  return query select a.code, s;
end $$;

-- Claim the right to alert for one service, at most once per window.
create or replace function public.job_heartbeat_claim_alert(p_service text, p_minutes integer)
returns boolean language plpgsql as $$
begin
  insert into public.job_heartbeats (service, beat_at)
  values (p_service, 'epoch'::timestamptz)
  on conflict (service) do nothing;

  update public.job_heartbeats
     set alerted_at = now()
   where service = p_service
     and (alerted_at is null or alerted_at < now() - make_interval(mins => p_minutes));
  return found;
end $$;

-- Only the server (service role) may call these.
revoke all on function public.job_decide_approval(uuid, text, text, text, text) from public, anon, authenticated;
revoke all on function public.job_heartbeat_claim_alert(text, integer) from public, anon, authenticated;
