/*
 * WhatsApp opt-outs, kept separate from jobs/leads: a single phone number can
 * have many leads and many jobs, but "STOP" is said once, by the number — not
 * by any one of them — so the opt-out has to live on the phone, not be
 * duplicated (and possibly missed) across every record that shares it.
 *
 * Idempotent.
 */

create table if not exists public.whatsapp_optouts (
  phone_e164 text primary key,
  created_at timestamptz not null default now(),
  source text not null default 'reply' check (source in ('reply', 'office')),
  note text
);

comment on table public.whatsapp_optouts is 'Phone numbers that must never receive a business-initiated WhatsApp message again: a STOP-like reply (source reply), or an opt-out entered by the office (source office).';

alter table public.whatsapp_optouts enable row level security;

drop policy if exists whatsapp_optouts_office on public.whatsapp_optouts;
create policy whatsapp_optouts_office on public.whatsapp_optouts
  for all
  using (public.crm_role() in ('owner', 'kantoor'))
  with check (public.crm_role() in ('owner', 'kantoor'));

grant select, insert, delete on public.whatsapp_optouts to authenticated;
