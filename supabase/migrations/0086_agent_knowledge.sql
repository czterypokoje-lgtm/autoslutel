/*
 * One shared knowledge table for every AI agent.
 *
 * The phone/WhatsApp agent and the webshop chat each carried their own copy of
 * the facts, and the copies disagreed (prices, arrival times, warranty). Nobody
 * learned from the conversations kept in agent_conversations either.
 *
 * All agents now read this table at answer time. A row is usable as a fact only
 * when status = 'confirmed', and only the owner confirms: the weekly review job
 * may report gaps ('proposed' / 'unknown' rows) but never promotes them. An
 * unconfirmed row tells the agent what NOT to answer.
 */

create table if not exists public.agent_knowledge (
  id uuid primary key default gen_random_uuid(),

  /* Stable id, e.g. 'payment.onsite_methods' or 'gap.arrival'. Unique so the
     seed and the review job can upsert without duplicating. */
  key text not null unique,

  topic text not null check (topic in (
    'prices', 'arrival', 'payment', 'warranty', 'service_area', 'hours',
    'documents', 'duration', 'cancellation', 'discount', 'shipping',
    'returns', 'order_status', 'key_types', 'company', 'other'
  )),

  /* What customers ask, in English. */
  question text not null,

  /* The fact an agent may state, in English. Null while unknown. */
  answer text,

  /* How to behave, e.g. 'never promise an arrival time'. May be null. */
  rule text,

  status text not null default 'proposed'
    check (status in ('confirmed', 'proposed', 'unknown', 'retired')),

  asked_count integer not null default 0,
  last_asked_at timestamptz,

  /* One short, redacted customer phrasing. */
  example text check (example is null or char_length(example) <= 200),

  /* Where it came from: 'owner 2026-11-12', 'kb F33', 'review 2026-W46'. */
  source text,

  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  /* A confirmed row with nothing to say would be a fact that says nothing. */
  constraint agent_knowledge_confirmed_has_content
    check (status <> 'confirmed' or answer is not null or rule is not null)
);

create index if not exists agent_knowledge_status_idx on public.agent_knowledge (status);
create index if not exists agent_knowledge_topic_idx on public.agent_knowledge (topic);

comment on table public.agent_knowledge is
  'Shared facts and rules for all AI agents. Only status=confirmed rows are stated to customers; only the owner confirms.';

alter table public.agent_knowledge enable row level security;

/*
 * Office only, same as agent_conversations. No write policies: the API routes
 * write with the service-role key, which bypasses RLS.
 */
drop policy if exists agent_knowledge_read on public.agent_knowledge;
create policy agent_knowledge_read on public.agent_knowledge
  for select
  using (public.crm_role() in ('owner', 'kantoor'));
