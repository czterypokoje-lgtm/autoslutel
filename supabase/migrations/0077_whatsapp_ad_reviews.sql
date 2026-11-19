-- ============================================================================
-- CRM: WhatsApp chats with an ad code, waiting for a person's verdict.
--
-- Run after 0076_ops_audit_log.sql. Additive and idempotent. Paste it into the
-- Supabase SQL editor; there is no migration runner.
--
-- The assistant suggests a result, the office decides. Only a confirmed row can
-- reach Google. The phone number is kept as its last four digits, because the
-- row only has to be recognised on screen.
-- ============================================================================

create table if not exists public.whatsapp_ad_reviews (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  ref         text not null unique,
  phone_end   text,
  chat_at     timestamptz,
  ai_result   text,
  car         text,
  price_note  text,
  decision    text check (decision in ('gedaan', 'geen_job')),
  value       numeric(10,2),
  work_date   date,
  decided_at  timestamptz,
  decided_by  uuid references auth.users (id) on delete set null,
  exported_at timestamptz
);

create index if not exists whatsapp_ad_reviews_open_idx
  on public.whatsapp_ad_reviews (chat_at desc)
  where decision is null;

alter table public.whatsapp_ad_reviews enable row level security;

grant select, update on public.whatsapp_ad_reviews to authenticated;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'whatsapp_ad_reviews_office_read') then
    create policy whatsapp_ad_reviews_office_read on public.whatsapp_ad_reviews
      for select
      using (public.crm_role() in ('owner', 'kantoor'));
  end if;
  if not exists (select 1 from pg_policies where policyname = 'whatsapp_ad_reviews_office_update') then
    create policy whatsapp_ad_reviews_office_update on public.whatsapp_ad_reviews
      for update
      using (public.crm_role() in ('owner', 'kantoor'))
      with check (public.crm_role() in ('owner', 'kantoor'));
  end if;
end $$;
