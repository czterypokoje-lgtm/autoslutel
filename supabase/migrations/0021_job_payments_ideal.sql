-- ============================================================================
-- CRM fase 21: betalen aan de deur, en wat er daarna van de commissie komt.
--
-- Run after 0020_invoice_storage.sql. Idempotent.
--
-- `job_payments` (0007) meant "money received". A payment *request* is not
-- received yet — the customer still has to scan the code — so the table needs a
-- state it never had. Cash keeps arriving already-paid; an iDEAL request starts
-- open and only Mollie may close it.
--
-- Deliberately separate from the webshop's Mollie flow. That one has its own
-- route, its own webhook and its own metadata, and the two must stay that way:
-- a change to how the shop takes an order can then never break how a monteur
-- takes money at the kerb, which happens at 03:00 with a customer waiting.
--
-- Commission is stamped on the payment when it is confirmed, not read live from
-- the technician's subscription. What we take on a job is the rate that was
-- agreed when the job was accepted; a tier change next month must not reprice
-- work already done and already paid for.
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'payment_state') then
    create type public.payment_state as enum (
      'open',      -- request created, customer has not paid yet
      'betaald',   -- confirmed: cash in hand, or Mollie said paid
      'mislukt',   -- cancelled, expired or refused
      'terugbetaald'
    );
  end if;
end $$;

alter table public.job_payments add column if not exists status public.payment_state not null default 'betaald';
alter table public.job_payments add column if not exists mollie_payment_id text;
alter table public.job_payments add column if not exists checkout_url text;
alter table public.job_payments add column if not exists requested_at timestamptz;

/*
 * What the platform keeps from this payment, and what the monteur is left
 * with. Both stored, both stamped at confirmation — so an invoice from a
 * subcontractor can be checked against the row without recomputing anything.
 */
alter table public.job_payments add column if not exists commission_pct    numeric(5,2);
alter table public.job_payments add column if not exists commission_amount numeric(10,2);

/* One Mollie payment maps to at most one row, so a retried webhook is a no-op. */
create unique index if not exists job_payments_mollie_idx
  on public.job_payments (mollie_payment_id)
  where mollie_payment_id is not null;

create index if not exists job_payments_open_idx
  on public.job_payments (job_id) where status = 'open';

/*
 * `paid_at` was `not null default now()`, which is right for cash and wrong for
 * a request that has not been paid. It stays not-null — too much reads it — but
 * `status` is what decides whether the money actually arrived. Anything summing
 * revenue must filter on status = 'betaald'.
 */

-- Confirming a payment, and working out the split ----------------------------
/*
 * Called by the webhook (service role) and by the screen when a monteur records
 * cash. Idempotent on purpose: Mollie retries until it gets a 200, so the same
 * payment id can arrive three times, and the second and third must change
 * nothing.
 */
create or replace function public.crm_settle_payment(
  p_payment uuid,
  p_status  public.payment_state
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job    uuid;
  v_amount numeric(10,2);
  v_state  public.payment_state;
  v_pct    numeric(5,2);
begin
  select job_id, amount, status into v_job, v_amount, v_state
  from public.job_payments
  where id = p_payment
  for update;

  if v_job is null then
    return 'niet_gevonden';
  end if;
  if v_state = p_status then
    return 'ongewijzigd';
  end if;

  if p_status <> 'betaald' then
    update public.job_payments set status = p_status where id = p_payment;
    return 'ok';
  end if;

  /* The rate agreed on this job, not today's tier. */
  select commission_pct into v_pct from public.jobs where id = v_job;
  v_pct := coalesce(v_pct, 25);

  update public.job_payments
     set status            = 'betaald',
         paid_at           = now(),
         commission_pct    = v_pct,
         commission_amount = round(v_amount * v_pct / 100, 2)
   where id = p_payment;

  return 'ok';
end $$;

grant execute on function public.crm_settle_payment(uuid, public.payment_state) to authenticated;
/* The webhook runs as the service role: Mollie has no session to speak of. */
grant execute on function public.crm_settle_payment(uuid, public.payment_state) to service_role;

notify pgrst, 'reload schema';
