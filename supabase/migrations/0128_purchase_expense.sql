-- One aggregated non-stock expense per purchase document. Stock lines stay on the order.
alter table public.expenses add column purchase_order_id uuid unique references public.kfc_purchase_orders(id);
create policy linked_purchase_expense_office on public.expenses as restrictive for all to authenticated
  using (purchase_order_id is null or public.crm_role() in ('owner','kantoor'))
  with check (purchase_order_id is null or public.crm_role() in ('owner','kantoor'));
