/*
 * docs/lead-quotes.md §3.1 — a quote as a fact, not a number overwritten on
 * `leads.quoted_price`. Every quote server-side or agent-side becomes a row
 * here; a human confirms it before it counts anywhere (status='confirmed').
 *
 * Linking is the one rule that must never drift into a prompt: exact E.164
 * match against leads.phone_e164 or nothing. Zero matches -> unlinked. Two or
 * more (duplicate leads on the same number) -> ambiguous, a person decides.
 * Never on name, last digits, or similarity — see src/lib/leadQuotes.ts.
 *
 * Idempotent; safe to paste more than once.
 */

create table if not exists public.lead_quotes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads (id) on delete set null,   -- null = niet gekoppeld
  phone_e text,                      -- E.164, waarop gekoppeld werd
  link_state text not null default 'unlinked' check (link_state in ('linked', 'unlinked', 'ambiguous')),
  channel text not null check (channel in ('whatsapp', 'phone', 'form', 'agent', 'crm')),
  make text, model text, year int, scenario public.job_scenario,
  quoted_price numeric(10, 2) not null check (quoted_price > 0),
  quoted_at timestamptz not null,
  outcome text not null default 'open' check (outcome in ('open', 'won', 'lost', 'no_reply')),
  outcome_at timestamptz,
  lost_reason text check (lost_reason in ('te_duur', 'concurrent', 'geen_reactie', 'zelf_opgelost', 'niet_mogelijk', 'anders')),
  won_price numeric(10, 2),
  status text not null default 'proposed' check (status in ('proposed', 'confirmed', 'rejected')),
  source text not null check (source in ('server', 'agent', 'crm')),
  evidence_ref text,                 -- chat-code of conversation-id, nooit de chat zelf
  evidence_quote text,               -- de ene zin met het bedrag, max 160 tekens, geredigeerd
  confidence numeric(3, 2),
  reviewed_by uuid references auth.users (id), reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (source, evidence_ref, quoted_price)   -- idempotent: dezelfde chat twee keer sturen voegt niets toe
);

create index if not exists lead_quotes_status_created_idx
  on public.lead_quotes (status, created_at desc);
create index if not exists lead_quotes_lead_idx
  on public.lead_quotes (lead_id);

alter table public.lead_quotes enable row level security;

grant select, insert, update, delete on public.lead_quotes to authenticated;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'lead_quotes_office') then
    create policy lead_quotes_office on public.lead_quotes
      for all
      using (public.crm_role() in ('owner', 'kantoor'))
      with check (public.crm_role() in ('owner', 'kantoor'));
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- public.crm_report_quotes — the four groupings from §3.3 in one view, told
-- apart by `dimensie`. Only status='confirmed' rows ever count (same rule as
-- agent_knowledge: 'proposed' never counts anywhere a human hasn't looked).
--
-- tarief_nu only exists for the merk_scenario dimension — the others have no
-- single `make` to price against. Within merk_scenario it prefers the
-- make-level dispatch_pricing row (model is null); if the office never set one
-- for that make+scenario it falls back to whatever model-specific row is
-- cheapest, rather than showing nothing.
-- ----------------------------------------------------------------------------
create or replace view public.crm_report_quotes as
with base as (
  select *,
    case
      when quoted_price < 150 then '0-150'
      when quoted_price < 250 then '150-250'
      when quoted_price < 400 then '250-400'
      else '400+'
    end as price_band
  from public.lead_quotes
  where status = 'confirmed'
    and public.crm_visible()
)
select
  'merk_scenario'::text as dimensie,
  lower(make) || ' · ' || scenario::text as sleutel,
  scenario::text as scenario,
  count(*) as offertes,
  count(*) filter (where outcome = 'won') as gewonnen,
  count(*) filter (where outcome = 'lost') as verloren,
  count(*) filter (where outcome = 'no_reply') as geen_reactie,
  round(100.0 * count(*) filter (where outcome = 'won')
    / greatest(count(*) filter (where outcome in ('won', 'lost')), 1), 1) as conversie_pct,
  percentile_cont(0.5) within group (order by coalesce(won_price, quoted_price)) filter (where outcome = 'won') as mediaan_gewonnen,
  percentile_cont(0.5) within group (order by quoted_price) filter (where outcome = 'lost') as mediaan_verloren,
  (
    select dp.price from public.dispatch_pricing dp
    where lower(dp.make) = lower(base.make) and dp.scenario = base.scenario
    order by (dp.model is not null) asc, dp.price asc
    limit 1
  ) as tarief_nu
from base
where make is not null and scenario is not null
group by make, scenario

union all

select
  'prijsband_scenario'::text as dimensie,
  price_band as sleutel,
  scenario::text as scenario,
  count(*) as offertes,
  count(*) filter (where outcome = 'won') as gewonnen,
  count(*) filter (where outcome = 'lost') as verloren,
  count(*) filter (where outcome = 'no_reply') as geen_reactie,
  round(100.0 * count(*) filter (where outcome = 'won')
    / greatest(count(*) filter (where outcome in ('won', 'lost')), 1), 1) as conversie_pct,
  percentile_cont(0.5) within group (order by coalesce(won_price, quoted_price)) filter (where outcome = 'won') as mediaan_gewonnen,
  percentile_cont(0.5) within group (order by quoted_price) filter (where outcome = 'lost') as mediaan_verloren,
  null::numeric as tarief_nu
from base
group by price_band, scenario

union all

select
  'kanaal'::text as dimensie,
  channel as sleutel,
  null::text as scenario,
  count(*) as offertes,
  count(*) filter (where outcome = 'won') as gewonnen,
  count(*) filter (where outcome = 'lost') as verloren,
  count(*) filter (where outcome = 'no_reply') as geen_reactie,
  round(100.0 * count(*) filter (where outcome = 'won')
    / greatest(count(*) filter (where outcome in ('won', 'lost')), 1), 1) as conversie_pct,
  percentile_cont(0.5) within group (order by coalesce(won_price, quoted_price)) filter (where outcome = 'won') as mediaan_gewonnen,
  percentile_cont(0.5) within group (order by quoted_price) filter (where outcome = 'lost') as mediaan_verloren,
  null::numeric as tarief_nu
from base
group by channel

union all

select
  'verliesreden'::text as dimensie,
  coalesce(lost_reason, 'onbekend') as sleutel,
  null::text as scenario,
  count(*) as offertes,
  count(*) filter (where outcome = 'won') as gewonnen,
  count(*) filter (where outcome = 'lost') as verloren,
  count(*) filter (where outcome = 'no_reply') as geen_reactie,
  round(100.0 * count(*) filter (where outcome = 'won')
    / greatest(count(*) filter (where outcome in ('won', 'lost')), 1), 1) as conversie_pct,
  percentile_cont(0.5) within group (order by coalesce(won_price, quoted_price)) filter (where outcome = 'won') as mediaan_gewonnen,
  percentile_cont(0.5) within group (order by quoted_price) filter (where outcome = 'lost') as mediaan_verloren,
  null::numeric as tarief_nu
from base
where outcome = 'lost'
group by lost_reason;

comment on view public.crm_report_quotes is
  'Offertes per merk×scenario, prijsband×scenario, kanaal en verliesreden — alleen confirmed. docs/lead-quotes.md §3.3.';

grant select on public.crm_report_quotes to authenticated;

do $$
begin
  if current_setting('server_version_num')::int >= 150000 then
    alter view public.crm_report_quotes set (security_invoker = true);
  else
    raise notice 'security_invoker not available on this server; crm_visible() is the guard.';
  end if;
end $$;

notify pgrst, 'reload schema';
