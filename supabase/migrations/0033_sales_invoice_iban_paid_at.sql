-- ============================================================================
-- CRM fase 33: IBAN op de factuur, en de datum waarop hij echt betaald werd.
--
-- Run after 0032_sales_invoices.sql. Idempotent.
--
-- Two things the classic layout needs and 0032 did not have: a bank account
-- to transfer to, and — once "betaald" stopped being a stamp across the page
-- and became a plain line of text — the date that belongs on that line.
-- paid_at is set once, the moment the status first becomes betaald, and
-- cleared if it is ever moved back off betaald; it is never touched by an
-- ordinary edit of the invoice's own content.
-- ============================================================================

alter table public.sales_invoices
  add column if not exists biller_iban text,
  add column if not exists paid_at timestamptz;

notify pgrst, 'reload schema';
