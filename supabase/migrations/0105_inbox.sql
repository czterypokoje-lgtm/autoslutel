/*
 * One inbox for the three ways a customer writes to us: WhatsApp (Meta Cloud
 * API), e-mail (Resend inbound) and the website forms. Phone calls stay in
 * agent_conversations — they are transcripts of a finished call, not a
 * conversation we keep answering.
 *
 * Two tables, deliberately plain. A thread is "this contact, on this channel".
 * A message is one thing said, in or out, with the provider's own id so a
 * retried webhook cannot store it twice.
 */

create table if not exists public.inbox_threads (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('whatsapp', 'email', 'form')),

  /* The contact key per channel: E.164 for WhatsApp, lowercase address for
     e-mail. A form may carry both. */
  phone text,
  email text,
  name text,
  subject text,

  lead_id uuid references public.leads (id) on delete set null,

  status text not null default 'open' check (status in ('open', 'closed')),

  /*
   * What the assistant may do on this thread.
   *   off   — never writes.
   *   draft — proposes a reply; a person sends it (default).
   *   auto  — sends its reply itself, until a person takes over.
   * Any outbound message written by a person switches 'auto' back to 'draft':
   * that is the human takeover, and it needs no button.
   */
  ai_mode text not null default 'draft' check (ai_mode in ('off', 'draft', 'auto')),

  assigned_to uuid references auth.users (id) on delete set null,

  last_message_at  timestamptz not null default now(),
  last_inbound_at  timestamptz,
  last_outbound_at timestamptz,
  unread integer not null default 0,

  /* WhatsApp: the wa_id Meta reported. E-mail: the first Message-ID. */
  external_ref text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists inbox_threads_last_idx on public.inbox_threads (last_message_at desc);
create index if not exists inbox_threads_phone_idx on public.inbox_threads (phone) where phone is not null;
create index if not exists inbox_threads_email_idx on public.inbox_threads (email) where email is not null;
/* WhatsApp is one continuous conversation per number. */
create unique index if not exists inbox_threads_whatsapp_phone
  on public.inbox_threads (phone) where channel = 'whatsapp';

create table if not exists public.inbox_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.inbox_threads (id) on delete cascade,
  direction text not null check (direction in ('in', 'out')),
  /* 'customer' | 'ai' | the e-mail of the office user who wrote it */
  author text not null,
  body text not null,
  status text not null default 'received'
    check (status in ('received', 'draft', 'sent', 'delivered', 'read', 'failed')),
  /* Provider id: Meta message id, Resend email id. Unique so a retried
     webhook is a no-op instead of a duplicate. */
  external_id text unique,
  /* RFC Message-ID of an e-mail, for threading replies. */
  message_id text,
  error text,
  meta jsonb,
  created_at timestamptz not null default now()
);

create index if not exists inbox_messages_thread_idx on public.inbox_messages (thread_id, created_at);
create index if not exists inbox_messages_message_id_idx on public.inbox_messages (message_id) where message_id is not null;

comment on table public.inbox_threads is 'Customer conversations over WhatsApp, e-mail and website forms. Written by /api/webhooks/* (service role) and the office (/api/admin/inbox).';
comment on table public.inbox_messages is 'One message in an inbox thread. external_id makes provider retries idempotent.';

/* Unread counter, bumped in SQL so two webhooks cannot lose an increment. */
create or replace function public.inbox_bump_unread(p_thread uuid)
returns void language sql security definer set search_path = public as $$
  update public.inbox_threads set unread = unread + 1 where id = p_thread;
$$;
revoke all on function public.inbox_bump_unread(uuid) from public;
grant execute on function public.inbox_bump_unread(uuid) to service_role;

alter table public.inbox_threads enable row level security;
alter table public.inbox_messages enable row level security;

/* Office only, like agent_conversations: these are customers' own words and
   numbers. Webhooks write with the service role, which bypasses RLS. */
drop policy if exists inbox_threads_office on public.inbox_threads;
create policy inbox_threads_office on public.inbox_threads
  for all
  using (public.crm_role() in ('owner', 'kantoor'))
  with check (public.crm_role() in ('owner', 'kantoor'));

drop policy if exists inbox_messages_office on public.inbox_messages;
create policy inbox_messages_office on public.inbox_messages
  for all
  using (public.crm_role() in ('owner', 'kantoor'))
  with check (public.crm_role() in ('owner', 'kantoor'));
