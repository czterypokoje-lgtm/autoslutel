begin;
insert into public.kfc_customers (id, company, contact_name, email, terms_days, note)
values ('f75f42d8-b027-4f4f-9698-3210d70a3363','Sample Locksmith (Demo)','Alex Sample','alex@example.com',14,'kfc-demo')
on conflict (id) do nothing;
with sample_invoices as (
  select id from public.sales_invoices
  where notes = 'kfc-demo' and customer_id is null and status = 'verzonden'
  order by issue_date, id limit 5
)
update public.sales_invoices i set customer_id = 'f75f42d8-b027-4f4f-9698-3210d70a3363'
from sample_invoices s where i.id = s.id
and not exists (select 1 from public.kfc_customer_ledger where customer_id = 'f75f42d8-b027-4f4f-9698-3210d70a3363');
insert into public.kfc_bank_lines (iban,entry_ref,booked_on,amount_cents,counterparty_name,description,status,ignore_reason,raw)
select 'KFC-DEMO-BANK','kfc-demo-bank-' || i, current_date - i / 3,
  case when i % 3 = 0 then 3200 + i * 137 else -1200 - i * 53 end,
  case when i % 3 = 0 then 'Sample Locksmith (Demo)' else 'Sample Supplier (Demo)' end,
  'Synthetic bank statement', case when i % 3 = 0 then 'open' else 'ignored' end,
  case when i % 3 <> 0 then 'Demo outgoing movement' end,'{"source":"sample"}'::jsonb
from generate_series(0,20) i on conflict (iban,entry_ref) do nothing;
commit;
