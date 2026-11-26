-- Betaaltermijn: 1 dag (owner, 2026-11-26). The ledger derives an invoice's
-- due date from the customer's terms_days (trigger kfc_post_invoice, 0093),
-- so the default and every existing customer move to 1; a customer who needs
-- longer gets it set on their card under Debiteuren & crediteuren.
alter table public.kfc_customers alter column terms_days set default 1;
update public.kfc_customers set terms_days = 1 where terms_days <> 1;
-- The trigger's fallback for a customer row without a term.
create or replace function public.kfc_post_invoice() returns trigger language plpgsql as $$
declare v_terms integer;
begin
  if new.customer_id is null or new.status = 'concept' then return new; end if;
  if exists (select 1 from public.kfc_customer_ledger where idempotency_key = 'inv:' || new.id::text) then return new; end if;
  select terms_days into v_terms from public.kfc_customers where id = new.customer_id;
  insert into public.kfc_customer_ledger (customer_id, entry_type, amount_cents, vat_cents, entry_date, due_date, sales_invoice_id, note, created_by, idempotency_key)
  values (new.customer_id, 'invoice', round(new.total * 100)::integer, round(new.vat_total * 100)::integer, new.issue_date,
          new.issue_date + coalesce(v_terms, 1), new.id, 'Factuur ' || new.invoice_number, new.created_by, 'inv:' || new.id::text);
  return new;
end $$;
notify pgrst, 'reload schema';
