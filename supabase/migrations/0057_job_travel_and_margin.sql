-- ============================================================================
-- CRM fase 57: brandstof per klus, en een brutowinst die klopt.
--
-- Run after 0056_retire_erp_pim.sql. Idempotent.
--
-- The question this phase answers is the owner's own: per klus, wat blijft er
-- over na onderdelen en brandstof. Every piece was already here — the costing
-- columns (0050), the generated margin (0054), the rollup trigger (0051), the
-- job editor that shows all of it. What was missing was inputs. 0056 fixed
-- the parts half. This fixes the fuel half, and repairs two places where the
-- numbers could disagree with themselves.
-- ============================================================================

-- 1. Brandstof per klus --------------------------------------------------------
/*
 * How far the van went for this job, so the euro figure beside it can be
 * explained rather than believed. Filled once, from Google's Distance Matrix,
 * when the job is marked afgerond (src/lib/jobTravelCost.ts).
 *
 * Kept as its own column rather than recomputed at read time: what a job cost
 * in fuel is a historical fact. The rate moves, the road does not.
 */
alter table public.jobs add column if not exists travel_km numeric(10,2);

comment on column public.jobs.travel_km is
  'Round-trip distance for this job in km, base to address and back. Null means we could not measure it — never 0.';

/*
 * The only writer of travel_km and its euro twin.
 *
 * The guard lives in SQL, not in the route that calls it. Two PATCHes landing
 * together would both read travel_km as null, both call Google, and both
 * write — one statement with the condition inside it cannot do that.
 *
 * `coalesce(cost_travel, 0) = 0` means a figure somebody typed by hand always
 * wins. A person who went and looked knows something the matrix does not.
 */
create or replace function public.crm_set_job_travel(
  p_job uuid,
  p_km  numeric,
  p_eur numeric
)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.jobs
     set travel_km   = p_km,
         cost_travel = p_eur
   where id = p_job
     and travel_km is null
     and coalesce(cost_travel, 0) = 0;

  if not found then
    return 'al_bekend';
  end if;
  return 'ok';
end $$;

grant execute on function public.crm_set_job_travel(uuid, numeric, numeric) to authenticated;


-- 2. Brutowinst zonder de commissie-aanname ------------------------------------
/*
 * 0054 subtracts `coalesce(cost_technician, commission_amount, 0)`.
 *
 * The problem is not that the fallback is imprecise — it is that its SIGN is
 * unknown. This codebase says so itself, at src/app/admin/monteurs/[id]/page.tsx:
 * "some technicians are paid a fee per job by the business, others pay the
 * business a referral fee out of what they collect themselves". That page
 * refuses to compute an earnings figure for exactly this reason, and then the
 * margin formula goes and subtracts the number anyway — so for half the
 * technicians brutowinst is quietly reduced by money that came IN.
 *
 * Dropping the fallback makes gross_margin exactly what was asked for:
 * omzet minus onderdelen minus brandstof. cost_technician defaults to 0
 * (0050), so it becomes something else only when somebody deliberately types
 * a labour cost. Commission keeps being reported as its own column, the way
 * monteurs/[id] already decided it should be.
 *
 * Generated columns cannot be altered in place; drop and re-add rewrites the
 * table, which at 78 rows is instant.
 */
alter table public.jobs drop column if exists gross_margin;

alter table public.jobs
  add column gross_margin numeric(10,2)
  generated always as (
    coalesce(final_price, 0)
    - (
      coalesce(cost_materials, 0)
      + coalesce(cost_travel, 0)
      + coalesce(cost_payment_fee, 0)
      + coalesce(cost_other, 0)
      + coalesce(cost_technician, 0)
    )
  ) stored;

comment on column public.jobs.gross_margin is
  'Omzet minus onderdelen, brandstof, transactiekosten, overige kosten en een handmatig ingevulde loonpost. Commissie zit er bewust NIET in: de richting daarvan verschilt per monteur.';


-- 3. Voorraad afboeken die ook terugboekt --------------------------------------
/*
 * The same movement, applied to one row, with the reason travelling alongside
 * it so the audit log can tell what happened.
 *
 * `app.stock_reason` is a session variable rather than an argument because the
 * thing that writes stock_moves is a trigger on stock_items, three frames away
 * from anything that knows why. set_config(..., true) scopes it to the
 * transaction, so it cannot leak into the next statement.
 */
create or replace function public.apply_stock_delta(
  p_item  uuid,
  p_delta numeric,
  p_reason text default 'verbruik'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_item is null or p_delta = 0 then
    return;
  end if;

  perform set_config('app.stock_reason', p_reason, true);

  update public.stock_items
     set quantity   = greatest(quantity + p_delta, 0),
         updated_at = now()
   where id = p_item;
end $$;

/*
 * Was `after insert` only.
 *
 * The office deletes a mistyped material line; rollup_job_material_costs (0051)
 * correctly lowers jobs.cost_materials, and the stock stays down forever. Two
 * numbers that agreed a moment ago now disagree, silently, and the only way to
 * find out is a stocktake. A deduction that cannot be undone is not a
 * deduction, it is a leak.
 */
create or replace function public.job_material_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_delta numeric(10,2);
begin
  if tg_op = 'INSERT' then
    v_delta := -new.quantity;

  elsif tg_op = 'DELETE' then
    /* The part goes back in the van. */
    perform public.apply_stock_delta(old.stock_item_id, old.quantity, 'correctie');
    return old;

  else
    /* Repointed at a different article: return the old one, take the new. */
    if new.stock_item_id is distinct from old.stock_item_id then
      perform public.apply_stock_delta(old.stock_item_id, old.quantity, 'correctie');
      perform public.apply_stock_delta(new.stock_item_id, -new.quantity, 'verbruik');
      return new;
    end if;
    v_delta := old.quantity - new.quantity;
  end if;

  perform public.apply_stock_delta(coalesce(new.stock_item_id, old.stock_item_id), v_delta, 'verbruik');
  return coalesce(new, old);
end $$;

drop trigger if exists job_material_stock_trg on public.job_materials;
create trigger job_material_stock_trg
  after insert or update or delete on public.job_materials
  for each row execute function public.job_material_stock();

/*
 * Note: job_materials has no UPDATE grant to `authenticated` (0005), so the
 * update arm above is unreachable from the app today — no screen edits a
 * material line, only add and remove. It is written anyway because a trigger
 * that handles two of three operations is a trap for whoever adds the third.
 */


-- 4. Een verplaatsingslog die niet liegt ---------------------------------------
/*
 * log_stock_move() derived `reason` from TG_OP alone, so every real movement
 * — a part fitted, a delivery received, a transfer between vans — landed as
 * 'correctie'. The check constraint has always allowed 'verbruik',
 * 'ontvangst' and 'overdracht'; nothing ever set them.
 *
 * That matters more than it sounds. The van screen and the new stock screen
 * both show this history, and a list where every line says "correctie" is a
 * list nobody believes, which is how a stock screen stops being used.
 *
 * 'verbruik' is set here, by apply_stock_delta above — the one that was
 * actually wrong, and the one the whole parts-per-job story rests on.
 *
 * 'ontvangst' and 'overdracht' are deliberately NOT done yet.
 * crm_confirm_invoice (0019) and crm_transfer_stock (0018) would each have to
 * be copied wholesale into this migration to gain one set_config line, and
 * two 80-line duplicates that immediately start drifting from their originals
 * cost more than the labels are worth. Note that a delivery of an article the
 * van has never held already logs correctly as 'nieuw'; only a top-up of an
 * existing article still reads 'correctie'. Do it when either function is
 * being edited for its own reasons.
 */
create or replace function public.log_stock_move()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_delta  numeric(10,2);
  v_reason text;
begin
  if tg_op = 'INSERT' then
    v_delta := new.quantity;
    v_reason := 'nieuw';
  elsif tg_op = 'DELETE' then
    v_delta := -old.quantity;
    v_reason := 'verwijderd';
  else
    v_delta := new.quantity - old.quantity;
    /* An edit that does not move the count is not a stock movement. */
    if v_delta = 0 then
      return new;
    end if;
    /* Whoever moved it says why; a hand-edit in the table says nothing. */
    v_reason := coalesce(nullif(current_setting('app.stock_reason', true), ''), 'correctie');
  end if;

  insert into public.stock_moves (
    stock_item_id, technician_id, description, delta, quantity_after,
    unit_cost, reason, changed_by
  )
  values (
    coalesce(new.id, old.id),
    coalesce(new.technician_id, old.technician_id),
    coalesce(new.description, old.description),
    v_delta,
    coalesce(new.quantity, 0),
    coalesce(new.unit_cost, old.unit_cost),
    v_reason,
    auth.uid()
  );

  return coalesce(new, old);
end $$;

notify pgrst, 'reload schema';
