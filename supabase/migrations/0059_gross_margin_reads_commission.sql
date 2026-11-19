-- ============================================================================
-- gross_margin still excludes the technician payout. 0054 tried to fix this
-- and could not, because of a default set four migrations earlier.
--
-- Run after 0058_technician_public_profile.sql. Idempotent.
--
-- 0054 wrote:
--
--     coalesce(cost_technician, commission_amount, 0)
--
-- intending "use the hand-typed cost; if nobody typed one, fall back to the
-- commission this job actually owes". coalesce returns the first NON-NULL
-- argument — and 0050 declared the column as
--
--     cost_technician numeric(10,2) default 0
--
-- so an untouched job carries 0, not null. coalesce(0, 3737.50, 0) is 0. The
-- fallback has never once been reached; it is unreachable by construction.
--
-- Measured on live data at the time of writing: 64 of 65 finished jobs have
-- cost_technician = 0 while carrying a commission_amount, and gross_margin
-- equals final_price exactly — every one of those jobs reports as pure profit.
-- Across those jobs EUR 3,737.50 of commission is missing from the margin.
-- Reported margin EUR 17,330 on EUR 17,595 of revenue: a 98.5% gross margin
-- for a business that pays subcontractors and drives vans.
--
-- nullif() is the whole fix: it turns "0 because nobody filled this in" back
-- into null so the fallback can see it. A deliberate zero still behaves — a
-- job the owner did himself has no commission_amount either, so the chain
-- still lands on 0.
-- ============================================================================

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
      /*
       * The payout, by preference in this order:
       *   1. what the office typed, when they typed something other than zero
       *   2. the commission agreed on this job
       *   3. nothing owed
       */
      + coalesce(nullif(cost_technician, 0), commission_amount, 0)
    )
  ) stored;

comment on column public.jobs.gross_margin is
  'final_price less materials, travel, payment fees, other costs and the technician payout. The payout prefers a non-zero hand-typed cost_technician, then the job''s commission_amount. nullif() is load-bearing: cost_technician defaults to 0, so a plain coalesce never reaches the commission.';
