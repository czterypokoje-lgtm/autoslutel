-- 0111: a purchase order can carry the supplier's invoice number and the
-- invoice or receipt itself (PDF or photo), so receiving can be checked against
-- the paper and the cost has a source (spec P1-B: "belge fotoğrafı/PDF,
-- tedarikçi, fatura referansı").
--
-- The file lives where the stock photos live (local-data/ locally, the private
-- kfc-stock-photos bucket in production); the row only keeps its name and type.
-- Additive and idempotent: three nullable columns, nothing else changes.

alter table public.kfc_purchase_orders add column if not exists invoice_ref   text;
alter table public.kfc_purchase_orders add column if not exists document_path text;
alter table public.kfc_purchase_orders add column if not exists document_type text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'kfc_purchase_orders_invoice_ref_len') then
    alter table public.kfc_purchase_orders add constraint kfc_purchase_orders_invoice_ref_len check (invoice_ref is null or length(invoice_ref) <= 80);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'kfc_purchase_orders_document_type_check') then
    alter table public.kfc_purchase_orders add constraint kfc_purchase_orders_document_type_check
      check (document_type is null or document_type in ('application/pdf', 'image/jpeg', 'image/png'));
  end if;
end $$;
