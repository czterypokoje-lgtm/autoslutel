/*
 * Keep the AI agent's conversations.
 *
 * Until now they were forwarded and forgotten: the ElevenLabs post-call webhook
 * pushed outcome, summary and transcript to Telegram and kept nothing. The
 * office could read a call once, in a chat app, and never again — no search, no
 * link to the lead it produced, and the whole history sitting on a third party's
 * server where it disappears the day the subscription lapses.
 *
 * This is also the only capture that cannot be backfilled. A call not stored
 * today is gone; there is no export to run later.
 *
 * Covers both channels. ElevenLabs fires the same post_call_transcription event
 * for a WhatsApp conversation as for a phone call, so `channel` is what tells
 * them apart rather than two tables that would drift.
 */

create table if not exists public.agent_conversations (
  id uuid primary key default gen_random_uuid(),

  /*
   * ElevenLabs' own id, and the reason this is unique: webhooks retry. Without
   * it a delivery retried after a timeout becomes a second copy of the same
   * conversation, and the office cannot tell which is real.
   */
  conversation_id text not null unique,

  /* 'phone' | 'whatsapp' | 'unknown' — derived from the payload, not trusted
     blindly, because a missing field should not invent a channel. */
  channel text not null default 'unknown',

  /*
   * The customer's number where the payload carries one. Nullable on purpose:
   * a WhatsApp conversation may not expose it, and a null is honest where a
   * placeholder would be a lie that later joins against nothing.
   */
  phone text,

  status  text,
  outcome text,
  duration_secs integer,
  summary text,

  /* The turns, as ElevenLabs sends them: [{ role, message }, ...]. */
  transcript jsonb,

  /* Everything else from the payload's metadata. Cheap to keep, and it is the
     difference between answering a new question next month and wishing we had
     stored one more field. */
  metadata jsonb,

  created_at timestamptz not null default now()
);

/* The two lookups the CRM actually does: newest first, and "this customer". */
create index if not exists agent_conversations_created_idx
  on public.agent_conversations (created_at desc);

create index if not exists agent_conversations_phone_idx
  on public.agent_conversations (phone)
  where phone is not null;

comment on table public.agent_conversations is
  'Transcripts and summaries from the ElevenLabs agent, phone and WhatsApp. Written by /api/elevenlabs/webhook.';


alter table public.agent_conversations enable row level security;

/*
 * Office only. These transcripts are recordings of customers talking about
 * their car, their address and sometimes their whereabouts — a monteur needs
 * the job, not the conversation that produced it.
 *
 * No insert policy: the webhook writes with the service-role key, which
 * bypasses RLS. Leaving insert unpolicied means nothing else can write here.
 */
drop policy if exists agent_conversations_read on public.agent_conversations;
create policy agent_conversations_read on public.agent_conversations
  for select
  using (public.crm_role() in ('owner', 'kantoor'));
