/*
 * Where an office/owner user's Telegram notifications go — the same idea as
 * technicians.telegram_chat_id, but office users have no profile table of
 * their own to add a column to. Written only by the Telegram webhook (via
 * the service-role client) the moment someone hits Start on the bot, same
 * as the technician flow — never by a browser session, hence no write
 * policy for `authenticated`.
 */
create table if not exists public.admin_telegram (
  user_id uuid primary key references auth.users (id) on delete cascade,
  telegram_chat_id text not null,
  connected_at timestamptz not null default now()
);

alter table public.admin_telegram enable row level security;

drop policy if exists admin_telegram_own on public.admin_telegram;
create policy admin_telegram_own on public.admin_telegram
  for select
  using (user_id = auth.uid());

notify pgrst, 'reload schema';
