/*
 * What the visitor actually chose on the kenteken form, and the indicative
 * price shown for it — separate from sale_price, which is the real invoiced
 * amount once a lead is sold (see LeadsTable.tsx's warning: sale_price feeds
 * Google Ads conversion value and must never hold an estimate).
 */
alter table public.leads add column if not exists scenario public.job_scenario;
alter table public.leads add column if not exists quoted_price numeric(10, 2);

notify pgrst, 'reload schema';
