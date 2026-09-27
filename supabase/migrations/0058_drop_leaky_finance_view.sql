-- ============================================================================
-- CRM fase 58: erp_report_finance_monthly opruimen.
--
-- Run after 0057_job_travel_and_margin.sql. Idempotent.
--
-- Two reasons, either of which would be enough.
--
-- 1. It leaks. Every other reporting view in this database (the sixteen
--    crm_* ones, 0006 and 0036) carries `where public.crm_visible()` and is
--    created with `security_invoker = true`, and none is granted to anon.
--    This one has neither guard and was granted to BOTH authenticated and
--    anon (0052:29-30) — so the monthly revenue, cost and margin of the
--    business were readable by anyone holding the public anon key, which is
--    shipped to every browser that loads the website.
--
-- 2. It does not agree with itself. total_labor_cost sums the raw
--    cost_technician column while total_gross_margin sums gross_margin,
--    which until 0057 fell back to commission_amount. Whenever
--    cost_technician was null — 98% of finished jobs — revenue minus the
--    view's own four cost columns did not equal the view's own margin.
--
-- Fixing both would take four changes and leave a view that duplicates
-- /admin/winst, which now groups the same rows by month with a date filter
-- the view cannot have. Deleting is less code and strictly safer.
--
-- The only consumer was src/app/admin/rapportage/page.tsx, removed in the
-- same commit.
-- ============================================================================

drop view if exists public.erp_report_finance_monthly;

notify pgrst, 'reload schema';
