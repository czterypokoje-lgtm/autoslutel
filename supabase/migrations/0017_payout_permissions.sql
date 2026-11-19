-- ============================================================================
-- CRM fase 17: een monteur mag zijn eigen uitbetaling niet goedkeuren.
--
-- Run after 0016_payout_requests.sql. Idempotent.
--
-- 0016 gave `payout_requests` a single `for all` policy allowing either the
-- office or the technician the row belongs to, together with
-- `grant update (status, paid_at, notes) to authenticated`. Read them together
-- and a technician can:
--
--     update payout_requests set status = 'paid' where technician_id = mine;
--
-- The anon key ships in the page bundle, so this needs no CRM screen — a
-- PostgREST call from anywhere with a monteur session does it. Asking for money
-- and approving the payment of money are the same permission in that policy,
-- which is the one separation a payout table exists to enforce.
--
-- Splitting it: a technician may see their own requests and file new ones;
-- only the office may change one, and only the office may delete one.
-- ============================================================================

-- 1. Take the blanket policy off ---------------------------------------------
drop policy if exists payout_requests_access on public.payout_requests;

-- 2. Privileges first: they are checked before policies ----------------------
revoke update, delete on public.payout_requests from authenticated;
grant select, insert on public.payout_requests to authenticated;
grant update (status, paid_at, notes) on public.payout_requests to authenticated;

-- 3. Read: the office sees everything, a monteur sees their own --------------
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'payout_requests_read') then
    create policy payout_requests_read on public.payout_requests
      for select
      using (
        public.crm_role() in ('owner', 'kantoor')
        or technician_id = public.my_technician_id()
      );
  end if;

  /*
   * Filing a request. A monteur may only file one for themselves, and only as
   * 'pending' — the status column is the approval, so the row may not arrive
   * already approved.
   */
  if not exists (select 1 from pg_policies where policyname = 'payout_requests_insert') then
    create policy payout_requests_insert on public.payout_requests
      for insert
      with check (
        status = 'pending'
        and (
          public.crm_role() in ('owner', 'kantoor')
          or technician_id = public.my_technician_id()
        )
      );
  end if;

  /* Approving, rejecting, marking paid: the office, and nobody else. */
  if not exists (select 1 from pg_policies where policyname = 'payout_requests_office_update') then
    create policy payout_requests_office_update on public.payout_requests
      for update
      using (public.crm_role() in ('owner', 'kantoor'))
      with check (public.crm_role() in ('owner', 'kantoor'));
  end if;

  if not exists (select 1 from pg_policies where policyname = 'payout_requests_office_delete') then
    create policy payout_requests_office_delete on public.payout_requests
      for delete
      using (public.crm_role() in ('owner', 'kantoor'));
  end if;
end $$;

-- 4. The enum in 0016 was created unguarded ----------------------------------
/*
 * `create type public.payout_status ...` without a guard makes 0016 fail on a
 * second run, which turns "apply all migrations" into a manual job. Nothing to
 * repair here — this note is so the next person does not rediscover it — but
 * the guard belongs in 0016 itself if it is ever re-edited.
 */

notify pgrst, 'reload schema';
