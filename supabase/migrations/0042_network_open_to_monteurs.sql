/*
 * Opens the network to monteurs.
 *
 * Three things were keeping a technician out of most of it.
 *
 * 1. A monteur could only see their own server. That was deliberate in 0014
 *    — "a technician in Antwerp has no business in the Dutch pricing
 *    channel" — but it is the wrong call for what this is actually for. The
 *    network exists so the person who did a locked Kia last week answers the
 *    one stuck on it now, and that person is as likely to be over a border
 *    as not. Pricing and VAT still differ per country; the channels do not
 *    move money, they move knowledge.
 *
 * 2. Every 'probleem' channel was invisible. can_access_channel() handles
 *    'general', 'make', 'region' and 'dm' and falls through to false for
 *    anything else, and 0040 added 'probleem' without touching it. Six
 *    channels per server that no monteur could open.
 *
 * 3. A make channel required coverage for that make. Backwards for a help
 *    channel: the monteur who has never done a Kia is exactly the one who
 *    needs to read #kia. Coverage says what you are offered as paid work,
 *    not what you may ask about.
 *
 * Region and DM channels stay membership-gated. Those are a named group and
 * a private conversation, and opening them would not be widening a network,
 * it would be reading someone's messages.
 */

drop policy if exists chat_servers_read on public.chat_servers;
create policy chat_servers_read on public.chat_servers
  for select to authenticated
  using (public.crm_role() in ('owner', 'kantoor', 'monteur'));

drop policy if exists chat_channels_read on public.chat_channels;
create policy chat_channels_read on public.chat_channels
  for select to authenticated
  using (public.crm_role() in ('owner', 'kantoor', 'monteur'));


create or replace function public.can_access_channel(p_channel_id uuid)
returns boolean
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_tech_id uuid;
  v_type    text;
begin
  if public.crm_role() in ('owner', 'kantoor') then
    return true;
  end if;

  v_tech_id := public.my_technician_id();
  if v_tech_id is null then return false; end if;

  select type into v_type from public.chat_channels where id = p_channel_id;
  if v_type is null then return false; end if;

  /*
   * Open to every monteur, whatever server it belongs to and whether or not
   * they cover the make. These are the channels people come here to read.
   */
  if v_type in ('general', 'make', 'probleem') then
    return true;
  end if;

  /* A named group, or a private conversation: membership decides. */
  if v_type in ('region', 'dm') then
    return exists (
      select 1 from public.chat_channel_members
      where channel_id = p_channel_id and technician_id = v_tech_id
    );
  end if;

  return false;
end $$;

grant execute on function public.can_access_channel(uuid) to authenticated;
