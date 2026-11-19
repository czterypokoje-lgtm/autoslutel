/*
 * A photo in a chat message — nullable, existing text-only messages unaffected.
 */
alter table public.chat_messages add column if not exists attachment_url text;

notify pgrst, 'reload schema';
