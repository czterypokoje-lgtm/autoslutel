-- ============================================================================
-- ERP Lite: Phase 5 - Financial Reporting View
--
-- Aggregates job costing data by month for the main dashboard.
-- ============================================================================

create or replace view public.erp_report_finance_monthly as
select
  to_char(date_trunc('month', created_at), 'YYYY-MM') as month,
  count(*) as completed_jobs,
  
  -- Revenue
  sum(coalesce(final_price, 0)) as total_revenue,
  
  -- Costs
  sum(coalesce(cost_materials, 0)) as total_material_cost,
  sum(coalesce(cost_technician, 0)) as total_labor_cost,
  sum(coalesce(cost_travel, 0)) as total_travel_cost,
  sum(coalesce(cost_payment_fee, 0) + coalesce(cost_other, 0)) as total_other_costs,
  
  -- Profitability
  sum(coalesce(gross_margin, 0)) as total_gross_margin
from public.jobs
where status = 'afgerond'
group by date_trunc('month', created_at)
order by date_trunc('month', created_at) desc;

-- Grant access
grant select on public.erp_report_finance_monthly to authenticated;
grant select on public.erp_report_finance_monthly to anon;
