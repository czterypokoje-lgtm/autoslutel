/*
 * Price questions found in the owner's WhatsApp history, one row per question.
 *
 * Filled by a local import: the chats themselves stay on the owner's Mac; only
 * these extracted fields and a short excerpt come here. Every row points back
 * to the exact chat and messages it came from, so a number in the price list
 * can always be checked against what was really said.
 *
 * Separate from leads.quoted_price (0029): that is the one indicative price the
 * website form showed; this is every price ever named in a chat.
 *
 * First shipped as 0076_whatsapp_quotes.sql on the old main; renumbered here.
 * Run after 0105. Idempotent: safe on a database that already ran 0076.
 */

create table if not exists public.whatsapp_quotes (
  id uuid primary key default gen_random_uuid(),

  /*
   * Where it was said. WhatsApp has no link to a single message, so the
   * "link" is the chat, the message ids and the time: enough to find it in
   * the export on the Mac, or by scrolling on the phone.
   * source_key = chat_jid || ':' || ask_message_id, so re-running the import
   * updates a row instead of duplicating it.
   */
  source_key          text not null unique,
  chat_jid            text not null,
  phone               text,
  contact_name        text,
  ask_message_id      text not null,
  quote_message_id    text,
  context_message_ids text[] not null default '{}',
  asked_at            timestamptz,
  quoted_at           timestamptz,
  /* Only the few messages around the price, as [{id, at, from_me, text}]. Never the whole chat. */
  context             jsonb not null default '[]',

  make      text not null,
  model     text,
  year      integer check (year is null or year between 1970 and 2100),
  kenteken  text,

  /* Null = the chat doesn't make it clear. */
  scenario  public.job_scenario,
  problem   text not null,
  product   text,
  keyless   boolean,

  city            text,
  postcode        text,
  urgency         text not null default 'onbekend'
    check (urgency in ('nu', 'vandaag', 'deze_week', 'later', 'onbekend')),
  requested_time  text,
  conditions      text,

  /* The price exactly as said. */
  price_amount  numeric(10,2) check (price_amount is null or price_amount >= 0),
  price_max     numeric(10,2) check (price_max is null or price_max >= 0),
  price_kind    text not null default 'geen'
    check (price_kind in ('vast', 'vanaf', 'bandbreedte', 'geen')),
  price_vat     text not null default 'onbekend'
    check (price_vat in ('incl', 'excl', 'onbekend')),
  /* True when the chat named no BTW basis and 'incl' was filled in by the
     owner's rule (21 Nov 2026: bare prices are incl. BTW), not read from the chat. */
  price_vat_assumed boolean not null default false,
  /*
   * Including 21% BTW, computed here and never by the model. Null when the
   * chat doesn't say incl or excl: guessing the basis would put a 21% error
   * into the price list.
   */
  price_incl numeric(10,2) generated always as (
    case price_vat
      when 'incl' then price_amount
      when 'excl' then round(price_amount * 1.21, 2)
    end
  ) stored,
  quote_excerpt text,

  /*
   * Who ended it and why. lost_* is the customer saying no; declined_* is us
   * saying no. Kept apart because the fixes are opposite: a price loss is a
   * pricing decision, a decline is a tool, part or technician we don't have.
   */
  outcome      text not null default 'onbekend'
    check (outcome in ('gewonnen', 'verloren', 'geen_reactie', 'afgewezen_door_ons', 'onbekend')),
  lost_reason  text
    check (lost_reason is null or lost_reason in
      ('prijs', 'tijd', 'klant_elders', 'dealer', 'zelf_opgelost', 'vertrouwen', 'anders', 'onbekend')),
  lost_detail  text,
  declined_reason text
    check (declined_reason is null or declined_reason in
      ('auto_niet_mogelijk', 'geen_onderdeel', 'geen_monteur', 'te_ver', 'te_laat_op_dag', 'niet_rendabel', 'anders')),
  declined_detail text,

  /* Negotiation. Same VAT basis as price_vat. */
  price_objection     boolean not null default false,
  time_objection      boolean not null default false,
  competitor_price    numeric(10,2),
  competitor          text,
  customer_budget     numeric(10,2),
  we_lowered_price    boolean not null default false,
  final_price_amount  numeric(10,2),
  we_followed_up      boolean not null default false,
  source              text not null default 'onbekend'
    check (source in ('google', 'advertentie', 'website', 'marktplaats', 'doorverwezen', 'terugkerende_klant', 'garage_b2b', 'onbekend')),

  /*
   * Speed, from message timestamps by the import script, never by the model.
   * In emergency work the first answer often decides the job.
   */
  first_reply_at  timestamptz,
  reply_minutes   integer generated always as (
    case when first_reply_at is not null and asked_at is not null
      then greatest(0, (extract(epoch from (first_reply_at - asked_at)) / 60)::integer)
    end
  ) stored,

  /*
   * "Gewonnen" from the chat is a claim; a job in the CRM for the same phone
   * within 14 days is proof. Set by the import, null when no job matches
   * (most history predates the CRM).
   */
  job_id  uuid references public.jobs (id) on delete set null,

  /* The model's own certainty, and the owner's check of it. */
  confidence    numeric(3,2) check (confidence is null or confidence between 0 and 1),
  review        text not null default 'nieuw'
    check (review in ('nieuw', 'goedgekeurd', 'afgewezen')),
  extracted_by  text,
  extracted_at  timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

create index if not exists whatsapp_quotes_car_idx
  on public.whatsapp_quotes (lower(make), lower(coalesce(model, '')), scenario);
create index if not exists whatsapp_quotes_phone_idx
  on public.whatsapp_quotes (phone) where phone is not null;
create index if not exists whatsapp_quotes_outcome_idx
  on public.whatsapp_quotes (outcome, lost_reason);

comment on table public.whatsapp_quotes is
  'Price questions extracted from the owner''s WhatsApp history. One row per question, each pointing back to its chat and messages.';

alter table public.whatsapp_quotes enable row level security;

/* Office only, like agent_conversations: these are customers' own words. No
   insert/update policy: the import writes with the service-role key. */
drop policy if exists whatsapp_quotes_read on public.whatsapp_quotes;
create policy whatsapp_quotes_read on public.whatsapp_quotes
  for select
  using (public.crm_role() in ('owner', 'kantoor'));

/*
 * The office checks each extracted row on /admin/whatsapp-analyse and marks it
 * goedgekeurd or afgewezen. Who and when, so a mark can be traced. The API
 * route only ever writes these three columns.
 */
alter table public.whatsapp_quotes add column if not exists reviewed_at timestamptz;
alter table public.whatsapp_quotes add column if not exists reviewed_by uuid references auth.users (id) on delete set null;

drop policy if exists whatsapp_quotes_review on public.whatsapp_quotes;
create policy whatsapp_quotes_review on public.whatsapp_quotes
  for update
  using (public.crm_role() in ('owner', 'kantoor'))
  with check (public.crm_role() in ('owner', 'kantoor'));

/*
 * The price list: what we actually asked, per car, 5-year band and job, and
 * how often it won. Only rows with a known incl-BTW price that the owner
 * hasn't rejected. quote_ids opens every line back to the chats behind it.
 * security_invoker, so the view obeys the table's office-only policy.
 */
create or replace view public.whatsapp_price_list
with (security_invoker = true) as
select
  make,
  model,
  (year / 5) * 5                                            as year_from,
  (year / 5) * 5 + 4                                        as year_to,
  scenario,
  count(*)                                                  as quotes,
  min(price_incl)                                           as min_incl,
  percentile_cont(0.5) within group (order by price_incl)   as median_incl,
  max(price_incl)                                           as max_incl,
  count(*) filter (where outcome = 'gewonnen')              as won,
  count(*) filter (where outcome = 'verloren')              as lost,
  count(*) filter (where lost_reason = 'prijs')             as lost_on_price,
  percentile_cont(0.5) within group (order by price_incl)
    filter (where outcome = 'gewonnen')                     as median_won_incl,
  max(quoted_at)                                            as last_quoted_at,
  array_agg(id order by quoted_at desc nulls last)          as quote_ids
from public.whatsapp_quotes
where price_incl is not null
  and review <> 'afgewezen'
group by make, model, (year / 5) * 5, scenario;

comment on view public.whatsapp_price_list is
  'Real quoted prices incl. BTW per make/model/5-year band/scenario, with win/loss. quote_ids open the source rows.';

/*
 * Analysis views. All security_invoker, all skip rows the owner rejected.
 * Every view carries quote_ids so any number opens back to its chats.
 */

/* 1. Funnel per month: how many asked, got a price, bought, said no, went silent, were turned away. */
create or replace view public.whatsapp_funnel
with (security_invoker = true) as
select
  date_trunc('month', asked_at at time zone 'Europe/Amsterdam')::date   as month,
  count(*)                                                               as questions,
  count(*) filter (where price_amount is not null)                      as quoted,
  count(*) filter (where outcome = 'gewonnen')                          as won,
  count(*) filter (where job_id is not null)                            as won_proven_by_job,
  count(*) filter (where outcome = 'verloren')                          as lost,
  count(*) filter (where outcome = 'geen_reactie')                      as silent,
  count(*) filter (where outcome = 'afgewezen_door_ons')                as declined_by_us,
  round(100.0 * count(*) filter (where outcome = 'gewonnen')
        / nullif(count(*) filter (where outcome <> 'onbekend'), 0), 1)  as win_pct,
  array_agg(id)                                                          as quote_ids
from public.whatsapp_quotes
where review <> 'afgewezen'
group by 1;

/* 2. Why the customer said no: price, time, dealer... with their words and the money involved. */
create or replace view public.whatsapp_loss_reasons
with (security_invoker = true) as
select
  coalesce(lost_reason, 'onbekend')                                      as reason,
  scenario,
  count(*)                                                               as lost,
  percentile_cont(0.5) within group (order by price_incl)               as median_our_price_incl,
  percentile_cont(0.5) within group (order by competitor_price)         as median_competitor_price,
  percentile_cont(0.5) within group (order by customer_budget)          as median_customer_budget,
  percentile_cont(0.5) within group (order by reply_minutes)            as median_reply_minutes,
  (array_agg(lost_detail order by asked_at desc) filter (where lost_detail is not null))[1:5]
                                                                         as recent_words,
  array_agg(id order by asked_at desc nulls last)                       as quote_ids
from public.whatsapp_quotes
where review <> 'afgewezen'
  and outcome in ('verloren', 'geen_reactie')
group by 1, 2;

/* 3. Cars and jobs WE turned away: the shopping list for tools, parts and technicians. */
create or replace view public.whatsapp_declined_cars
with (security_invoker = true) as
select
  make,
  model,
  (year / 5) * 5                                                         as year_from,
  scenario,
  declined_reason,
  count(*)                                                               as declined,
  max(asked_at)                                                          as last_asked_at,
  (array_agg(declined_detail order by asked_at desc) filter (where declined_detail is not null))[1:3]
                                                                         as our_words,
  array_agg(id order by asked_at desc nulls last)                       as quote_ids
from public.whatsapp_quotes
where review <> 'afgewezen'
  and outcome = 'afgewezen_door_ons'
group by make, model, (year / 5) * 5, scenario, declined_reason;

/* 4. Does a fast answer win? Win rate per reply-time bucket. */
create or replace view public.whatsapp_reply_speed
with (security_invoker = true) as
select
  case
    when reply_minutes is null then 'onbekend'
    when reply_minutes <= 5    then '0-5 min'
    when reply_minutes <= 15   then '6-15 min'
    when reply_minutes <= 60   then '16-60 min'
    when reply_minutes <= 240  then '1-4 uur'
    else 'later'
  end                                                                    as reply_bucket,
  count(*)                                                               as questions,
  count(*) filter (where outcome = 'gewonnen')                          as won,
  round(100.0 * count(*) filter (where outcome = 'gewonnen')
        / nullif(count(*) filter (where outcome <> 'onbekend'), 0), 1)  as win_pct,
  array_agg(id)                                                          as quote_ids
from public.whatsapp_quotes
where review <> 'afgewezen'
group by 1;

/* 5. When people ask: weekday x hour, Amsterdam time, with win rate. Shows when to be reachable. */
create or replace view public.whatsapp_demand_by_hour
with (security_invoker = true) as
select
  extract(isodow from asked_at at time zone 'Europe/Amsterdam')::int    as weekday,
  extract(hour   from asked_at at time zone 'Europe/Amsterdam')::int    as hour,
  count(*)                                                               as questions,
  count(*) filter (where outcome = 'gewonnen')                          as won,
  count(*) filter (where lost_reason = 'tijd')                          as lost_on_time
from public.whatsapp_quotes
where review <> 'afgewezen' and asked_at is not null
group by 1, 2;

/* 6. Price pushback: where customers argued, what they compared with, and whether lowering helped. */
create or replace view public.whatsapp_price_pressure
with (security_invoker = true) as
select
  make,
  model,
  scenario,
  count(*)                                                               as questions,
  count(*) filter (where price_objection)                               as price_objections,
  count(*) filter (where we_lowered_price)                              as we_lowered,
  count(*) filter (where we_lowered_price and outcome = 'gewonnen')     as lowered_and_won,
  percentile_cont(0.5) within group (order by price_incl)               as median_our_price_incl,
  percentile_cont(0.5) within group (order by competitor_price)         as median_competitor_price,
  array_agg(distinct competitor) filter (where competitor is not null)  as competitors,
  array_agg(id order by asked_at desc nulls last)                       as quote_ids
from public.whatsapp_quotes
where review <> 'afgewezen'
group by make, model, scenario
having count(*) filter (where price_objection) > 0;

notify pgrst, 'reload schema';
