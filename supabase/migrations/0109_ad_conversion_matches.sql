/*
 * Sales matched to an ad click, confirmed by a person, before Google sees them.
 *
 * Run after 0108. Additive and idempotent: one new table, its indexes and its
 * policy. Paste it into the Supabase SQL editor; safe to run twice.
 *
 * Why. Until now the daily Google Ads file (/api/ads/conversions.csv) decided
 * by itself which finished job belonged to which click, including matches no
 * person had looked at (a WhatsApp code, a phone number). A wrong click id
 * teaches Smart Bidding to buy the wrong traffic, so from this migration on
 * the file carries only rows from this table: a sale (finished job, WhatsApp
 * win, or a WhatsApp ad review marked "gedaan") plus the one click a person
 * confirmed for it on /admin/conversies. The matcher only proposes.
 *
 * Money. Both amounts are stored and labelled: value_incl_btw is what the
 * customer paid, value_excl_btw is that amount without 21% BTW and is the
 * figure uploaded to Google. Prices in this business are incl. BTW unless a
 * chat says otherwise (owner, 21 Nov 2026); vat_assumed marks that case.
 *
 * Nothing personal is stored here: a source id, a click id, times, amounts.
 */
create table if not exists public.ad_conversion_matches (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),

  /* What was sold. source_id points into jobs, whatsapp_quotes or whatsapp_ad_reviews. */
  source          text not null check (source in ('job', 'whatsapp_quote', 'whatsapp_review')),
  source_id       uuid not null,

  /* The click, exactly as Google gave it. */
  click_kind      text not null check (click_kind in ('gclid', 'gbraid', 'wbraid')),
  click_id        text not null check (click_id ~ '^[A-Za-z0-9_-]{8,200}$'),
  clicked_at      timestamptz not null,
  /* The evidence that tied them: own_click, lead_form, office_claim, chat_code, quote_code, review_code, same_phone, time. */
  rule            text not null,

  decision        text not null check (decision in ('bevestigd', 'afgewezen')),
  conversion_at   timestamptz,
  value_incl_btw  numeric(10,2),
  value_excl_btw  numeric(10,2),
  vat_assumed     boolean not null default false,

  decided_by      uuid references auth.users (id) on delete set null,
  decided_at      timestamptz not null default now(),
  /* First time Google's scheduled fetch received this row. Informational. */
  uploaded_at     timestamptz,

  constraint ad_conversion_matches_confirmed_complete check (
    decision <> 'bevestigd'
    or (conversion_at is not null and conversion_at >= clicked_at
        and value_incl_btw > 0 and value_excl_btw > 0 and value_excl_btw <= value_incl_btw)
  )
);

comment on table public.ad_conversion_matches is
  'Sale-to-ad-click matches decided by the office on /admin/conversies. Only bevestigd rows go to Google Ads (value_excl_btw). No personal data.';

/* One decision per sale and click: deciding again replaces it. */
create unique index if not exists ad_conversion_matches_pair_key
  on public.ad_conversion_matches (source, source_id, click_id);

/* A sale is uploaded once, with one click. */
create unique index if not exists ad_conversion_matches_one_per_sale
  on public.ad_conversion_matches (source, source_id)
  where decision = 'bevestigd';

/* A click earns one sale. */
create unique index if not exists ad_conversion_matches_one_per_click
  on public.ad_conversion_matches (click_id)
  where decision = 'bevestigd';

alter table public.ad_conversion_matches enable row level security;

revoke all on public.ad_conversion_matches from anon;
grant select, insert, update, delete on public.ad_conversion_matches to authenticated;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'ad_conversion_matches' and policyname = 'ad_conversion_matches_office') then
    create policy ad_conversion_matches_office on public.ad_conversion_matches
      for all
      using (public.crm_role() in ('owner', 'kantoor'))
      with check (public.crm_role() in ('owner', 'kantoor'));
  end if;
end $$;

notify pgrst, 'reload schema';
