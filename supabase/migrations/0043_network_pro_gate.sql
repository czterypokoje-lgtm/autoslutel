/*
 * The network becomes a Pro feature: the door is glass.
 *
 * A monteur on starter keeps seeing every server, every channel name and how
 * many people are online in each — and cannot open any of them. That is the
 * point: a locked door you cannot see through sells nothing, and a list of
 * twenty make channels with people talking behind them is the argument for
 * upgrading.
 *
 * 0042 opened channel *listing* to every monteur and this keeps it that way.
 * What changes is reading the messages, which now needs a pro or premium
 * subscription — or a verified badge, for the people who were here before
 * there was anything to buy.
 *
 * NOTE: every one of the six current monteurs is on 'starter', so applying
 * this closes the network to all of them until they are upgraded or marked
 * verified. That is the intended behaviour, not an accident, but it is worth
 * knowing before running it.
 */

/*
 * Verified: someone vouched for by the office rather than by a payment.
 * Kept separate from `active` on purpose — active means "send this person
 * work", which is a different question from "let this person into the
 * network", and collapsing the two would mean pausing someone's jobs also
 * silences them in the chat.
 */
alter table public.technicians
  add column if not exists verified boolean not null default false;

comment on column public.technicians.verified is
  'Office-granted access to the network without a paid tier. Not the same as active, which governs job dispatch.';


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
  v_allowed boolean;
begin
  if public.crm_role() in ('owner', 'kantoor') then
    return true;
  end if;

  v_tech_id := public.my_technician_id();
  if v_tech_id is null then return false; end if;

  select type into v_type from public.chat_channels where id = p_channel_id;
  if v_type is null then return false; end if;

  /*
   * Pro, premium, or vouched for. Read once and applied to every channel
   * type below, so there is exactly one definition of "may read the
   * network" rather than the same condition repeated per branch.
   */
  select
    coalesce(t.verified, false)
    or coalesce(s.tier in ('pro', 'premium'), false)
  into v_allowed
  from public.technicians t
  left join public.technician_subscription s on s.technician_id = t.id
  where t.id = v_tech_id;

  if not coalesce(v_allowed, false) then
    return false;
  end if;

  if v_type in ('general', 'make', 'probleem') then
    return true;
  end if;

  /* A named group or a private conversation still needs membership. */
  if v_type in ('region', 'dm') then
    return exists (
      select 1 from public.chat_channel_members
      where channel_id = p_channel_id and technician_id = v_tech_id
    );
  end if;

  return false;
end $$;

grant execute on function public.can_access_channel(uuid) to authenticated;


/*
 * How many people are actually online per server.
 *
 * A view rather than a count in the page, because chat_servers is readable
 * by every monteur while technicians is not — a monteur may know that four
 * people are online in Nederland without being able to list who they are.
 * Counts only active technicians: someone paused should not pad the number.
 */
create or replace view public.chat_server_presence as
select
  s.id                                                      as server_id,
  s.name                                                    as server_name,
  count(t.id) filter (where t.online and t.active)          as online_count,
  count(t.id) filter (where t.active)                       as member_count
from public.chat_servers s
left join public.technicians t on t.server_id = s.id
group by s.id, s.name;

grant select on public.chat_server_presence to authenticated;
