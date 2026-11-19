-- 0096: a confirmed supplier-invoice line sets the article's purchase price
-- (KeyForCars install). The existing upload flow (/api/admin/invoice) stores
-- the file, reads a PDF or spreadsheet into lines, and the office confirms
-- them. Confirming never writes stock here (goods received does that, 0090);
-- it only sets the price the margin and the stock value read. Matches on the
-- line's article_code against kfc_articles.code or sku. No-op on an install
-- without kfc_articles rows. Idempotent.
create or replace function public.kfc_price_from_invoice_line() returns trigger language plpgsql as $$
declare v_code text;
begin
  if new.confirmed and new.unit_price is not null and new.article_code is not null then
    select code into v_code from public.kfc_articles where code = new.article_code or upper(sku) = upper(new.article_code) limit 1;
    if v_code is not null then
      update public.kfc_articles set purchase_price_cents = round(new.unit_price * 100)::integer, updated_at = now() where code = v_code;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists kfc_price_from_invoice_line on public.purchase_invoice_lines;
create trigger kfc_price_from_invoice_line after insert or update of confirmed, unit_price on public.purchase_invoice_lines
  for each row execute function public.kfc_price_from_invoice_line();
