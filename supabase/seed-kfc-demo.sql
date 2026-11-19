-- ============================================================================
-- KeyForCars preview: fictional sample data for the office CRM screens.
--
-- ONLY for the preview database (local or the KeyForCars preview project).
-- Never run this against Autosleutel24's database. Every person, phone number
-- and address below is invented; phone numbers use the 06-1234xxxx test range.
--
-- Safe to run again: it deletes its own rows first (all marked as demo).
-- Dates are relative to now(), so the dashboard is always "this week".
-- ============================================================================

begin;

delete from public.sales_invoice_lines where invoice_id in (select id from public.sales_invoices where notes = 'kfc-demo');
delete from public.sales_invoices where notes = 'kfc-demo';
delete from public.expenses where supplier_name like '%(demo)';
delete from public.agent_conversations where conversation_id like 'kfc-demo-%';
delete from public.call_clicks where ref like 'kfc-demo-%';
delete from public.ad_visits where path like '/kfc-demo/%';
delete from public.jobs where notes like 'kfc-demo%';
delete from public.lead_notes where author_email = 'demo@keyforcars.invalid';
delete from public.leads where email like '%@demo.keyforcars.invalid';
delete from public.technicians where contact_email like '%@demo.keyforcars.invalid';
delete from public.crm_marketing_costs where source like 'kfc-demo%';
delete from public.ad_campaigns where note = 'kfc-demo';

-- Staff who do the programming and fitting work -------------------------------
insert into public.technicians (name, phone, active, color, employment_type, base_city, contact_email, verified)
values
  ('Emre (werkplaats)', '0612340001', true, '#c2410c', 'loondienst', 'Rotterdam', 'emre@demo.keyforcars.invalid', true),
  ('Joost (op locatie)', '0612340002', true, '#2563eb', 'loondienst', 'Rotterdam', 'joost@demo.keyforcars.invalid', true);

-- Ad campaigns ------------------------------------------------------------------
insert into public.ad_campaigns (campaign_id, name, network, note) values
  ('kfc-c1', 'Klapsleutels – Zoeken', 'google', 'kfc-demo'),
  ('kfc-c2', 'Afstandsbediening programmeren', 'google', 'kfc-demo'),
  ('kfc-c3', 'Shopping – alle sleutels', 'google', 'kfc-demo');

-- Leads: 30 days, roughly 5 a day -------------------------------------------------
with names as (
  select name, i::int from unnest(array[
    'Sanne de Vries','Mohamed El Amrani','Peter Jansen','Lisa Bakker','Kevin Visser','Fatima Ouali',
    'Tom Smit','Anouk Meijer','Ricardo Silva','Eva de Boer','Jasper Mulder','Yasmin Kaya',
    'Bram de Groot','Nina Bos','Dennis Vos','Sophie Peters','Hakan Yilmaz','Iris Hendriks',
    'Marco van Dijk','Lotte Dekker','Stefan Brouwer','Noor van den Berg','Rik Kok','Esra Demir'
  ]) with ordinality as t(name, i)
),
cars(i, brand, model, service) as (
  values
    (1, 'Volkswagen', 'Golf', 'Klapsleutel bijmaken'),
    (2, 'Renault', 'Clio', 'Sleutelkaart programmeren'),
    (3, 'Fiat', 'Punto', 'Behuizing vervangen'),
    (4, 'Peugeot', '208', 'Afstandsbediening programmeren'),
    (5, 'Ford', 'Fiesta', 'Klapsleutel bijmaken'),
    (6, 'Opel', 'Corsa', 'Behuizing vervangen'),
    (7, 'Toyota', 'Aygo', 'Reservesleutel'),
    (8, 'BMW', '3-serie', 'Afstandsbediening programmeren'),
    (9, 'Mercedes-Benz', 'A-Klasse', 'Sleutel kwijt'),
    (10, 'Citroën', 'C3', 'Transponder kopiëren'),
    (11, 'Kia', 'Picanto', 'Klapsleutel bijmaken'),
    (12, 'Seat', 'Ibiza', 'Behuizing vervangen')
),
gen as (
  select g, now() - (g * interval '290 minutes') - ((g * 37 % 120) * interval '1 minute') as at
  from generate_series(0, 149) g
)
insert into public.leads (created_at, brand, model, year, service, location, postcode, name, phone, phone_e164, email,
                          source, status, quoted_price, first_contact_at, scenario, campaign_id, keyword)
select gen.at,
  cars.brand, cars.model, (2004 + (gen.g * 7) % 18)::text, cars.service,
  (array['Rotterdam','Den Haag','Utrecht','Breda','Dordrecht','Delft','Gouda','Leiden'])[1 + gen.g % 8],
  (array['3011AB','2511CV','3511LX','4811DJ','3311JA','2611HN','2801JP','2311EZ'])[1 + gen.g % 8],
  names.name,
  '0612' || lpad((345000 + gen.g)::text, 6, '0'),
  '+31612' || lpad((345000 + gen.g)::text, 6, '0'),
  lower(replace(names.name, ' ', '.')) || gen.g || '@demo.keyforcars.invalid',
  (array['hero_wizard','phone','whatsapp','agent','contact_form','hero_form'])[1 + gen.g % 6],
  case
    when gen.g < 6 then 'new'
    when gen.g % 9 = 0 then 'rejected'
    when gen.g % 4 = 0 then 'qualified'
    when gen.g % 3 = 0 then 'contacted'
    else 'sold'
  end,
  (array[49, 69, 89, 119, 149, 189])[1 + gen.g % 6],
  case when gen.g < 6 then null else gen.at + interval '12 minutes' end,
  (case when cars.service like 'Behuizing%' then 'reparatie' else 'bijmaken' end)::public.job_scenario,
  case when gen.g % 2 = 0 then (array['kfc-c1','kfc-c2','kfc-c3'])[1 + gen.g % 3] end,
  case when gen.g % 2 = 0 then (array['klapsleutel bijmaken','autosleutel programmeren','reservesleutel auto'])[1 + gen.g % 3] end
from gen
join cars on cars.i = 1 + gen.g % 12
join names on names.i = 1 + gen.g % 24;

insert into public.lead_notes (lead_id, body, author_email, created_at)
select id,
  (array['Gebeld, wil morgen langskomen voor programmeren.',
         'Offerte gestuurd via WhatsApp: klapsleutel + programmeren.',
         'Twijfelt over prijs, terugbellen na het weekend.',
         'Foto van de oude sleutel ontvangen, behuizing past.'])[1 + (n % 4)::int],
  'demo@keyforcars.invalid', created_at + interval '20 minutes'
from (
  select id, created_at, row_number() over (order by created_at desc) as n
  from public.leads where email like '%@demo.keyforcars.invalid' and status in ('contacted','qualified')
) l;

-- Jobs: the last 3 weeks done, the next 7 days planned ------------------------------
insert into public.jobs (lead_id, technician_id, status, scheduled_date, slot_start, slot_end, street, postcode, city,
                         service_type, quoted_price, final_price, completed_at, customer_name, customer_phone,
                         job_source, scenario, car_make, car_model, car_year, cost_materials, notes)
select l.id,
  (select id from public.technicians where contact_email = case when l.n % 2 = 0 then 'emre@demo.keyforcars.invalid' else 'joost@demo.keyforcars.invalid' end),
  case
    when dd.d < 0 then (case when l.n % 11 = 0 then 'geannuleerd' else 'afgerond' end)
    when dd.d = 0 and l.n % 3 = 0 then 'bezig'
    else 'gepland'
  end,
  current_date + dd.d,
  make_time(9 + (l.n % 8)::int, case when l.n % 2 = 0 then 0 else 30 end, 0),
  make_time(10 + (l.n % 8)::int, case when l.n % 2 = 0 then 0 else 30 end, 0),
  (array['Coolsingel','Laan van Meerdervoort','Oudegracht','Grote Markt','Voorstraat','Markt'])[1 + (l.n % 6)::int] || ' ' || (10 + l.n),
  l.postcode, l.location, l.service, l.quoted_price,
  case when dd.d < 0 and l.n % 11 <> 0 then l.quoted_price end,
  case when dd.d < 0 and l.n % 11 <> 0 then (current_date + dd.d)::timestamptz + make_interval(hours => 10 + (l.n % 8)::int) end,
  l.name, l.phone,
  case when l.n % 3 = 0 then 'agent' else 'eigen' end,
  l.scenario, l.brand, l.model, l.year::int,
  case when dd.d < 0 then round((l.quoted_price * 0.35)::numeric, 2) end,
  'kfc-demo'
from (
  select l.*, row_number() over (order by l.created_at) as n
  from public.leads l where l.email like '%@demo.keyforcars.invalid' and l.status = 'sold'
) l
-- Spread over 3 weeks back and 1 week ahead, about 3 a day.
cross join lateral (select (l.n % 28)::int - 20 as d) dd;

-- AI conversations: phone and WhatsApp ----------------------------------------------
insert into public.agent_conversations (conversation_id, channel, phone, status, outcome, duration_secs, summary, transcript, created_at)
select 'kfc-demo-' || l.n,
  case when l.n % 3 = 0 then 'whatsapp' else 'phone' end,
  l.phone_e164, 'done',
  case when l.n % 5 = 0 then 'failure' else 'success' end,
  (60 + (l.n * 17) % 240)::int,
  case when l.n % 5 = 0
    then 'Beller vroeg naar een sleutel voor ' || l.brand || ' ' || l.model || '; type niet zeker, doorgezet naar kantoor.'
    else 'Klant zoekt ' || lower(l.service) || ' voor ' || l.brand || ' ' || l.model || ' (' || l.year || '). Juiste artikel gevonden en afspraak voorgesteld.'
  end,
  jsonb_build_array(
    jsonb_build_object('role', 'agent', 'message', 'Goedendag, u spreekt met de assistent van KeyForCars. Waarmee kan ik helpen?'),
    jsonb_build_object('role', 'user', 'message', 'Hallo, ik heb een ' || lower(l.service) || ' nodig voor mijn ' || l.brand || ' ' || l.model || ' uit ' || l.year || '.'),
    jsonb_build_object('role', 'agent', 'message', 'Dat kan. Heeft uw huidige sleutel knoppen, en klapt het blad uit?'),
    jsonb_build_object('role', 'user', 'message', 'Ja, drie knoppen en hij klapt uit.'),
    jsonb_build_object('role', 'agent', 'message', 'Dan past deze klapsleutel op uw auto. Programmeren kan bij ons in de werkplaats. Zal ik een afspraak voor u inplannen?'),
    jsonb_build_object('role', 'user', 'message', 'Graag, liefst deze week.')
  ),
  l.created_at - interval '5 minutes'
from (
  select l.*, row_number() over (order by l.created_at desc) as n
  from public.leads l where l.email like '%@demo.keyforcars.invalid' and l.source in ('agent','phone','whatsapp')
) l;

-- Invoices for finished jobs ------------------------------------------------------------
with done as (
  select j.*, row_number() over (order by j.scheduled_date) as n
  from public.jobs j where j.notes = 'kfc-demo' and j.status = 'afgerond'
),
inv as (
  insert into public.sales_invoices (issue_date, biller_name, biller_street, biller_postcode, biller_city, biller_email,
                                     client_name, client_city, client_phone, subtotal, vat_total, total, status, job_id, notes, paid_at)
  select d.scheduled_date, 'KeyForCars', 'Voorbeeldstraat 1', '3000AA', 'Rotterdam', 'info@demo.keyforcars.invalid',
    d.customer_name, d.city, d.customer_phone,
    round(d.final_price / 1.21, 2), d.final_price - round(d.final_price / 1.21, 2), d.final_price,
    (case when d.n % 6 = 0 then 'verzonden' else 'betaald' end)::public.sales_invoice_status,
    d.id, 'kfc-demo',
    case when d.n % 6 <> 0 then d.scheduled_date::timestamptz + interval '1 day' end
  from done d
  returning id, job_id, subtotal
)
insert into public.sales_invoice_lines (invoice_id, line_no, description, quantity, unit_price, vat_rate)
select inv.id, 1, coalesce(j.service_type, 'Sleutelwerk') || ' – ' || coalesce(j.car_make, '') || ' ' || coalesce(j.car_model, ''), 1, inv.subtotal, 21
from inv join public.jobs j on j.id = inv.job_id;

-- Expenses ---------------------------------------------------------------------------------
insert into public.expenses (category, description, amount, date_incurred, supplier_name, status)
values
  ('supplier', 'Inkoop klapsleutels en behuizingen', 1240.00, current_date - 18, 'Groothandel (demo)', 'approved'),
  ('supplier', 'Transponderchips ID46/ID48', 315.50, current_date - 11, 'Chipleverancier (demo)', 'approved'),
  ('advertising', 'Google Ads november', 860.00, current_date - 6, 'Google (demo)', 'approved'),
  ('tool_subscription', 'Programmeerapparaat licentie', 49.00, current_date - 4, 'Toolfabrikant (demo)', 'pending'),
  ('fuel', 'Tanken bedrijfsbus', 72.40, current_date - 2, 'Tankstation (demo)', 'pending'),
  ('office', 'Etiketrollen 100 × 50 mm', 38.95, current_date - 1, 'Kantoorartikelen (demo)', 'pending');

-- Ad clicks, click-fraud evidence and ad spend -------------------------------------------
insert into public.call_clicks (created_at, gclid, source_url, ref, campaign_id, keyword)
select now() - (g * interval '7 hours'), 'demo-gclid-' || g, 'https://www.keyforcars.nl/', 'kfc-demo-' || g,
  (array['kfc-c1','kfc-c2','kfc-c3'])[1 + g % 3],
  (array['klapsleutel bijmaken','autosleutel programmeren','reservesleutel auto'])[1 + g % 3]
from generate_series(0, 59) g;

insert into public.ad_visits (id, created_at, ip, country, user_agent, path, gclid, campaign_id, keyword, js_ran, interacted, webdriver)
select gen_random_uuid(), now() - (g * interval '2 hours'),
  case when g % 10 = 0 then '203.0.113.7' else '198.51.100.' || (g % 200) end,
  case when g % 10 = 0 then 'PL' else 'NL' end,
  'Mozilla/5.0 (demo)', '/kfc-demo/klapsleutels', 'demo-visit-' || g,
  (array['kfc-c1','kfc-c2','kfc-c3'])[1 + g % 3], 'klapsleutel bijmaken',
  g % 10 <> 0, g % 10 <> 0 and g % 3 = 0, g % 10 = 0
from generate_series(0, 239) g;

insert into public.crm_marketing_costs (date, source, spend, clicks, impressions)
select current_date - g, 'kfc-demo-google', round((22 + (g * 7) % 18)::numeric, 2), 30 + (g * 5) % 25, 900 + (g * 37) % 400
from generate_series(0, 29) g;

commit;
