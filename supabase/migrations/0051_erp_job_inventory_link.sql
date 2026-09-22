-- ============================================================================
-- ERP Lite: Phase 4 - Bridging Job Costing & PIM
--
-- Connects jobs to the new PIM. Automatically recalculates a job's
-- 'cost_materials' based on the sum of all consumed job_materials.
-- ============================================================================

alter table public.job_materials
  add column if not exists inventory_product_id uuid references public.inventory_products(id) on delete restrict,
  add column if not exists inventory_location_id uuid references public.inventory_locations(id) on delete restrict;

-- Function to automatically roll up material costs to the job
create or replace function public.rollup_job_material_costs()
returns trigger
language plpgsql
security definer
as $$
declare
  target_job_id uuid;
  total_cost numeric(10,2);
begin
  -- Determine which job was affected
  if tg_op = 'DELETE' then
    target_job_id := old.job_id;
  else
    target_job_id := new.job_id;
  end if;

  -- Sum the costs: quantity * unit_cost
  select coalesce(sum(quantity * coalesce(unit_cost, 0)), 0)
  into total_cost
  from public.job_materials
  where job_id = target_job_id;

  -- Update the jobs table
  update public.jobs
  set cost_materials = total_cost
  where id = target_job_id;

  return null;
end;
$$;

drop trigger if exists job_materials_rollup_cost on public.job_materials;
create trigger job_materials_rollup_cost
  after insert or update of quantity, unit_cost, job_id or delete
  on public.job_materials
  for each row
  execute function public.rollup_job_material_costs();

