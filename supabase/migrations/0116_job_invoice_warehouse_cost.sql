-- Keep the warehouse issue cost and its source lines when the job invoice is issued.
alter table public.job_invoice_snapshots
  add column if not exists warehouse_materials jsonb not null default '[]'::jsonb;

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
    'discount', line.discount, 'vat_rate', line.vat_rate
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
