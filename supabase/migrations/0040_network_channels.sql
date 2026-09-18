/*
 * The network, stocked: three countries, twenty makes, and somewhere to put
 * the problems.
 *
 * Nederland had three channels — Algemeen, Vraagbaak and one "VW Groep" —
 * which is not a network a monteur opens twice. A channel per make is what
 * makes it worth reading: the person who has already done a locked Kia this
 * month is the one who answers fastest.
 *
 * Germany and Belgium get the identical structure rather than a stripped
 * one. A server that starts half-built is a server nobody joins, and the
 * cost of an empty channel is a line in a sidebar.
 *
 * Channel names stay Dutch on all three. The CRM is Dutch throughout and the
 * monteurs reading it are Dutch-speaking; translating only the German
 * server's channel list would split the vocabulary without moving anyone
 * closer to a German-speaking network. Worth revisiting when there is
 * actually a monteur in Germany.
 */

/* A place for the problems themselves, separate from general chatter. */
do $$
begin
  if not exists (
    select 1 from pg_enum
    where enumtypid = 'public.chat_channel_type'::regtype and enumlabel = 'probleem'
  ) then
    alter type public.chat_channel_type add value 'probleem';
  end if;
end $$;
