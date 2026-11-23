/*
 * Whose agent was it, and was anyone there?
 *
 * ElevenLabs posts every agent in the workspace to one webhook, so the
 * KeyForCars and KEY24 agents' chats arrived in Autosleutel24's Gesprekken as
 * channel 'unknown' (source react_sdk). Checked on 21 Nov 2026 from their
 * summaries: KeyForCars demo chats ("contacted KeyForCars…", "Key for
 * Cars…"), KEY24 tests ("Key twenty-four oto anahtar servisi") and sessions
 * where the agent greeted and nobody answered.
 *
 * From now on the webhook stores agent_id and files any agent not listed in
 * ELEVENLABS_AGENT_IDS as 'extern'. This migration adds the column and sorts
 * the old rows by their summary, since they were stored without an agent id:
 *   extern  another brand's agent, kept but not shown in Gesprekken
 *   leeg    the customer never said anything (one turn, the greeting)
 * What is left as 'unknown' shows under "Overig" for a person to judge.
 *
 * Run after 0107. Idempotent.
 */
alter table public.agent_conversations add column if not exists agent_id text;

update public.agent_conversations
   set channel = 'extern'
 where channel = 'unknown'
   and (summary ilike '%keyforcars%'
     or summary ilike '%key for cars%'
     or summary ilike '%key twenty-four%'
     or summary ilike '%key twenty four%'
     or summary ilike '%key vierentwintig%'
     or summary ilike '%key24%');

update public.agent_conversations
   set channel = 'leeg'
 where channel = 'unknown'
   and jsonb_array_length(coalesce(transcript, '[]'::jsonb)) <= 1;

select channel, count(*) from public.agent_conversations group by 1 order by 2 desc;
