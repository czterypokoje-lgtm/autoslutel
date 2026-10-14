/*
 * ChatGPT ads' click reference (`oppref`), carried the same way gclid already
 * is: landing → call_clicks (or the web lead) → the office claims it on the
 * job → a paid job is reported back once (api/cron/openai-paid-jobs).
 *
 * openai_reported_at is the "sent once" mark, the same role jobs.exported_at
 * plays for the Google CSV. Run after 0073. Idempotent.
 */
alter table public.call_clicks add column if not exists oppref text;
alter table public.leads add column if not exists oppref text;
alter table public.jobs
  add column if not exists oppref text,
  add column if not exists openai_reported_at timestamptz;

notify pgrst, 'reload schema';
