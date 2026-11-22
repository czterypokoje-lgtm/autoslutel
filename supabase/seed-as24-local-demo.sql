-- ============================================================================
-- Autosleutel24 local demo: fills the screens seed-kfc-demo.sql leaves empty.
--
-- ONLY for the local test database (autosleutel-test). Never production.
-- Run AFTER seed-kfc-demo.sql (it reuses its technicians and jobs).
-- Every person, phone number and address is invented. Rows are marked
-- 'as24-demo' (or "(demo)") and deleted first, so it is safe to run again.
-- ============================================================================

begin;

-- Cleanup of earlier runs -----------------------------------------------------
delete from public.technician_ledger where note = 'as24-demo'
   or payment_id in (select id from public.job_payments where note = 'as24-demo');
delete from public.job_payments where note = 'as24-demo';
delete from public.job_offers where reason = 'as24-demo';
delete from public.job_materials where description like '%(demo)';
delete from public.technician_coverage where note = 'as24-demo';
delete from public.technician_tools where note = 'as24-demo';
delete from public.dispatch_pricing where note = 'as24-demo';
delete from public.payout_requests where notes = 'as24-demo';
delete from public.part_orders where note = 'as24-demo';
delete from public.stock_moves where description like '%(demo)';
delete from public.stock_items where description like '%(demo)';
delete from public.kfc_stock_moves where idempotency_key like 'as24-demo-%';
delete from public.kfc_shop_order_lines where order_id in (select id from public.kfc_shop_orders where raw->>'demo' = 'as24');
delete from public.kfc_shop_orders where raw->>'demo' = 'as24';
delete from public.kfc_purchase_order_lines where po_id in (select id from public.kfc_purchase_orders where note = 'as24-demo');
delete from public.kfc_purchase_orders where note = 'as24-demo';
delete from public.kfc_stock_levels where location_id in (select id from public.kfc_locations where warehouse = 'demo');
delete from public.kfc_locations where warehouse = 'demo';
delete from public.inbox_messages where thread_id in (select id from public.inbox_threads where external_ref like 'as24-demo-%');
delete from public.inbox_threads where external_ref like 'as24-demo-%';
delete from public.whatsapp_quotes where source_key like 'as24-demo-%';
delete from public.whatsapp_ad_reviews where ref like 'as24-demo-%';
delete from public.marketplace_listings where description like '%(demo)';
delete from public.chat_messages where content like '%(demo)';

-- Technicians: service area, prices and tools ----------------------------------
update public.technicians set werkgebied = '{3000-3099,3100-3199,2900-2999}'::text[]
 where contact_email like '%@demo.keyforcars.invalid' and name like 'Emre%';
update public.technicians set werkgebied = '{3000-3099,2600-2699,2700-2799}'::text[]
 where contact_email like '%@demo.keyforcars.invalid' and name like 'Joost%';

insert into public.technician_coverage (technician_id, make, model, scenario, from_year, to_year, keyless, price, note)
select t.id, c.make, c.model, c.scenario::public.job_scenario, c.fy, c.ty, c.keyless, c.price, 'as24-demo'
from public.technicians t
cross join (values
  ('Volkswagen', null, 'bijmaken', 2005, 2020, false, 95),
  ('Volkswagen', 'Golf', 'alle_sleutels_kwijt', 2008, 2019, false, 185),
  ('Renault', null, 'bijmaken', 2004, 2022, true, 120),
  ('Peugeot', null, 'bijmaken', 2006, 2021, false, 90),
  ('Toyota', 'Aygo', 'alle_sleutels_kwijt', 2005, 2021, false, 160),
  ('Opel', null, 'reparatie', 2000, 2018, false, 45),
  ('Ford', null, 'bijmaken', 2008, 2022, false, 95),
  ('BMW', null, 'bijmaken', 2007, 2018, true, 175),
  ('Mercedes-Benz', null, 'slot', 2005, 2016, false, 140)
) as c(make, model, scenario, fy, ty, keyless, price)
where t.contact_email like '%@demo.keyforcars.invalid';

insert into public.technician_tools (technician_id, brand, model, note)
select t.id, x.brand, x.model, 'as24-demo'
from public.technicians t
cross join (values ('Autel', 'IM608 Pro II'), ('Xhorse', 'VVDI Key Tool Plus'), ('Xhorse', 'Dolphin XP-005')) as x(brand, model)
where t.contact_email like '%@demo.keyforcars.invalid';

-- Rates: the customer price list ----------------------------------------------
insert into public.dispatch_pricing (make, model, scenario, from_year, to_year, keyless, price, note) values
  ('Volkswagen', null, 'bijmaken', 2005, 2020, false, 149, 'as24-demo'),
  ('Volkswagen', 'Golf', 'alle_sleutels_kwijt', 2008, 2019, false, 279, 'as24-demo'),
  ('Volkswagen', 'Polo', 'bijmaken', 2009, 2021, false, 139, 'as24-demo'),
  ('Renault', null, 'bijmaken', 2004, 2022, true, 179, 'as24-demo'),
  ('Renault', 'Clio', 'reparatie', 2005, 2019, false, 69, 'as24-demo'),
  ('Peugeot', null, 'bijmaken', 2006, 2021, false, 135, 'as24-demo'),
  ('Peugeot', '208', 'alle_sleutels_kwijt', 2012, 2022, false, 249, 'as24-demo'),
  ('Toyota', 'Aygo', 'bijmaken', 2005, 2021, false, 129, 'as24-demo'),
  ('Toyota', null, 'alle_sleutels_kwijt', 2008, 2022, true, 299, 'as24-demo'),
  ('Opel', null, 'reparatie', 2000, 2018, false, 59, 'as24-demo'),
  ('Ford', 'Fiesta', 'bijmaken', 2008, 2022, false, 145, 'as24-demo'),
  ('BMW', null, 'bijmaken', 2007, 2018, true, 249, 'as24-demo'),
  ('Mercedes-Benz', null, 'slot', 2005, 2016, false, 219, 'as24-demo'),
  ('Kia', null, 'bijmaken', 2010, 2022, false, 139, 'as24-demo'),
  ('Fiat', 'Punto', 'reparatie', 2003, 2018, false, 55, 'as24-demo');

-- Payments on completed jobs (cash/card books itself into the technician ledger) --
insert into public.job_payments (job_id, amount, method, paid_at, note, status)
select j.id, coalesce(j.final_price, j.quoted_price, 149),
  (array['contant','pin','ideal','tikkie','pin','factuur'])[1 + (row_number() over (order by j.completed_at, j.id))::int % 6],
  coalesce(j.completed_at, now()), 'as24-demo', 'betaald'::public.payment_state
from public.jobs j
where j.status = 'afgerond' and j.notes like 'kfc-demo%';

-- Earnings, a hand-over and a payout so Cash and payouts has a story -------------
insert into public.technician_ledger (technician_id, job_id, entry_type, amount, occurred_at, note)
select j.technician_id, j.id, 'verdienste', round(coalesce(j.final_price, j.quoted_price, 149) * 0.6, 2), coalesce(j.completed_at, now()), 'as24-demo'
from public.jobs j where j.status = 'afgerond' and j.notes like 'kfc-demo%' and j.technician_id is not null;

insert into public.technician_ledger (technician_id, entry_type, amount, occurred_at, note)
select t.id, x.entry_type, x.amount, now() - x.ago, 'as24-demo'
from public.technicians t
cross join (values ('afdracht', 450.00, interval '6 days'), ('uitbetaling', 800.00, interval '3 days')) as x(entry_type, amount, ago)
where t.contact_email like '%@demo.keyforcars.invalid';

insert into public.payout_requests (technician_id, amount, status, created_at, notes)
select id, 350, 'pending'::public.payout_status, now() - interval '1 day', 'as24-demo'
from public.technicians where contact_email like '%@demo.keyforcars.invalid' and name like 'Joost%';

-- Materials used on completed jobs ---------------------------------------------
insert into public.job_materials (job_id, description, quantity, unit_cost)
select j.id,
  (array['Klapsleutel behuizing 3 knoppen (demo)','Transponderchip ID48 (demo)','Smart key 433 MHz (demo)','Batterij CR2032 (demo)'])[1 + (row_number() over (order by j.id))::int % 4],
  1, (array[8.50, 6.00, 42.00, 1.20])[1 + (row_number() over (order by j.id))::int % 4]
from public.jobs j where j.status = 'afgerond' and j.notes like 'kfc-demo%';

-- Offers and bids (Offers / Bids screens) ----------------------------------------
-- An offer only makes sense on a job nobody has yet: the Offers page hides offers
-- whose job already has a technician. So the four latest planned demo jobs are
-- left unassigned, offered to both technicians, and half of them carry a bid
-- (awaiting the office's award). Nobody has accepted, so no response is set.
update public.jobs set technician_id = null
 where id in (select id from public.jobs where status = 'gepland' and notes like 'kfc-demo%' order by scheduled_date desc, id limit 4);

insert into public.job_offers (job_id, technician_id, rank, score, reason, offered_at, expires_at, responded_at, response, bid_price, bid_date, bid_start, bid_end, bid_at)
select j.id, t.id, t.rk, 0.9 - t.rk * 0.1, 'as24-demo', now() - interval '2 hours', now() + interval '1 day',
  case when j.rn % 2 = 0 then now() - interval '1 hour' end,
  null,
  case when j.rn % 2 = 0 then 80 + t.rk * 15 + j.rn * 5 end,
  case when j.rn % 2 = 0 then j.scheduled_date end,
  case when j.rn % 2 = 0 then time '09:00' end,
  case when j.rn % 2 = 0 then time '12:00' end,
  case when j.rn % 2 = 0 then now() - interval '1 hour' end
from (select id, scheduled_date, row_number() over (order by scheduled_date desc, id) rn
        from public.jobs where status = 'gepland' and notes like 'kfc-demo%' order by scheduled_date desc, id limit 4) j
cross join (select id, row_number() over (order by name) rk from public.technicians where contact_email like '%@demo.keyforcars.invalid') t;

-- Warehouse and vans (store + technicians' vans) --------------------------------
insert into public.stock_items (technician_id, description, quantity, min_quantity, unit_cost, category)
select t.id, x.description, x.qty, x.minq, x.cost, x.cat
from (select id from public.technicians where contact_email like '%@demo.keyforcars.invalid'
      union all select null) t
cross join (values
  ('Klapsleutel VW 3 knoppen (demo)', 6, 2, 9.50, 'sleutels'),
  ('Smart key Renault kaart (demo)', 2, 2, 38.00, 'sleutels'),
  ('Behuizing Peugeot 2 knoppen (demo)', 8, 3, 4.20, 'behuizingen'),
  ('Sleutelbaard HU66 (demo)', 12, 5, 2.10, 'sleutelbaarden'),
  ('Transponderchip ID46 (demo)', 1, 4, 5.50, 'elektronica'),
  ('Batterij CR2032 (demo)', 30, 10, 0.60, 'batterijen')
) as x(description, qty, minq, cost, cat);

insert into public.stock_moves (stock_item_id, technician_id, description, delta, quantity_after, unit_cost, reason, changed_at)
select s.id, s.technician_id, s.description, s.quantity, s.quantity, s.unit_cost, 'ontvangst', now() - interval '10 days'
from public.stock_items s where s.description like '%(demo)';

insert into public.part_orders (technician_id, description, article_code, unit_cost, quantity, note, status, created_at)
select t.id, x.description, x.code, x.cost, x.qty, 'as24-demo', x.status::public.part_order_status, now() - x.ago
from public.technicians t
cross join (values
  ('Smart key BMW 868 MHz', 'BMW-SK868', 49.00, 2, 'aangevraagd', interval '5 hours'),
  ('Klapsleutel behuizing Opel', 'OPEL-HB2', 4.50, 5, 'besteld', interval '2 days'),
  ('Transponder ID48 glas', 'ID48-G', 3.80, 10, 'geleverd', interval '6 days')
) as x(description, code, cost, qty, status, ago)
where t.contact_email like '%@demo.keyforcars.invalid' and t.name like 'Joost%';

-- Central warehouse: shelves, counted stock and movements ------------------------
insert into public.kfc_locations (warehouse, shelf, box, kind) values
  ('demo', 'A-01', '01', 'shelf'), ('demo', 'A-01', '02', 'shelf'),
  ('demo', 'A-02', '01', 'shelf'), ('demo', 'B-01', '01', 'shelf');

insert into public.kfc_stock_levels (article_code, location_id, quantity, minimum, last_counted_at)
select a.code, l.id, (a.rn * 7) % 13, 2, now() - (a.rn || ' days')::interval
from (select code, row_number() over (order by code) rn from public.kfc_articles where status is distinct from 'archived' order by code limit 40) a
join (select id, row_number() over (order by shelf, box) - 1 lrn from public.kfc_locations where warehouse = 'demo') l on l.lrn = a.rn % 4;

insert into public.kfc_stock_moves (article_code, location_id, delta, quantity_after, reason, note, created_at, idempotency_key)
select s.article_code, s.location_id, s.quantity, s.quantity, 'count', 'Telling (demo)', s.last_counted_at, 'as24-demo-count-' || s.article_code
from public.kfc_stock_levels s join public.kfc_locations l on l.id = s.location_id and l.warehouse = 'demo';

insert into public.kfc_stock_moves (article_code, location_id, delta, reason, note, created_at, idempotency_key)
select s.article_code, s.location_id, -1, 'sale', 'Verkoop aan de balie (demo)', now() - ((row_number() over (order by s.article_code)) || ' hours')::interval, 'as24-demo-sale-' || s.article_code
from public.kfc_stock_levels s join public.kfc_locations l on l.id = s.location_id and l.warehouse = 'demo'
where s.quantity > 3;

-- Webshop orders: pick list, shipping and webshop margin --------------------------
insert into public.kfc_shop_orders (shop, woo_order_id, number, status, created_at, modified_at, paid_at, currency, country,
  total_incl_cents, total_excl_cents, shipping_incl_cents, tax_cents, fulfilment, shipped_at, raw,
  ship_name, ship_street, ship_postcode, ship_city, ship_phone, ship_email, carrier, tracking_code)
select o.shop, 990000 + o.n, 'AS' || (5100 + o.n), o.status, now() - (o.n * 9 || ' hours')::interval, now(),
  case when o.status <> 'pending' then now() - (o.n * 9 || ' hours')::interval end, 'EUR', 'NL',
  0, 0, 595, 0, o.fulfilment, case when o.fulfilment = 'shipped' then now() - interval '1 day' end, '{"demo":"as24"}'::jsonb,
  o.name, o.street, o.postcode, o.city, '0612349' || lpad(o.n::text, 3, '0'), 'klant' || o.n || '@demo.as24.invalid',
  case when o.fulfilment = 'shipped' then 'postnl' end, case when o.fulfilment = 'shipped' then '3SDEMO' || o.n end
from (values
  (1, 'autosleutel24.nl', 'processing', 'open', 'Sanne de Vries', 'Kerkstraat 12', '3011 AB', 'Rotterdam'),
  (2, 'autosleutel24.nl', 'processing', 'open', 'Mohamed El Amrani', 'Laan van Meerdervoort 210', '2563 AE', 'Den Haag'),
  (3, 'klapsleutels.nl', 'processing', 'open', 'Peter Jansen', 'Dorpsweg 4', '3083 AA', 'Rotterdam'),
  (4, 'remkeys.com', 'processing', 'open', 'Lisa Bakker', 'Oudegracht 88', '3511 AV', 'Utrecht'),
  (5, 'keyforcars.nl', 'processing', 'picked', 'Kevin Visser', 'Stationsplein 1', '2011 LR', 'Haarlem'),
  (6, 'autosleutel24.nl', 'completed', 'shipped', 'Fatima Ouali', 'Molenstraat 5', '1011 AA', 'Amsterdam'),
  (7, 'klapsleutels.nl', 'completed', 'shipped', 'Tom Smit', 'Markt 3', '5211 JV', 's-Hertogenbosch'),
  (8, 'autosleutel24.nl', 'cancelled', 'cancelled', 'Anouk Meijer', 'Havenweg 17', '1781 AA', 'Den Helder')
) as o(n, shop, status, fulfilment, name, street, postcode, city);

insert into public.kfc_shop_order_lines (order_id, woo_line_id, sku, article_code, name, quantity, unit_incl_cents, total_excl_cents, state)
select o.id, 880000 + o.woo_order_id - 990000 + a.k * 100, a.sku, a.code, a.name, a.k,
  coalesce(a.sale_price_cents, 1995), round(coalesce(a.sale_price_cents, 1995) * a.k / 1.21),
  case o.fulfilment when 'shipped' then 'shipped' when 'picked' then 'picked' when 'cancelled' then 'cancelled' else 'open' end
from public.kfc_shop_orders o
cross join lateral (
  select code, sku, name, sale_price_cents, k from (
    select code, sku, name, sale_price_cents, row_number() over (order by code) k
      from public.kfc_articles where sale_price_cents is not null
     order by code offset (o.woo_order_id - 990000) * 3 limit 2) x
) a
where o.raw->>'demo' = 'as24';

update public.kfc_shop_orders o set
  total_excl_cents = l.excl, tax_cents = round(l.excl * 0.21), total_incl_cents = l.excl + round(l.excl * 0.21) + o.shipping_incl_cents
from (select order_id, sum(total_excl_cents)::int excl from public.kfc_shop_order_lines group by order_id) l
where l.order_id = o.id and o.raw->>'demo' = 'as24';

-- Purchasing: one draft, one on order ------------------------------------------
insert into public.kfc_purchase_orders (supplier, status, expected_on, note, created_at, ordered_at) values
  ('A-Key (demo)', 'ordered', current_date + 3, 'as24-demo', now() - interval '2 days', now() - interval '2 days'),
  ('KeyDIY Europe (demo)', 'draft', null, 'as24-demo', now() - interval '3 hours', null);

insert into public.kfc_purchase_order_lines (po_id, article_code, quantity, received, unit_cost_cents)
select p.id, a.code, 5 + a.rn, 0, 350 + a.rn * 120
from public.kfc_purchase_orders p
cross join lateral (select code, row_number() over (order by code) rn from public.kfc_articles order by code offset 50 limit 4) a
where p.note = 'as24-demo';

-- Conversations: the new inbox (WhatsApp, e-mail, form) --------------------------
insert into public.inbox_threads (channel, phone, email, name, subject, status, ai_mode, last_message_at, last_inbound_at, last_outbound_at, unread, external_ref)
values
  ('whatsapp', '+31612345101', null, 'Bram de Groot', null, 'open', 'draft', now() - interval '12 minutes', now() - interval '12 minutes', now() - interval '40 minutes', 2, 'as24-demo-1'),
  ('whatsapp', '+31612345102', null, 'Nina Bos', null, 'open', 'off', now() - interval '2 hours', now() - interval '2 hours', now() - interval '3 hours', 1, 'as24-demo-2'),
  ('email', null, 'dennis.vos@demo.as24.invalid', 'Dennis Vos', 'Offerte reservesleutel Toyota Aygo', 'open', 'draft', now() - interval '5 hours', now() - interval '5 hours', null, 1, 'as24-demo-3'),
  ('form', '+31612345104', 'sophie@demo.as24.invalid', 'Sophie Peters', 'Alle sleutels kwijt - Peugeot 208', 'open', 'off', now() - interval '1 day', now() - interval '1 day', now() - interval '20 hours', 0, 'as24-demo-4'),
  ('whatsapp', '+31612345105', null, 'Hakan Yilmaz', null, 'closed', 'auto', now() - interval '3 days', now() - interval '3 days', now() - interval '3 days', 0, 'as24-demo-5');

insert into public.inbox_messages (thread_id, direction, author, body, status, created_at)
select t.id, m.dir, m.author, m.body, m.status, now() - m.ago
from public.inbox_threads t
join (values
  ('as24-demo-1', 'in',  'customer',  'Hoi, ik ben de sleutel van mijn VW Golf 2014 kwijt. Kunnen jullie vandaag nog komen?', 'received', interval '50 minutes'),
  ('as24-demo-1', 'out', 'kantoor',   'Goedemiddag Bram! Dat kan. Voor alle sleutels kwijt bij een Golf 2014 rekenen we € 279 all-in. Wat is je postcode?', 'read', interval '40 minutes'),
  ('as24-demo-1', 'in',  'customer',  '3012 KL Rotterdam. Hoe laat ongeveer?', 'received', interval '15 minutes'),
  ('as24-demo-1', 'in',  'customer',  'En kan ik pinnen?', 'received', interval '12 minutes'),
  ('as24-demo-2', 'in',  'customer',  'Mijn Renault kaart doet het niet meer, wat kost een nieuwe?', 'received', interval '3 hours 10 minutes'),
  ('as24-demo-2', 'out', 'kantoor',   'Een nieuwe Renault sleutelkaart inclusief programmeren is € 179. Wil je een afspraak?', 'delivered', interval '3 hours'),
  ('as24-demo-2', 'in',  'customer',  'Ik denk er even over na, bedankt!', 'received', interval '2 hours'),
  ('as24-demo-3', 'in',  'customer',  'Goedendag, wat kost een reservesleutel voor een Toyota Aygo uit 2016? Groet, Dennis', 'received', interval '5 hours'),
  ('as24-demo-4', 'in',  'customer',  'Formulier: alle sleutels kwijt, Peugeot 208 (2018), Utrecht. Graag terugbellen.', 'received', interval '1 day'),
  ('as24-demo-4', 'out', 'kantoor',   'Gebeld en ingepland voor morgen 10:00-12:00.', 'sent', interval '20 hours'),
  ('as24-demo-5', 'in',  'customer',  'Kunnen jullie een motorsleutel bijmaken?', 'received', interval '3 days 1 hour'),
  ('as24-demo-5', 'out', 'assistant', 'Ja, dat kan! Een motorsleutel bijmaken kost vanaf € 79. Stuur gerust een foto van je sleutel.', 'read', interval '3 days')
) as m(ref, dir, author, body, status, ago) on m.ref = t.external_ref;

-- WhatsApp analysis: price questions and their outcome ---------------------------
insert into public.whatsapp_quotes (source_key, chat_jid, phone, contact_name, ask_message_id, asked_at, quoted_at, make, model, year, scenario, problem,
  keyless, city, urgency, price_amount, price_kind, price_vat, outcome, lost_reason, price_objection, we_followed_up, source, confidence, extracted_by, extracted_at)
select 'as24-demo-q' || q.n, '3161234' || (5200 + q.n) || '@s.whatsapp.net', '+3161234' || (5200 + q.n), q.name, 'as24-demo-ask-' || q.n,
  now() - (q.n || ' days')::interval, now() - (q.n || ' days')::interval + (q.reply || ' minutes')::interval,
  q.make, q.model, q.year, q.scenario::public.job_scenario, q.problem, q.keyless, q.city, q.urgency, q.price, 'vast', 'incl',
  q.outcome, q.lost, coalesce(q.lost = 'prijs', false), q.outcome <> 'geen_reactie', (array['google','advertentie','website','terugkerende_klant','marktplaats'])[1 + q.n % 5], 0.9, 'demo', now()
from (values
  (1,  'Iris Hendriks',   'Volkswagen', 'Golf',     2015, 'alle_sleutels_kwijt', 'Alle sleutels kwijt', false, 'Rotterdam', 'vandaag',   279, 'gewonnen',     null,   6),
  (2,  'Marco van Dijk',  'Renault',    'Clio',     2017, 'bijmaken',            'Reservesleutel kaart', true, 'Den Haag',  'deze_week', 179, 'verloren',     'prijs', 14),
  (3,  'Lotte Dekker',    'Toyota',     'Aygo',     2012, 'bijmaken',            'Reservesleutel',       false, 'Utrecht',  'later',     129, 'gewonnen',     null,   4),
  (4,  'Stefan Brouwer',  'Peugeot',    '208',      2019, 'alle_sleutels_kwijt', 'Sleutel kwijt',        false, 'Delft',    'nu',        249, 'geen_reactie', null,  22),
  (5,  'Noor van den Berg','Opel',      'Corsa',    2010, 'reparatie',           'Behuizing kapot',      false, 'Rotterdam','deze_week',  59, 'gewonnen',     null,   3),
  (6,  'Rik Kok',         'BMW',        '3-serie',  2014, 'bijmaken',            'Extra sleutel',        true,  'Amsterdam','later',     249, 'verloren',     'prijs', 35),
  (7,  'Esra Demir',      'Ford',       'Fiesta',   2016, 'bijmaken',            'Reservesleutel',       false, 'Schiedam', 'vandaag',   145, 'gewonnen',     null,   5),
  (8,  'Jasper Mulder',   'Mercedes-Benz','A-Klasse',2011,'slot',                'Contactslot draait niet', false, 'Gouda', 'nu',        219, 'onbekend',     null,  11),
  (9,  'Yasmin Kaya',     'Kia',        'Picanto',  2018, 'bijmaken',            'Reservesleutel',       false, 'Zoetermeer','deze_week',139, 'gewonnen',     null,   7),
  (10, 'Tom Smit',        'Fiat',       'Punto',    2009, 'reparatie',           'Knopjes kapot',        false, 'Rotterdam','later',      55, 'geen_reactie', null,  48)
) as q(n, name, make, model, year, scenario, problem, keyless, city, urgency, price, outcome, lost, reply);

insert into public.whatsapp_ad_reviews (ref, phone_end, chat_at, ai_result, car, price_note, decision, value, work_date) values
  ('as24-demo-ad1', '5101', now() - interval '1 day', 'Afspraak gemaakt', 'VW Golf 2015', '€ 279 all-in', 'gedaan', 279, current_date - 1),
  ('as24-demo-ad2', '5102', now() - interval '2 days', 'Prijs gevraagd, geen afspraak', 'Renault Clio 2017', '€ 179', 'geen_job', null, null),
  ('as24-demo-ad3', '5103', now() - interval '3 days', 'Afspraak gemaakt', 'Toyota Aygo 2012', '€ 129', 'gedaan', 129, current_date - 2),
  ('as24-demo-ad4', '5104', now() - interval '5 hours', 'Nog te beoordelen', 'Peugeot 208 2019', '€ 249', null, null, null);

-- Network: a few messages and marketplace listings -------------------------------
insert into public.chat_messages (channel_id, technician_id, content, created_at)
select c.id, t.id, m.body, now() - m.ago
from public.chat_channels c
join (values
  ('Algemeen',  'Joost', 'Goedemorgen allemaal, wie heeft er vandaag ruimte in regio Delft? (demo)', interval '3 hours'),
  ('Algemeen',  'Emre',  'Ik kan vanaf 14:00, stuur maar door. (demo)', interval '2 hours 40 minutes'),
  ('Vraagbaak', 'Joost', 'Iemand ervaring met een Golf 7 waar de IMMO niet wil leren via OBD? (demo)', interval '1 day'),
  ('Vraagbaak', 'Emre',  'Ja, eerst de EEPROM uitlezen, daarna lukt het meestal wel. (demo)', interval '23 hours')
) as m(channel, who, body, ago) on m.channel = c.name
join public.technicians t on t.name like m.who || '%' and t.contact_email like '%@demo.keyforcars.invalid';

insert into public.marketplace_listings (technician_id, posted_by, title, description, price, status, created_at)
select t.id, (select id from auth.users where email = 'owner@autosleutel.test'), x.title, x.descr, x.price, x.status, now() - x.ago
from public.technicians t
cross join (values
  ('Autel IM508 met XP400', 'Goed werkend, update tot 2025. (demo)', 650, 'available', interval '2 days'),
  ('Xhorse Condor XC-Mini', 'Freesmachine, weinig gebruikt. (demo)', 1100, 'available', interval '5 days'),
  ('Doos transponderchips ID46', 'Ca. 40 stuks, nieuw. (demo)', 60, 'sold', interval '9 days')
) as x(title, descr, price, status, ago)
where t.contact_email like '%@demo.keyforcars.invalid' and t.name like 'Joost%';

commit;
