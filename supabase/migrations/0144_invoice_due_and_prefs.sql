-- Two things the office asked for on the invoice screen (2026-11-26):
--
-- 1. The payment term is chosen per invoice, not fixed. The date it yields is
--    stored on the invoice; where the receivables ledger exists (0093) its
--    trigger uses that date instead of the customer's default term.
-- 2. The screen remembers what the user filled in last time — the Van block
--    and the term — per user, so it is not typed again. Written by
--    /api/admin/invoices on every save, read by /admin/facturen/nieuw.

alter table public.sales_invoices add column if not exists due_date date;

create table if not exists public.crm_user_prefs (
  user_id            uuid primary key references auth.users (id) on delete cascade,
  invoice_from       jsonb,
  invoice_terms_days integer check (invoice_terms_days between 0 and 180),
  updated_at         timestamptz not null default now()
);
alter table public.crm_user_prefs enable row level security;
revoke all on public.crm_user_prefs from anon;
grant select, insert, update on public.crm_user_prefs to authenticated;
drop policy if exists crm_user_prefs_own on public.crm_user_prefs;
create policy crm_user_prefs_own on public.crm_user_prefs
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- The ledger trigger (only where the ledger exists) prefers the invoice's own due date.
do $$
begin
  if to_regclass('public.kfc_customers') is not null and to_regclass('public.kfc_customer_ledger') is not null then
    execute $f$
      create or replace function public.kfc_post_invoice() returns trigger language plpgsql as $t$
      declare v_terms integer;
      begin
        if new.customer_id is null or new.status = 'concept' then return new; end if;
        if exists (select 1 from public.kfc_customer_ledger where idempotency_key = 'inv:' || new.id::text) then return new; end if;
        select terms_days into v_terms from public.kfc_customers where id = new.customer_id;
        insert into public.kfc_customer_ledger (customer_id, entry_type, amount_cents, vat_cents, entry_date, due_date, sales_invoice_id, note, created_by, idempotency_key)
        values (new.customer_id, 'invoice', round(new.total * 100)::integer, round(new.vat_total * 100)::integer, new.issue_date,
                coalesce(new.due_date, new.issue_date + coalesce(v_terms, 30)), new.id, 'Factuur ' || new.invoice_number, new.created_by, 'inv:' || new.id::text);
        return new;
      end $t$;
    $f$;
  end if;
end $$;
notify pgrst, 'reload schema';
