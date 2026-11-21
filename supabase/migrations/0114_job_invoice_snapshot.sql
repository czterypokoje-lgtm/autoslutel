-- Freeze the amounts for a job invoice when the draft is first issued.
create table if not exists public.job_invoice_snapshots (
  invoice_id uuid primary key references public.sales_invoices (id),
  issued_at timestamptz not null default now(),
  lines jsonb not null,
  subtotal numeric not null,
  material_cost numeric,
  technician_cost numeric
);

alter table public.job_invoice_snapshots enable row level security;
revoke all on public.job_invoice_snapshots from public, anon, authenticated;
grant select on public.job_invoice_snapshots to service_role;

create or replace function public.snapshot_issued_job_invoice()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_lines jsonb;
begin
  select jsonb_agg(jsonb_build_object(
    'description', line.description, 'quantity', line.quantity, 'unit_price', line.unit_price,
    'discount', line.discount, 'vat_rate', line.vat_rate
  ) order by line.line_no, line.id)
  into v_lines from public.sales_invoice_lines line where line.invoice_id = new.id;
  if v_lines is null then
    raise exception 'JOB_INVOICE_LINES_REQUIRED';
  end if;

  -- The legacy jobs table defaults unwritten costs to zero.
  insert into public.job_invoice_snapshots (invoice_id, lines, subtotal, material_cost, technician_cost)
  select new.id, v_lines, new.subtotal, nullif(job.cost_materials, 0), nullif(job.cost_technician, 0)
  from public.jobs job where job.id = new.job_id
  on conflict (invoice_id) do nothing;
  return new;
end;
$$;

revoke all on function public.snapshot_issued_job_invoice() from public, anon, authenticated;

create or replace trigger snapshot_issued_job_invoice
after update of status on public.sales_invoices
for each row
when (new.job_id is not null and old.status = 'concept' and new.status in ('verzonden', 'betaald'))
execute function public.snapshot_issued_job_invoice();
