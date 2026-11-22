create table if not exists public.kfc_deleted_conversations (
  conversation_id text primary key
);
alter table public.kfc_deleted_conversations enable row level security;
revoke all on table public.kfc_deleted_conversations from anon, authenticated;

create or replace function public.kfc_skip_deleted_conversation()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.metadata->'kfc_call_review'->>'agent_id' is null then
    return new;
  end if;
  perform pg_advisory_xact_lock(hashtextextended(new.conversation_id, 0));
  if exists(select 1 from public.kfc_deleted_conversations where conversation_id=new.conversation_id) then
    return null;
  end if;
  return new;
end;
$$;
revoke all on function public.kfc_skip_deleted_conversation() from public, anon, authenticated;
grant execute on function public.kfc_skip_deleted_conversation() to service_role;
grant select on public.kfc_deleted_conversations to service_role;
drop trigger if exists kfc_skip_deleted_conversation on public.agent_conversations;
create trigger kfc_skip_deleted_conversation
before insert or update on public.agent_conversations
for each row execute function public.kfc_skip_deleted_conversation();

create or replace function public.kfc_delete_bot_conversation(p_id text, p_agents text[])
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(p_id, 0));
  delete from public.agent_conversations
  where conversation_id=p_id and metadata->'kfc_call_review'->>'agent_id'=any(p_agents);
  if not found then
    return false;
  end if;
  insert into public.kfc_deleted_conversations(conversation_id) values(p_id) on conflict do nothing;
  return true;
end;
$$;
revoke all on function public.kfc_delete_bot_conversation(text,text[]) from public, anon, authenticated;
grant execute on function public.kfc_delete_bot_conversation(text,text[]) to service_role;
