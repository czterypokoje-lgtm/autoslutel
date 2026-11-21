-- Preserve the connection from an invoice line to the actual warehouse usage.
alter table public.sales_invoice_lines
  add column if not exists job_stock_id uuid references public.kfc_job_stock (id) on delete set null,
  add column if not exists job_line_kind text check (job_line_kind in ('product', 'service'));

create or replace function public.validate_job_invoice_line()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.job_stock_id is not null and not exists (
    select 1 from public.kfc_job_stock stock
    join public.sales_invoices invoice on invoice.id = new.invoice_id and invoice.job_id = stock.job_id
    where stock.id = new.job_stock_id and stock.state = 'used'
      and new.job_line_kind = 'product' and new.quantity <= stock.quantity
  ) then
    raise exception 'JOB_INVOICE_INVALID_USAGE';
  end if;
  if new.job_line_kind is not null and not exists (
    select 1 from public.sales_invoices invoice where invoice.id = new.invoice_id and invoice.job_id is not null
  ) then
    raise exception 'JOB_INVOICE_JOB_REQUIRED';
  end if;
  return new;
end;
$$;
revoke all on function public.validate_job_invoice_line() from public, anon, authenticated;
create or replace trigger validate_job_invoice_line
before insert or update on public.sales_invoice_lines
for each row execute function public.validate_job_invoice_line();

create unique index if not exists sales_invoice_lines_job_stock_once
on public.sales_invoice_lines(invoice_id, job_stock_id) where job_stock_id is not null;

create or replace function public.snapshot_issued_job_invoice()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_lines jsonb;
  v_warehouse jsonb;
  v_warehouse_cost numeric;
  v_legacy_cost numeric;
begin
  select jsonb_agg(jsonb_build_object(
    'description', line.description, 'quantity', line.quantity, 'unit_price', line.unit_price,
    'discount', line.discount, 'vat_rate', line.vat_rate,
    'job_stock_id', line.job_stock_id, 'job_line_kind', line.job_line_kind
  ) order by line.line_no, line.id)
  into v_lines from public.sales_invoice_lines line where line.invoice_id = new.id;
  if v_lines is null then
    raise exception 'JOB_INVOICE_LINES_REQUIRED';
  end if;

  select jsonb_agg(jsonb_build_object(
      'article_code', stock.article_code, 'quantity', stock.quantity, 'unit_cost_cents', move.unit_cost_cents
    ) order by stock.created_at, stock.id),
    case when count(*) = count(move.unit_cost_cents)
      then sum(stock.quantity::numeric * move.unit_cost_cents) / 100 end
  into v_warehouse, v_warehouse_cost
  from public.kfc_job_stock stock
  left join public.kfc_stock_moves move
    on move.idempotency_key = 'job-stock:' || stock.id::text and move.reason = 'issue'
  where stock.job_id = new.job_id and stock.state = 'used';

  select case when count(*) = count(unit_cost)
    then coalesce(sum(quantity * unit_cost), 0) end into v_legacy_cost
  from public.job_materials where job_id = new.job_id;

  -- A manually entered job total may already include warehouse parts.
  insert into public.job_invoice_snapshots (invoice_id, lines, subtotal, material_cost, technician_cost, warehouse_materials)
  select new.id, v_lines, new.subtotal,
    case when v_warehouse is null then nullif(job.cost_materials, 0) else v_warehouse_cost + v_legacy_cost end,
    nullif(job.cost_technician, 0), coalesce(v_warehouse, '[]'::jsonb)
  from public.jobs job where job.id = new.job_id
  on conflict (invoice_id) do nothing;
  return new;
end;
$$;

revoke all on function public.snapshot_issued_job_invoice() from public, anon, authenticated;
