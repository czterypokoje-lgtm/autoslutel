/*
 * Marketing spend per network per day, and the click ids that tie a lead back
 * to the ad that paid for it.
 *
 * Renumbered from 0009, which already existed as 0009_webshop_orders.sql.
 * Migration runners key on that prefix: the duplicate would have been applied
 * in an order nobody chose, or treated as already-run and silently skipped.
 * 0045 is the next free number.
 */

create table if not exists public.crm_marketing_costs (
  id          uuid primary key default gen_random_uuid(),
  date        date not null,
  /* 'google' | 'bing' | 'meta' | 'openai' | 'seo' */
  source      text not null,
  spend       numeric(12,2) not null default 0,
  clicks      integer not null default 0,
  impressions integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  unique (date, source)
);

create index if not exists crm_marketing_costs_date_idx
  on public.crm_marketing_costs (date desc);

comment on table public.crm_marketing_costs is
  'Daily ad spend per network. Written only by the sync cron with the service-role key; read by the office.';


/*
 * The original version of this shipped as:
 *
 *   GRANT ALL ON public.crm_marketing_costs TO authenticated;
 *
 * with no row level security — which let every logged-in technician read the
 * company's ad spend and delete it. Every other table in this database is
 * gated by role, and this one is no different.
 */
alter table public.crm_marketing_costs enable row level security;

drop policy if exists crm_marketing_costs_read on public.crm_marketing_costs;
create policy crm_marketing_costs_read on public.crm_marketing_costs
  for select
  using (public.crm_role() in ('owner', 'kantoor'));

/*
 * No insert/update policy on purpose. The sync cron writes with the
 * service-role key, which bypasses RLS; nothing reaching this table through
 * the API should be able to change what an ad cost.
 */
revoke all on public.crm_marketing_costs from authenticated;
grant select on public.crm_marketing_costs to authenticated;


/*
 * Click ids on the lead.
 *
 * The first version added a single `click_id` column "gclid, fbclid, msclkid".
 * leads already carries gclid, wbraid and gbraid, and the offline-conversion
 * export reads exactly those — so a Google click id could land in either
 * column while the half of the system that uploads conversions looked at only
 * one of them.
 *
 * One column per network instead, all read by one exporter. msclkid is Bing's;
 * oppref is OpenAI's, which the site does not capture yet but will.
 */
alter table public.leads
  add column if not exists msclkid     text,
  add column if not exists oppref      text,
  add column if not exists utm_source  text,
  add column if not exists utm_medium  text,
  add column if not exists utm_campaign text;

comment on column public.leads.msclkid is
  'Microsoft Advertising click id. Sits beside gclid/wbraid/gbraid — one column per network, never a shared click_id.';
