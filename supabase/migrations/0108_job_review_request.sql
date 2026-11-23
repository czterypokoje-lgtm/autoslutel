/*
 * Post-completion WhatsApp review request, tracked per job so the cron scan
 * (src/app/api/cron/review-requests/route.ts) sends at most once and can
 * tell a customer who said nothing (null) from one who was asked, skipped or
 * failed. Idempotent.
 */

alter table public.jobs add column if not exists review_requested_at timestamptz;

alter table public.jobs add column if not exists review_request_status text
  check (review_request_status in ('sent', 'skipped', 'failed'));

alter table public.jobs add column if not exists review_request_note text
  check (char_length(review_request_note) <= 200);

-- One retry after a failed send, then the scan leaves it alone.
alter table public.jobs add column if not exists review_request_attempts int not null default 0;

-- The scan's own candidate list: completed, not yet handled.
create index if not exists jobs_review_pending_idx
  on public.jobs (completed_at)
  where status = 'afgerond' and review_requested_at is null;
