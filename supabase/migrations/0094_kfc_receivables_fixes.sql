-- 0094: two fixes from the phase 3 end-to-end test. Idempotent.
--
-- 1. A reversal is never an open receivable itself; it re-opens or closes what
--    it reverses through its mirrored allocations. Same for an invoice entry
--    that has been reversed. Both leave the open view.
create or replace view public.kfc_invoice_open as
select e.id as entry_id, e.customer_id, e.entry_type, e.entry_date, e.due_date, e.sales_invoice_id, e.amount_cents,
       e.amount_cents - coalesce((select sum(a.amount_cents) from public.kfc_ledger_allocations a where a.invoice_entry_id = e.id), 0) as open_cents
  from public.kfc_customer_ledger e
 where e.amount_cents > 0
   and e.entry_type <> 'reversal'
   and not exists (select 1 from public.kfc_customer_ledger r where r.reverses_entry_id = e.id);

-- 2. Reversing a payment or credit that had settled invoices puts those
--    invoices back to 'verzonden' when something is open again.
create or replace function public.kfc_reverse_entry(p_entry bigint, p_key text, p_created_by uuid default null, p_note text default null)
returns bigint language plpgsql as $$
declare v_orig public.kfc_customer_ledger; v_id bigint; v_a record;
begin
  select id into v_id from public.kfc_customer_ledger where idempotency_key = p_key;
  if found then return v_id; end if;
  select * into v_orig from public.kfc_customer_ledger where id = p_entry;
  if not found then raise exception 'KFC_NO_ENTRY'; end if;
  if exists (select 1 from public.kfc_customer_ledger where reverses_entry_id = p_entry) then raise exception 'KFC_ALREADY_REVERSED'; end if;
  insert into public.kfc_customer_ledger (customer_id, entry_type, amount_cents, vat_cents, sales_invoice_id, reverses_entry_id, note, created_by, idempotency_key)
  values (v_orig.customer_id, 'reversal', -v_orig.amount_cents, -v_orig.vat_cents, v_orig.sales_invoice_id, p_entry, coalesce(p_note, 'Tegenboeking van #' || p_entry::text), p_created_by, p_key)
  returning id into v_id;
  for v_a in select * from public.kfc_ledger_allocations where credit_entry_id = p_entry or invoice_entry_id = p_entry loop
    insert into public.kfc_ledger_allocations (credit_entry_id, invoice_entry_id, amount_cents) values (v_a.credit_entry_id, v_a.invoice_entry_id, -v_a.amount_cents);
  end loop;
  update public.sales_invoices s set status = 'verzonden'
    from public.kfc_invoice_open o
   where o.sales_invoice_id = s.id and s.status = 'betaald' and o.open_cents > 0
     and o.entry_id in (select invoice_entry_id from public.kfc_ledger_allocations where credit_entry_id = p_entry);
  if v_orig.entry_type = 'invoice' and v_orig.sales_invoice_id is not null then
    update public.sales_invoices set status = 'verzonden' where id = v_orig.sales_invoice_id and status = 'betaald';
  end if;
  return v_id;
end $$;
