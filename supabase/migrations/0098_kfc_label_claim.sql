-- 0098: one paid parcel per order, ever.
--
-- createLabel was check-then-act: it read the order, saw no label, and called
-- Sendcloud. Two clicks (or the pick board's loop running twice) both passed
-- the read and both bought a parcel. `label_claimed_at` is the claim — set
-- with a conditional update, so exactly one caller wins and the loser gets a
-- 409 instead of a second invoice from Sendcloud.
--
-- `sendcloud_parcel_id` is the proof a parcel exists. label_url was the old
-- proof and it lies: Sendcloud can answer without a label URL, which stored
-- '' and let the next run buy another parcel. Idempotent.
alter table public.kfc_shop_orders
  add column if not exists label_claimed_at    timestamptz,
  add column if not exists sendcloud_parcel_id text;

-- A parcel id belongs to one order: a duplicate here means the claim leaked.
create unique index if not exists kfc_shop_orders_parcel_idx
  on public.kfc_shop_orders (sendcloud_parcel_id)
  where sendcloud_parcel_id is not null;

notify pgrst, 'reload schema';
