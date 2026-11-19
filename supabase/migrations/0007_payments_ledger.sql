-- ============================================================================
-- CRM fase 6: geld. Wie heeft het geïnd, wie is wie wat schuldig.
--
-- Run after 0006_customers_reports.sql. Idempotent.
--
-- The monteurs are ZZP'ers, so money moves in both directions and the CRM has
-- to keep score. Two things are recorded, and they are not the same thing:
--
--   1. What the customer paid for a job, and how.
--   2. The running account between the company and one monteur.
--
-- Payment method decides whether (1) creates an entry in (2). Cash taken at the
-- door sits in the monteur's pocket and is owed to the company. An iDEAL link
-- lands in the company account and creates no debt at all. That distinction is
-- the whole reason this is two tables and not one.
-- ============================================================================

-- 1. Monteur as a business ----------------------------------------------------
alter table public.technicians add column if not exists employment_type text not null default 'zzp';
alter table public.technicians add column if not exists kvk_nummer      text;
alter table public.technicians add column if not exists btw_nummer      text;
alter table public.technicians add column if not exists iban            text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'technicians_employment_check') then
    alter table public.technicians
      add constraint technicians_employment_check
      check (employment_type in ('zzp', 'loondienst'));
  end if;
end $$;

comment on column public.technicians.employment_type is
  'zzp = self-employed, settles through the ledger. loondienst = payroll, earnings live outside the CRM.';

-- 2. What the customer paid ---------------------------------------------------
create table if not exists public.job_payments (
  id          uuid primary key default gen_random_uuid(),
  job_id      uuid not null references public.jobs (id) on delete cascade,
  amount      numeric(10,2) not null check (amount > 0),
  method      text not null,
  /*
   * Null means the office received it (bank, iDEAL, invoice). A technician id
   * means it was handed over at the door and is now in that person's pocket.
   */
  received_by uuid references public.technicians (id) on delete set null,
  paid_at     timestamptz not null default now(),
  note        text,
  created_at  timestamptz not null default now(),
  created_by  uuid references auth.users (id) on delete set null,

  constraint job_payments_method_check check (
    method in ('contant', 'pin', 'tikkie', 'ideal', 'bank', 'factuur')
  )
);

create index if not exists job_payments_job_idx  on public.job_payments (job_id);
create index if not exists job_payments_tech_idx on public.job_payments (received_by, paid_at);

-- 3. The running account ------------------------------------------------------
/*
 * One row per movement, never updated — a balance you can only recompute is a
 * balance you can audit. `amount` is always positive; the sign lives in the
 * type, so nobody can book a negative payout by accident.
 *
 * Positive balance = the monteur owes the company.
 *
 *   incasso      +  collected customer money, now in their pocket
 *   afdracht     −  handed that money over
 *   verdienste   −  earned for the work
 *   uitbetaling  +  the company paid them
 *   correctie    ±  explicit, signed, always with a reason
 */
create table if not exists public.technician_ledger (
  id            uuid primary key default gen_random_uuid(),
  technician_id uuid not null references public.technicians (id) on delete cascade,
  job_id        uuid references public.jobs (id) on delete set null,
  payment_id    uuid references public.job_payments (id) on delete set null,
  entry_type    text not null,
  amount        numeric(10,2) not null check (amount > 0),
  -- Only used by `correctie`; every other type takes its sign from its meaning.
  direction     smallint not null default 1 check (direction in (-1, 1)),
  occurred_at   timestamptz not null default now(),
  note          text,
  created_at    timestamptz not null default now(),
  created_by    uuid references auth.users (id) on delete set null,

  constraint technician_ledger_type_check check (
    entry_type in ('incasso', 'afdracht', 'verdienste', 'uitbetaling', 'correctie')
  )
);

create index if not exists technician_ledger_tech_idx on public.technician_ledger (technician_id, occurred_at desc);

/** The signed effect of one entry on the balance. One definition, used everywhere. */
create or replace function public.ledger_effect(entry_type text, amount numeric, direction smallint)
returns numeric
language sql
immutable
as $$
  select case entry_type
    when 'incasso'     then  amount
    when 'uitbetaling' then  amount
    when 'afdracht'    then -amount
    when 'verdienste'  then -amount
    when 'correctie'   then  amount * direction
    else 0
  end;
$$;

-- 4. Cash in hand books itself ------------------------------------------------
/*
 * A trigger rather than application code: the debt must exist the moment the
 * payment is recorded. If the CRM had to remember to write both rows, one day
 * it would write only the first, and the monteur's balance would be quietly
 * wrong with no way to tell which job it came from.
 */
create or replace function public.job_payment_to_ledger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only money that physically ends up with the monteur creates a debt.
  -- tikkie/ideal/bank/factuur go straight to the company.
  if new.received_by is not null and new.method in ('contant', 'pin') then
    insert into public.technician_ledger
      (technician_id, job_id, payment_id, entry_type, amount, occurred_at, note, created_by)
    values
      (new.received_by, new.job_id, new.id, 'incasso', new.amount, new.paid_at,
       'Geïnd bij de klant (' || new.method || ')', new.created_by);
  end if;
  return new;
end $$;

drop trigger if exists job_payment_to_ledger_trg on public.job_payments;
create trigger job_payment_to_ledger_trg
  after insert on public.job_payments
  for each row execute function public.job_payment_to_ledger();

-- 5. Balances -----------------------------------------------------------------
drop view if exists public.crm_technician_balance;
create view public.crm_technician_balance as
select
  t.id                                as technician_id,
  t.name,
  t.employment_type,
  t.iban,
  coalesce(sum(public.ledger_effect(l.entry_type, l.amount, l.direction)), 0) as saldo,
  coalesce(sum(public.ledger_effect(l.entry_type, l.amount, l.direction))
    filter (where l.entry_type = 'incasso'), 0)     as totaal_geind,
  coalesce(-sum(public.ledger_effect(l.entry_type, l.amount, l.direction))
    filter (where l.entry_type = 'afdracht'), 0)    as totaal_afgedragen,
  coalesce(-sum(public.ledger_effect(l.entry_type, l.amount, l.direction))
    filter (where l.entry_type = 'verdienste'), 0)  as totaal_verdiend,
  coalesce(sum(public.ledger_effect(l.entry_type, l.amount, l.direction))
    filter (where l.entry_type = 'uitbetaling'), 0) as totaal_uitbetaald,
  max(l.occurred_at)                                as laatste_mutatie
from public.technicians t
left join public.technician_ledger l on l.technician_id = t.id
where public.crm_visible()
group by t.id, t.name, t.employment_type, t.iban;

comment on view public.crm_technician_balance is
  'Positive saldo = the monteur owes the company (collected money not yet handed over).';

-- 6. Grants -------------------------------------------------------------------
grant select, insert on public.job_payments       to authenticated;
grant select, insert on public.technician_ledger  to authenticated;
grant select          on public.crm_technician_balance to authenticated;
grant execute on function public.ledger_effect(text, numeric, smallint) to authenticated;

-- 7. Row Level Security -------------------------------------------------------
alter table public.job_payments      enable row level security;
alter table public.technician_ledger enable row level security;

-- A monteur records what they took at the door, and may see it back.
drop policy if exists job_payments_read on public.job_payments;
create policy job_payments_read on public.job_payments
  for select to authenticated
  using (public.can_touch_job(job_id));

drop policy if exists job_payments_write on public.job_payments;
create policy job_payments_write on public.job_payments
  for insert to authenticated
  with check (public.can_touch_job(job_id));

/*
 * The ledger is read-only to a monteur. They must be able to see their own
 * balance — arguing about money you cannot see is how trust goes — but the
 * entries that settle it are booked by the office.
 */
drop policy if exists ledger_read on public.technician_ledger;
create policy ledger_read on public.technician_ledger
  for select to authenticated
  using (
    public.crm_role() in ('owner', 'kantoor')
    or (
      public.crm_role() = 'monteur'
      and technician_id in (
        select id from public.technicians where user_id = auth.uid()
      )
    )
  );

drop policy if exists ledger_write on public.technician_ledger;
create policy ledger_write on public.technician_ledger
  for insert to authenticated
  with check (public.crm_role() in ('owner', 'kantoor'));

-- 8. security_invoker where available -----------------------------------------
do $$
begin
  if current_setting('server_version_num')::int >= 150000 then
    execute 'alter view public.crm_technician_balance set (security_invoker = true)';
  end if;
end $$;

notify pgrst, 'reload schema';
