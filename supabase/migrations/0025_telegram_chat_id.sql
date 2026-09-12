/*
 * Where a Telegram notification goes. Set once, by the technician themselves,
 * the moment they message the bot (see /api/telegram/webhook) — never typed
 * in by hand, since a chat id only exists once that conversation does.
 */
alter table public.technicians add column if not exists telegram_chat_id text;

notify pgrst, 'reload schema';
