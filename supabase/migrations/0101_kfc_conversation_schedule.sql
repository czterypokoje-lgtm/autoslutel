create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

create or replace function public.kfc_enqueue_conversation_sync()
returns void language plpgsql security definer set search_path = '' as $$
declare endpoint text; trigger_key text;
begin
  if not exists (select 1 from vault.decrypted_secrets where name='kfc_history_sync_enabled' and decrypted_secret='true') then
    return;
  end if;
  select decrypted_secret into endpoint from vault.decrypted_secrets where name='kfc_history_sync_url';
  select decrypted_secret into trigger_key from vault.decrypted_secrets where name='kfc_history_trigger_key';
  if endpoint is null or trigger_key is null then
    return;
  end if;
  perform net.http_post(
    url=>endpoint,
    headers=>jsonb_build_object('content-type','application/json','x-kfc-sync-key',trigger_key),
    body=>'{}'::jsonb,
    timeout_milliseconds=>30000
  );
end;
$$;
revoke all on function public.kfc_enqueue_conversation_sync() from public, anon, authenticated;

select cron.schedule('kfc-conversation-sync-half-hour', '*/30 * * * *', 'select public.kfc_enqueue_conversation_sync()');
