-- ============================================================================
-- CRM fase 59: onthouden welke advertentie een klik of lead opleverde.
--
-- Idempotent. Run after the ad tracking template is set in Google Ads —
-- before that these columns simply stay null, which is honest.
--
-- Today the only thing kept from a paid click is the click id itself. That is
-- enough to report a conversion back to Google and nothing else: the office
-- can see that Google sent someone, never which campaign paid, and never what
-- the person actually searched for. Measured on the live data, 16 of 58
-- captured clicks could not even name a campaign, and not one lead of 286
-- carried any campaign information at all.
--
-- What makes these columns fill is a Final URL suffix on the Google Ads
-- account (Settings -> Account settings -> Tracking), which appends the
-- ValueTrack parameters to whatever URL the ad already points at:
--
--   gad_campaignid={campaignid}&kw={keyword}&mt={matchtype}
--
-- A suffix rather than a tracking template on purpose. A template rewrites
-- the destination through {lpurl}, so a malformed one can stop ads serving
-- account-wide; a suffix can only add parameters. And no {gclid}: the account
-- has auto-tagging on, which appends it already.
--
-- Two columns, not six. Campaign answers "which campaign pays for itself" and
-- keyword answers "which search term does"; ad group, match type and device
-- are a level of detail nobody here has asked a question about yet, and a
-- column nobody reads is a column that silently goes stale. The landing URL
-- is kept in call_clicks.source_url regardless, so the rest can be recovered
-- from it if the question ever comes up.
--
-- Only the call_clicks half fills on its own: that route is handed the
-- landing URL, so campaign and keyword come free. The leads half stays null
-- until the six lead forms send the two values the way they already send
-- gclid — each reads its own cookie, so that is six small edits and a job of
-- its own. The columns are added now so the data has somewhere to land the
-- day those edits happen, and so the reports can be written once.
--
-- The existing utm_* columns on leads are deliberately left alone: those
-- belong to hand-built UTM links (newsletters, flyers), and overloading them
-- with Google's ids would make both unreadable.
-- ============================================================================

alter table public.call_clicks add column if not exists campaign_id text;
alter table public.call_clicks add column if not exists keyword      text;

alter table public.leads       add column if not exists campaign_id text;
alter table public.leads       add column if not exists keyword      text;

comment on column public.call_clicks.campaign_id is
  'Google Ads campaign id, from {campaignid} on the landing URL. Null for clicks captured before the Final URL suffix was set, and for every non-paid visit.';
comment on column public.leads.keyword is
  'The search term the visitor actually typed, from {keyword}. Null for organic, direct and pre-template traffic.';

/* The two questions these columns exist to answer, so the reports stay cheap
   as the click log grows. Partial: most rows are null and always will be. */
create index if not exists call_clicks_campaign_idx
  on public.call_clicks (campaign_id) where campaign_id is not null;
create index if not exists leads_campaign_idx
  on public.leads (campaign_id) where campaign_id is not null;

notify pgrst, 'reload schema';
