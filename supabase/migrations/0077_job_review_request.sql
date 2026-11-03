-- When we asked this customer for a Google review.
--
-- 72 jobs finished and ten Google reviews on the profile. The ask was never
-- built, so it never happened -- and for a mobile locksmith the review count
-- is the main thing deciding whether the local pack shows us at all when
-- somebody searches "autosleutel kwijt" at eleven at night.
--
-- Set when the office is handed the request to send, so the same customer is
-- surfaced once and nobody is asked twice.
alter table public.jobs add column if not exists review_requested_at timestamptz;

create index if not exists jobs_review_pending_idx
  on public.jobs (completed_at)
  where review_requested_at is null;

comment on column public.jobs.review_requested_at is
  'When the office was handed a prefilled review request for this job. Null = never asked.';
