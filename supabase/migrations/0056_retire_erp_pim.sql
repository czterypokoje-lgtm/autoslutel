-- ============================================================================
-- CRM fase 56: de ongebruikte ERP-voorraadlaag opruimen.
--
-- Run after 0055. Idempotent.
--
-- 0048 introduced a second inventory model — inventory_products,
-- inventory_locations, inventory_levels, inventory_transactions — beside the
-- one that was already running. It was never adopted. Measured on the live
-- database: all four tables hold zero rows, inventory_transactions has never
-- had one, and `grep -rn "inventory_levels\|inventory_locations\|
-- inventory_transactions" src/` returns nothing at all.
--
-- What it did cause is real damage. A codemod (patch_vandaag_pim.js) repointed
-- the van screen's parts picker from stock_items at inventory_products. The
-- picker went empty, the van screen stopped sending stock_item_id, and
-- job_material_stock_trg (0008) — which only fires when that id is present —
-- stopped firing. Since then no stock has been deducted for any job, and
-- jobs.cost_materials has been filled on 2% of completed work. One row exists
-- in job_materials for the entire business.
--
-- stock_items keeps the work: 23 live rows, purchase prices written by
-- crm_confirm_invoice (0019) from real supplier invoices, an audit log in
-- stock_moves (0039), two SECURITY DEFINER RPCs for transfers and counts, and
-- low-stock Telegram alerts. For one warehouse and two vans,
-- `technician_id is null` already says "warehouse"; inventory_locations exists
-- to tell four location types apart and there are two.
--
-- Dropping job_materials.inventory_product_id is the load-bearing line. While
-- that column exists, the next codemod writes to it again.
--
-- expense_category is deliberately NOT dropped: different enum, and
-- /admin/uitgaven uses it.
-- ============================================================================

alter table public.job_materials drop column if exists inventory_product_id;
alter table public.job_materials drop column if exists inventory_location_id;

-- 0050 hung this on expenses for the same never-built model. Nothing reads it.
alter table public.expenses drop column if exists location_id;

drop table if exists public.inventory_transactions;
drop table if exists public.inventory_levels;
drop table if exists public.inventory_locations;
drop table if exists public.inventory_products;

drop type if exists public.inventory_transaction_reason;
drop type if exists public.inventory_location_type;
drop type if exists public.product_type_enum;

notify pgrst, 'reload schema';
