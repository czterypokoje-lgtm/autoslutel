-- ============================================================================
-- CRM fase 34: een lead-kwaliteitssignaal Google Ads daadwerkelijk kan leren.
--
-- Run after 0033_sales_invoice_iban_paid_at.sql. Idempotent.
--
-- The offline-conversions tool (src/app/offline-conversions/page.tsx) treated
-- every lead with a gclid as a positive "Job Completed" conversion — spam,
-- duplicates, a wrong number typed into the phone field, all counted the
-- same as a real sale. Smart Bidding cannot tell a good click from a bad one
-- unless something tells it, and nothing did.
--
-- Two small additions make that possible:
--   - a `spam` status, distinct from the general-purpose `rejected` (a lead
--     can be legitimately rejected for reasons that say nothing about the ad
--     click itself — out of area, price too high — spam specifically means
--     "this click should never have counted as a conversion at all")
--   - `exported_at`, so a lead already reported to Google Ads is never
--     reported a second time on the next export run
-- ============================================================================

do $$
begin
  if exists (select 1 from pg_constraint where conname = 'leads_status_check') then
    alter table public.leads drop constraint leads_status_check;
  end if;
  alter table public.leads
    add constraint leads_status_check
    check (status in ('new','qualified','contacted','sold','rejected','duplicate','spam'));
end $$;

alter table public.leads
  add column if not exists exported_at timestamptz;

create index if not exists leads_export_idx on public.leads (status, exported_at) where gclid is not null or wbraid is not null or gbraid is not null;

notify pgrst, 'reload schema';
