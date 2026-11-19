-- ============================================================================
-- CRM: what is attached to an outbox message (slice S6, invoice send).
-- NOT APPLIED: owner reviews first. Run after 0078_job_room.sql. Idempotent.
--
-- Metadata only: type, invoice number, total, a hash of the invoice at the time
-- it was proposed, and optionally the Moneybird invoice id. Never the PDF and
-- never contact details. The transport re-checks the hash before it attaches
-- anything, so an invoice edited after approval needs a new approval.
-- ============================================================================

alter table public.job_outbox
  add column if not exists attachment jsonb
  check (attachment is null or octet_length(attachment::text) <= 2000);
