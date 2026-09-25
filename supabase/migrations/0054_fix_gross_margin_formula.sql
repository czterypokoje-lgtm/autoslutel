-- gross_margin (0050) double-counts technician cost risk: cost_technician is
-- a freeform manual entry, while commission_amount is already trigger-
-- computed from commission_pct for the same job. The formula only read
-- cost_technician, so a job where the office never re-typed the commission
-- into cost_technician silently overstated margin by the full payout.
--
-- The revenue_callout/materials/labor/discount fields (also 0050) are
-- deliberately left OUT of this formula: the migration's own comment calls
-- them "Revenues (split)", suggesting they're meant to be an itemised
-- breakdown OF final_price, not additional revenue on top of it. Nothing
-- else in the codebase reconciles them either way. Wiring them in as
-- additive would double-count revenue on every job where both are filled in
-- -- a worse bug than the one being fixed here. That decision needs a human
-- answer, not a guess; final_price stays the only revenue source until then.
alter table public.jobs drop column if exists gross_margin;

alter table public.jobs
  add column gross_margin numeric(10,2)
  generated always as (
    coalesce(final_price, 0)
    - (
      coalesce(cost_materials, 0)
      + coalesce(cost_travel, 0)
      + coalesce(cost_payment_fee, 0)
      + coalesce(cost_other, 0)
      + coalesce(cost_technician, commission_amount, 0)
    )
  ) stored;
