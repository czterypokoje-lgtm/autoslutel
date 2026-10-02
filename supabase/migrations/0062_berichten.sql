-- ============================================================================
-- CRM fase 62: één postvak voor alle kanalen.
--
-- Run after 0061. Idempotent: running it twice does nothing the second time.
--
-- The CRM can already see two channels. The web forms post to /api/leads, and
-- the ElevenLabs agent's finished phone and WhatsApp conversations land in
-- `agent_conversations`. Email is send-only (src/lib/email.ts has no inbound
-- counterpart), Instagram and Facebook are not connected at all, and nothing
-- anywhere can be *answered* from inside the CRM — /admin/gesprekken is a
-- transcript viewer with no composer.
--
-- Two tables, and one idea holding them together: a conversation is identified
-- by (channel, external_id). Email keys on the sender's address, WhatsApp and
-- phone on E.164, Instagram on the IGSID, Messenger on the PSID. That single
-- key is what lets a reply find the thread it belongs to without any
-- plus-addressing, subdomain MX or Message-ID bookkeeping.
--
-- Named `inbox_*` rather than `conversations`/`messages` because this database
-- already has `agent_conversations` (the ElevenLabs call log) and
-- `chat_messages` (the technicians' own network). Three things called some
-- variation of "messages" is how the wrong one gets queried at three in the
-- morning.
--
-- `agent_conversations` is not migrated and not dropped. The ElevenLabs
-- webhook writes to both, so phone and WhatsApp show up here from day one and
-- /admin/gesprekken keeps working untouched.
-- ============================================================================


-- 1. The channels -------------------------------------------------------------
/*
 * An enum, not free text. `leads.source` is free text and the only list of
 * valid values lives in a TSX file (`admin/leads/page.tsx:25-34`) — which is
 * how 'unknown' became the most common source. A channel is a closed set:
 * there is no fifth way a message arrives that the code would not also need
 * teaching about.
 */
do $$
begin
  if not exists (select 1 from pg_type where typname = 'inbox_channel') then
    create type public.inbox_channel as enum (
      'email',
      'whatsapp',
      'instagram',
      'messenger',  -- Facebook Messenger
      'phone',      -- the ElevenLabs telefoniste
      'sms'
    );
  end if;
end $$;


-- 2. One thread per person per channel ----------------------------------------
create table if not exists public.inbox_conversations (
  id uuid primary key default gen_random_uuid(),

  channel public.inbox_channel not null,

  /*
   * Who this is, in whatever identifier the channel gives us: a lowercased
   * email address, an E.164 number via toE164NL(), an Instagram IGSID, a
   * Messenger PSID. Never normalise one channel's id with another's rules.
   */
  external_id text not null,

  /* Whatever name the channel volunteered. Often null, and that is fine. */
  display_name text,

  /*
   * The lead and job this thread is about, when we can tell. Both nullable
   * and both `set null`: a conversation outlives the lead it produced, and a
   * thread with no lead yet is the normal state of a first message.
   */
  lead_id uuid references public.leads (id) on delete set null,
  job_id  uuid references public.jobs (id) on delete set null,

  assigned_to uuid references auth.users (id) on delete set null,

  state text not null default 'open' check (state in ('open', 'snoozed', 'closed')),

  /*
   * Whether the AI may answer this thread. The office switches it off to take
   * a conversation over; that toggle is the entire handover mechanism, which
   * is why it lives on the conversation and not in a separate table.
   */
  ai_enabled boolean not null default true,

  /* Email only — the other channels have no subject line. */
  subject text,

  /*
   * Maintained by the trigger below, not by callers. Denormalised on purpose:
   * the list screen orders by last activity, and a correlated max() over
   * inbox_messages for every row is the query that gets slow first.
   */
  last_message_at timestamptz,
  last_inbound_at timestamptz,
  unread boolean not null default true,

  /*
   * The first line of the newest message, for the thread list.
   *
   * Denormalised for the same reason last_message_at is: the alternative is a
   * second query over inbox_messages for every row on screen, and bounding
   * that query is what gets it wrong — one WhatsApp transcript is twenty rows,
   * so any sane limit on a joined read starves the older threads of a snippet.
   */
  last_snippet text,

  created_at timestamptz not null default now(),

  /* The whole design in one line. */
  unique (channel, external_id)
);

create index if not exists inbox_conversations_recent_idx
  on public.inbox_conversations (last_message_at desc);

create index if not exists inbox_conversations_lead_idx
  on public.inbox_conversations (lead_id);

/* The default screen: open threads, newest first. */
create index if not exists inbox_conversations_open_idx
  on public.inbox_conversations (last_message_at desc)
  where state = 'open';

comment on table public.inbox_conversations is
  'One thread per (channel, external_id) across email, WhatsApp, Instagram, Messenger, phone and SMS. Office only.';


-- 3. The messages themselves --------------------------------------------------
create table if not exists public.inbox_messages (
  id uuid primary key default gen_random_uuid(),

  conversation_id uuid not null
    references public.inbox_conversations (id) on delete cascade,

  direction text not null check (direction in ('in', 'out')),

  /*
   * Three authors, not two. 'ai' and 'human' are both outbound but they are
   * not the same thing: the first question after a conversation goes wrong is
   * always whether a person or the agent said it.
   */
  author text not null check (author in ('customer', 'ai', 'human')),

  body text,

  /*
   * [{ url, name, type }] — files are referenced, never stored in Postgres.
   *
   * The array check is not pedantry: the trigger below calls
   * jsonb_array_length() on this, which errors on an object, and the value
   * arrives from a provider's webhook. A constraint here turns a bad payload
   * into a rejected row instead of a trigger failure that takes the whole
   * insert down with no useful message.
   */
  attachments jsonb not null default '[]'::jsonb
    check (jsonb_typeof(attachments) = 'array'),

  /* The provider's own id, where there is one. Null for a transcript turn. */
  provider_message_id text,

  sent_by uuid references auth.users (id) on delete set null,

  /* Why a send failed, kept on the row rather than only in a log. */
  error text,

  created_at timestamptz not null default now(),

  /*
   * Makes a webhook retry a no-op. Postgres treats NULLs as distinct in a
   * unique constraint, so this de-duplicates provider-stamped messages
   * without blocking the many transcript turns that carry no id at all.
   */
  unique (conversation_id, provider_message_id)
);

create index if not exists inbox_messages_thread_idx
  on public.inbox_messages (conversation_id, created_at);

comment on table public.inbox_messages is
  'Insert-only message log for inbox_conversations. No update policy: a sent message is a record.';


-- 4. The conversation keeps its own books -------------------------------------
/*
 * A trigger rather than application code, for the same reason
 * job_payment_to_ledger() is one (0007): there are already four callers that
 * insert a message — the email webhook, the reply action, the ElevenLabs
 * webhook and, later, the Meta webhook — and the day one of them forgets to
 * bump last_message_at is the day a thread stops appearing at the top of the
 * list with no clue why.
 */
create or replace function public.inbox_touch_conversation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.inbox_conversations
  set last_message_at = new.created_at,
      last_snippet = coalesce(
        nullif(left(regexp_replace(coalesce(new.body, ''), '\s+', ' ', 'g'), 160), ''),
        case when jsonb_array_length(new.attachments) > 0
               then '[bijlage]'
             else '[leeg bericht]' end
      ),
      last_inbound_at = case when new.direction = 'in'
                          then new.created_at
                          else last_inbound_at end,
      /*
       * An inbound message makes the thread unread. An outbound one does not
       * mark it read: the person who replied is not necessarily the person who
       * still has to look at it.
       */
      unread = case when new.direction = 'in' then true else unread end
  where id = new.conversation_id;

  return new;
end $$;

drop trigger if exists inbox_touch_conversation_trg on public.inbox_messages;
create trigger inbox_touch_conversation_trg
  after insert on public.inbox_messages
  for each row execute function public.inbox_touch_conversation();


-- 5. Who may read a customer's messages ---------------------------------------
/*
 * Office only, matching public.leads and public.lead_notes. A monteur gets the
 * job they were offered, never the conversation that sold it.
 *
 * The conversation gets select/insert/update — assigning, closing and
 * toggling the assistant are all updates. A message gets select/insert and
 * nothing more.
 *
 * None of this is what lets the webhooks write: those hold the service-role
 * key (src/lib/supabase/admin.ts) and bypass RLS entirely. The insert
 * policies here are for the reply action, which writes through the signed-in
 * person's own session.
 *
 * REVOKE before GRANT, and GRANT at all: Postgres checks table privileges
 * before row policies, so a policy without its grant denies everyone rather
 * than just the wrong people — the lesson migration 0003 paid for once
 * already.
 */
alter table public.inbox_conversations enable row level security;
alter table public.inbox_messages      enable row level security;

drop policy if exists inbox_conversations_read on public.inbox_conversations;
create policy inbox_conversations_read on public.inbox_conversations
  for select
  using (public.crm_role() in ('owner', 'kantoor'));

drop policy if exists inbox_conversations_insert on public.inbox_conversations;
create policy inbox_conversations_insert on public.inbox_conversations
  for insert
  with check (public.crm_role() in ('owner', 'kantoor'));

/* Assigning, closing, toggling the AI, marking read — all updates. */
drop policy if exists inbox_conversations_update on public.inbox_conversations;
create policy inbox_conversations_update on public.inbox_conversations
  for update
  using (public.crm_role() in ('owner', 'kantoor'));

drop policy if exists inbox_messages_read on public.inbox_messages;
create policy inbox_messages_read on public.inbox_messages
  for select
  using (public.crm_role() in ('owner', 'kantoor'));

drop policy if exists inbox_messages_insert on public.inbox_messages;
create policy inbox_messages_insert on public.inbox_messages
  for insert
  with check (public.crm_role() in ('owner', 'kantoor'));

/*
 * No update and no delete policy on inbox_messages, on purpose and for the
 * same reason lead_notes has none (0047): what was said to a customer is a
 * record. Deletion happens in exactly one place — crm_erase_customer() below,
 * which is security definer and therefore not bound by these policies.
 */

revoke all on public.inbox_conversations from authenticated;
grant select, insert, update on public.inbox_conversations to authenticated;

revoke all on public.inbox_messages from authenticated;
grant select, insert on public.inbox_messages to authenticated;


-- 6. Realtime -----------------------------------------------------------------
/*
 * Broadcast INSERTs so a reply typed in one browser appears in another without
 * a refresh, the way the technicians' chat already does (0014 line 220).
 *
 * Guarded, unlike 0014: `alter publication ... add table` on a table that is
 * already a member raises, which would make a second paste of this file fail
 * halfway through. Every migration in this repo has to survive being run
 * twice.
 */
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'inbox_messages'
     )
  then
    /* Through execute(): a utility statement in a plpgsql block is safer run
       dynamically than relied on to be parsed directly. */
    execute 'alter publication supabase_realtime add table public.inbox_messages';
  end if;
end $$;


-- 7. Erasure has to reach the new tables too ----------------------------------
/*
 * "Verwijder mijn gegevens" is a legal right, and crm_erase_customer() (0006)
 * is the single transaction that answers it. Two new tables holding the actual
 * words a customer wrote are exactly the kind of thing that gets missed: the
 * leads row would go and the message bodies would stay.
 *
 * Replaced in full rather than patched, because that is the only way to change
 * a function. The lead and job halves are unchanged from 0006 — if that file
 * is ever re-pasted after this one it will silently revert this, so re-run
 * this section afterwards.
 *
 * Order matters: the email threads are found *through* the leads, so they have
 * to be deleted before the leads are.
 */
create or replace function public.crm_erase_customer(target_phone text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  erased_leads         int;
  erased_jobs          int;
  erased_conversations int;
begin
  if public.crm_role() not in ('owner', 'kantoor') then
    raise exception 'Geen toegang' using errcode = '42501';
  end if;

  if target_phone is null or length(trim(target_phone)) < 5 then
    raise exception 'Ongeldig telefoonnummer' using errcode = '22023';
  end if;

  /*
   * Three ways a thread belongs to this person, and all three are needed:
   *   - the phone-bearing channels key on the number itself;
   *   - email keys on an address that only appears on the lead;
   *   - Instagram and Messenger key on an id that means nothing outside Meta,
   *     so the only link is the lead somebody attached by hand.
   * inbox_messages follows by cascade.
   */
  delete from public.inbox_conversations
  where (
      channel in ('whatsapp', 'phone', 'sms')
      and external_id = target_phone
    )
    or (
      channel = 'email'
      and external_id in (
        select lower(btrim(email))
        from public.leads
        where phone_e164 = target_phone
          and email is not null
          and btrim(email) <> ''
      )
    )
    or lead_id in (
      select id from public.leads where phone_e164 = target_phone
    );
  get diagnostics erased_conversations = row_count;

  /*
   * Jobs are anonymised rather than deleted: the work happened, the invoice
   * for it has to stay for the seven-year retention, and an accounting record
   * with a hole in it is its own problem. What goes is everything that
   * identifies a person.
   */
  update public.jobs
  set customer_name = null,
      customer_phone = null,
      street = null,
      notes = null
  where customer_phone = target_phone;
  get diagnostics erased_jobs = row_count;

  delete from public.leads where phone_e164 = target_phone;
  get diagnostics erased_leads = row_count;

  return jsonb_build_object(
    'leads_verwijderd', erased_leads,
    'klussen_geanonimiseerd', erased_jobs,
    'gesprekken_verwijderd', erased_conversations
  );
end $$;

grant execute on function public.crm_erase_customer(text) to authenticated;
