/*
 * A monteur's own price list — which is the same thing as their coverage.
 *
 * technician_coverage already carried make, model, scenario, from_year,
 * to_year, keyless and excluded: every column the office's Tarieven screen
 * has except the price itself. So this adds `price` to that table rather
 * than starting a second one.
 *
 * That matters for more than tidiness. coversCar() and anyCoverage() in
 * src/lib/capability.ts read technician_coverage to decide who is even
 * offered a job, and a technician with no rows is offered nothing at all —
 * which is exactly how live dispatch silently went to zero once before. A
 * separate pricing table would be a second list that has to agree with this
 * one, and the day they disagree the monteur either gets jobs they never
 * priced or prices nobody can reach. One row now says both things: "I do
 * this car, for this much."
 *
 * price stays nullable. The 40 rows already in this table were derived from
 * real completed jobs and record coverage the office already relies on; they
 * are not wrong, they just have no price yet, and dropping them to satisfy a
 * NOT NULL would take the dispatch that depends on them with it.
 */

alter table public.technician_coverage
  add column if not exists price numeric(10,2);

alter table public.technician_coverage
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'technician_coverage_price_check'
  ) then
    alter table public.technician_coverage
      add constraint technician_coverage_price_check
      check (price is null or (price >= 0 and price <= 100000));
  end if;
end $$;

comment on column public.technician_coverage.price is
  'What this monteur charges for this car and scenario. Null = they do the work but have not named a price.';


/*
 * Years have to be years.
 *
 * A row reached production with from_year = -1 — a number spinner stepped
 * below zero from an empty field in the old picker, and nothing rejected it.
 * It read as "-1-" in the bouwjaar column and, worse, yearMatches() treated
 * it as a real lower bound. The bad row has been corrected; this stops the
 * next one. Null stays allowed: it means "all years", which is the common case.
 */
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'technician_coverage_year_sanity_check'
  ) then
    alter table public.technician_coverage
      add constraint technician_coverage_year_sanity_check
      check (
        (from_year is null or (from_year between 1950 and 2100))
        and (to_year is null or (to_year between 1950 and 2100))
      );
  end if;
end $$;


/*
 * Who changed what, and when.
 *
 * The office asked to see not only the prices a monteur set but the history
 * behind them — a price that moved from €180 to €320 the week before an
 * invoice dispute is the kind of thing that has to be answerable later. Rows
 * are written by the trigger below, never by the application, so a change
 * cannot be made without also being recorded.
 */
create table if not exists public.technician_coverage_log (
  id            bigserial primary key,
  coverage_id   uuid,
  technician_id uuid not null,
  action        text not null check (action in ('insert', 'update', 'delete')),
  make          text,
  model         text,
  scenario      public.job_scenario,
  from_year     int,
  to_year       int,
  keyless       boolean,
  excluded      boolean,
  old_price     numeric(10,2),
  new_price     numeric(10,2),
  /* auth.uid() of whoever made the change — usually the monteur, sometimes the office. */
  changed_by    uuid,
  changed_at    timestamptz not null default now()
);

create index if not exists technician_coverage_log_tech_idx
  on public.technician_coverage_log (technician_id, changed_at desc);

create index if not exists technician_coverage_log_time_idx
  on public.technician_coverage_log (changed_at desc);


create or replace function public.log_technician_coverage()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row record;
begin
  /* On delete the new record is empty, so read the shape off the old one. */
  v_row := coalesce(new, old);

  insert into public.technician_coverage_log (
    coverage_id, technician_id, action, make, model, scenario,
    from_year, to_year, keyless, excluded, old_price, new_price, changed_by
  )
  values (
    v_row.id,
    v_row.technician_id,
    lower(tg_op),
    v_row.make,
    v_row.model,
    v_row.scenario,
    v_row.from_year,
    v_row.to_year,
    v_row.keyless,
    v_row.excluded,
    case when tg_op in ('UPDATE', 'DELETE') then old.price end,
    case when tg_op in ('INSERT', 'UPDATE') then new.price end,
    auth.uid()
  );

  return v_row;
end $$;

drop trigger if exists technician_coverage_log_trg on public.technician_coverage;
create trigger technician_coverage_log_trg
  after insert or update or delete on public.technician_coverage
  for each row execute function public.log_technician_coverage();


/* Keeps updated_at honest without the application having to remember it. */
create or replace function public.touch_technician_coverage()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists technician_coverage_touch_trg on public.technician_coverage;
create trigger technician_coverage_touch_trg
  before update on public.technician_coverage
  for each row execute function public.touch_technician_coverage();


alter table public.technician_coverage_log enable row level security;

grant select on public.technician_coverage_log to authenticated;

/*
 * The log is read-only to everyone: the office to answer "what did they
 * charge last month", a monteur to see their own history. Nobody may write
 * or amend it from the application — only the trigger inserts, and it runs
 * as definer so an insert succeeds even though no policy allows one.
 */
do $$
begin
  if not exists (
    select 1 from pg_policies where policyname = 'technician_coverage_log_read'
  ) then
    create policy technician_coverage_log_read on public.technician_coverage_log
      for select
      using (
        public.crm_role() in ('owner', 'kantoor')
        or technician_id = public.my_technician_id()
      );
  end if;
end $$;
