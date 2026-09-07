-- ============================================================================
-- CRM fase 12: van intern hulpmiddel naar platform.
--
-- Run after 0012_technician_profile.sql. Idempotent.
--
-- Until now a job was assigned by a person who knew, in their head, which
-- monteur could do which car. That knowledge does not survive a second monteur,
-- a night shift, or a voice agent answering the phone. This migration writes it
-- down.
--
-- Four things arrive:
--
--   1. capability   which cars a monteur can do, per scenario. The question
--                   "can you do a 2019 RAV4 with no working key" is three
--                   questions at once — the car, the scenario, and the tool in
--                   the van — and only the monteur can answer it.
--   2. subscription what a monteur pays us, and what we take per job. Stored
--                   per monteur rather than looked up, so changing our price
--                   list never silently reprices a deal somebody signed.
--   3. offers       a job is *offered* and accepted, never assigned. This is
--                   deliberate: we set the price, take the payment and route
--                   the work, and in the Netherlands that combination is
--                   exactly what gets examined for schijnzelfstandigheid. A
--                   monteur who can decline without penalty is a contractor.
--   4. unmet        every request we could not serve, with the car and the
--                   postcode. This is not an error log — it is the recruitment
--                   list, and it says which tool and which region to add next.
-- ============================================================================


-- 1. Vocabulary ---------------------------------------------------------------
/*
 * The four kinds of work, which are different jobs and not degrees of one.
 * A spare key is twenty minutes and most people can do it; all keys lost is a
 * stronger tool, often a PIN read, and hours. Pricing them the same loses money
 * on half and loses the customer on the other half.
 */
do $$
begin
  if not exists (select 1 from pg_type where typname = 'job_scenario') then
    create type public.job_scenario as enum (
      'bijmaken',            -- customer still has a working key
      'alle_sleutels_kwijt', -- no working key at all
      'reparatie',           -- housing, board or blade; no programming
      'slot'                 -- mechanical lock or cylinder work
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'subscription_tier') then
    create type public.subscription_tier as enum ('starter', 'pro', 'premium');
  end if;

  if not exists (select 1 from pg_type where typname = 'offer_response') then
    create type public.offer_response as enum ('accepted', 'declined', 'expired');
  end if;
end $$;


-- 2. What a monteur owns ------------------------------------------------------
/*
 * Tools, as the monteur states them. We sell most of these, so `brand` is a
 * short known list and `model` is free text — a tool range changes faster than
 * a migration does.
 *
 * This does not by itself decide capability. The catalogue holds car lists for
 * only 34 tool articles (131 cars, and one OBDSTAR kit is 49 of them), so tool
 * ownership is a seed for the coverage rows below and a sanity check on them,
 * never the source of truth.
 */
create table if not exists public.technician_tools (
  id            uuid primary key default gen_random_uuid(),
  technician_id uuid not null references public.technicians (id) on delete cascade,
  brand         text not null,
  model         text,
  note          text,
  created_at    timestamptz not null default now()
);

create index if not exists technician_tools_tech_idx
  on public.technician_tools (technician_id);


-- 3. What a monteur can do ----------------------------------------------------
/*
 * Coverage is declared per make and scenario, because that is how the trade
 * actually thinks: "VW group I do everything, Mercedes spare keys only, BMW not
 * at all." `model` is null for a whole make and filled in for the exceptions,
 * and `from_year`/`to_year` bound the ones where a generation changed the
 * immobiliser.
 *
 * `excluded` inverts a row: a make-wide yes with one model carved out is two
 * rows, not a list of every model they can do.
 */
create table if not exists public.technician_coverage (
  id            uuid primary key default gen_random_uuid(),
  technician_id uuid not null references public.technicians (id) on delete cascade,
  make          text not null,
  model         text,
  scenario      public.job_scenario not null,
  from_year     int,
  to_year       int,
  excluded      boolean not null default false,
  note          text,
  created_at    timestamptz not null default now(),

  constraint technician_coverage_years_check
    check (from_year is null or to_year is null or to_year >= from_year)
);

create index if not exists technician_coverage_lookup_idx
  on public.technician_coverage (lower(make), scenario);
create index if not exists technician_coverage_tech_idx
  on public.technician_coverage (technician_id);

/* One row per make/model/scenario per monteur; re-declaring updates. */
create unique index if not exists technician_coverage_unique_idx
  on public.technician_coverage (technician_id, lower(make), lower(coalesce(model, '')), scenario);


-- 4. What a monteur pays ------------------------------------------------------
/*
 * The numbers are stored on the row, not read from a price list.
 *
 * A subscription is an agreement with a person. If commission lived in a
 * constants file, changing our pricing would retroactively change what every
 * existing monteur owes on jobs already done — which is both wrong and, for a
 * contract, unenforceable.
 */
create table if not exists public.technician_subscription (
  technician_id    uuid primary key references public.technicians (id) on delete cascade,
  tier             public.subscription_tier not null default 'starter',
  monthly_fee      numeric(10,2) not null default 0,
  commission_pct   numeric(5,2)  not null default 25,
  /*
   * How long this monteur sees a matching job before it widens to the next
   * tier. Zero for starter: they see it when everyone else does.
   */
  priority_seconds int not null default 0,
  started_on       date not null default current_date,
  ends_on          date,
  note             text,
  updated_at       timestamptz not null default now(),

  constraint technician_subscription_pct_check
    check (commission_pct >= 0 and commission_pct <= 100)
);


-- 5. The job, as a platform job -----------------------------------------------
/*
 * Where the work came from. `eigen` is the monteur's own customer, entered in
 * their own calendar — first-class on purpose. A monteur who only opens this
 * app when we send work will not keep their availability true, and dispatch is
 * then routing against a fiction.
 */
alter table public.jobs add column if not exists job_source text not null default 'autosleutel24';
alter table public.jobs add column if not exists scenario   public.job_scenario;
alter table public.jobs add column if not exists keyless    boolean;

/* The car as the caller described it, which is not always a plate. */
alter table public.jobs add column if not exists car_make  text;
alter table public.jobs add column if not exists car_model text;
alter table public.jobs add column if not exists car_year  int;

/* Snapshot of the deal at the moment the job was accepted. */
alter table public.jobs add column if not exists commission_pct    numeric(5,2);
alter table public.jobs add column if not exists commission_amount numeric(10,2);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'jobs_job_source_check'
  ) then
    alter table public.jobs add constraint jobs_job_source_check
      check (job_source in ('autosleutel24', 'agent', 'eigen', 'partner'));
  end if;
end $$;

create index if not exists jobs_source_idx on public.jobs (job_source);


-- 6. Offer and accept ---------------------------------------------------------
/*
 * A job is offered to one monteur at a time, in rank order, each with a window.
 * Premium buys a head start, not an exclusive: when the window closes the offer
 * widens rather than dying.
 *
 * `tier_at_offer` and `rank` are kept so a monteur who asks "why did I not get
 * that job" can be answered from the record instead of from memory.
 */
create table if not exists public.job_offers (
  id            uuid primary key default gen_random_uuid(),
  job_id        uuid not null references public.jobs (id) on delete cascade,
  technician_id uuid not null references public.technicians (id) on delete cascade,
  rank          int not null default 0,
  tier_at_offer public.subscription_tier,
  score         numeric(6,2),
  reason        text,
  offered_at    timestamptz not null default now(),
  expires_at    timestamptz not null,
  responded_at  timestamptz,
  response      public.offer_response,
  decline_note  text
);

create index if not exists job_offers_job_idx  on public.job_offers (job_id, rank);
create index if not exists job_offers_open_idx on public.job_offers (technician_id, expires_at)
  where response is null;


-- 7. What we had to turn away -------------------------------------------------
/*
 * Logged on every refusal, including the ones a human refuses. Without it the
 * only record of a car we cannot do is a call that did not happen, and you
 * cannot plan a tool purchase from an absence.
 */
create table if not exists public.unmet_requests (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  car_make    text,
  car_model   text,
  car_year    int,
  keyless     boolean,
  scenario    public.job_scenario,
  postcode    text,
  /* 'geen_dekking' | 'geen_monteur' | 'geen_prijs' | 'buiten_gebied' */
  reason      text not null,
  source      text not null default 'agent',
  detail      text
);

create index if not exists unmet_requests_when_idx on public.unmet_requests (created_at desc);
create index if not exists unmet_requests_car_idx  on public.unmet_requests (lower(car_make), lower(car_model));


-- 8. Row level security -------------------------------------------------------
alter table public.technician_tools        enable row level security;
alter table public.technician_coverage     enable row level security;
alter table public.technician_subscription enable row level security;
alter table public.job_offers              enable row level security;
alter table public.unmet_requests          enable row level security;

/* Privileges are checked before policies, so both are needed. */
grant select, insert, update, delete on public.technician_tools    to authenticated;
grant select, insert, update, delete on public.technician_coverage to authenticated;
grant select                        on public.technician_subscription to authenticated;
grant select, update                on public.job_offers           to authenticated;
grant select                        on public.unmet_requests       to authenticated;

/** The technicians row belonging to the caller, or null. */
create or replace function public.my_technician_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.technicians where user_id = auth.uid() limit 1;
$$;

grant execute on function public.my_technician_id() to authenticated;

do $$
begin
  -- Tools and coverage: the office sees everyone, a monteur owns their own.
  if not exists (select 1 from pg_policies where policyname = 'technician_tools_access') then
    create policy technician_tools_access on public.technician_tools
      for all
      using (
        public.crm_role() in ('owner', 'kantoor')
        or technician_id = public.my_technician_id()
      )
      with check (
        public.crm_role() in ('owner', 'kantoor')
        or technician_id = public.my_technician_id()
      );
  end if;

  if not exists (select 1 from pg_policies where policyname = 'technician_coverage_access') then
    create policy technician_coverage_access on public.technician_coverage
      for all
      using (
        public.crm_role() in ('owner', 'kantoor')
        or technician_id = public.my_technician_id()
      )
      with check (
        public.crm_role() in ('owner', 'kantoor')
        or technician_id = public.my_technician_id()
      );
  end if;

  /*
   * A monteur may read their own subscription and never write it — the tier and
   * the commission are an agreement, not a setting.
   */
  if not exists (select 1 from pg_policies where policyname = 'technician_subscription_read') then
    create policy technician_subscription_read on public.technician_subscription
      for select
      using (
        public.crm_role() in ('owner', 'kantoor')
        or technician_id = public.my_technician_id()
      );
  end if;

  if not exists (select 1 from pg_policies where policyname = 'job_offers_read') then
    create policy job_offers_read on public.job_offers
      for select
      using (
        public.crm_role() in ('owner', 'kantoor')
        or technician_id = public.my_technician_id()
      );
  end if;

  /*
   * Accepting is an update of one's own open offer. The response itself is
   * written through crm_respond_to_offer() below, which also claims the job —
   * this policy exists so that call has something to stand on.
   */
  if not exists (select 1 from pg_policies where policyname = 'job_offers_respond') then
    create policy job_offers_respond on public.job_offers
      for update
      using (technician_id = public.my_technician_id() and response is null)
      with check (technician_id = public.my_technician_id());
  end if;

  if not exists (select 1 from pg_policies where policyname = 'unmet_requests_read') then
    create policy unmet_requests_read on public.unmet_requests
      for select
      using (public.crm_role() in ('owner', 'kantoor'));
  end if;
end $$;


-- 9. Accepting an offer -------------------------------------------------------
/*
 * One statement, so two monteurs tapping "accept" in the same second cannot
 * both get the job. The update on jobs is conditional on the job still being
 * unassigned; the loser is told the truth rather than shown a job that is not
 * theirs.
 */
create or replace function public.crm_respond_to_offer(
  p_offer_id uuid,
  p_accept   boolean,
  p_note     text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tech    uuid := public.my_technician_id();
  v_job     uuid;
  v_expires timestamptz;
  v_taken   uuid;
  v_pct     numeric(5,2);
begin
  if v_tech is null then
    return 'geen_monteur';
  end if;

  select job_id, expires_at into v_job, v_expires
  from public.job_offers
  where id = p_offer_id and technician_id = v_tech and response is null;

  if v_job is null then
    return 'niet_gevonden';
  end if;

  if v_expires < now() then
    update public.job_offers
       set response = 'expired', responded_at = now()
     where id = p_offer_id;
    return 'verlopen';
  end if;

  if not p_accept then
    update public.job_offers
       set response = 'declined', responded_at = now(), decline_note = p_note
     where id = p_offer_id;
    return 'afgewezen';
  end if;

  -- Claim the job only if nobody else already has.
  select technician_id into v_taken from public.jobs where id = v_job for update;
  if v_taken is not null then
    update public.job_offers
       set response = 'expired', responded_at = now(), decline_note = 'al toegewezen'
     where id = p_offer_id;
    return 'al_vergeven';
  end if;

  select commission_pct into v_pct
  from public.technician_subscription where technician_id = v_tech;

  update public.jobs
     set technician_id  = v_tech,
         commission_pct = coalesce(v_pct, 25),
         updated_at     = now()
   where id = v_job;

  update public.job_offers
     set response = 'accepted', responded_at = now()
   where id = p_offer_id;

  return 'geaccepteerd';
end $$;

grant execute on function public.crm_respond_to_offer(uuid, boolean, text) to authenticated;


-- 10. Everyone starts on starter ----------------------------------------------
insert into public.technician_subscription (technician_id, tier, monthly_fee, commission_pct, priority_seconds)
select id, 'starter', 0, 25, 0 from public.technicians
on conflict (technician_id) do nothing;
