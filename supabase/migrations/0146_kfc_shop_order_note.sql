-- A note on a webshop order, the way Autosleutel24's own orders have one.
--
-- KeyForCars's orders arrive from WooCommerce, which carries no field for
-- what the office needs to remember — "sleutelcode nagevraagd", "klant belt
-- terug", "wacht op levering". One text column, written in the CRM, shown in
-- the order list so it is readable without opening the order.
alter table public.kfc_shop_orders add column if not exists note text;
notify pgrst, 'reload schema';
