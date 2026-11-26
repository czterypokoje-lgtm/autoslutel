-- Expenses from a photo or PDF (2026-11-26): the reader fills supplier,
-- amount, date and category; the text it read is kept so a bon can be found
-- back by anything printed on it, not only by the one-line description.
alter table public.expenses add column if not exists invoice_number text;
alter table public.expenses add column if not exists receipt_text  text;
create index if not exists expenses_search_idx on public.expenses
  using gin (to_tsvector('simple', coalesce(description, '') || ' ' || coalesce(supplier_name, '') || ' ' || coalesce(invoice_number, '') || ' ' || coalesce(receipt_text, '')));
notify pgrst, 'reload schema';
