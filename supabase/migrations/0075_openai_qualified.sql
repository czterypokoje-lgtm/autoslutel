/* "Qualified call sent once" mark for api/cron/openai-paid-jobs. Run after 0074. Idempotent. */
alter table public.jobs add column if not exists openai_qualified_at timestamptz;

notify pgrst, 'reload schema';
