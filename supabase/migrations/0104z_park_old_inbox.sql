/*
 * Park the abandoned 0062 inbox table so 0105 can create its own.
 *
 * An earlier inbox design (0062_berichten.sql, 2 Oct 2026, on another branch)
 * was applied to the database and left a table public.inbox_messages keyed on
 * conversation_id. 0105 needs that name for a different table keyed on
 * thread_id, and "create table if not exists" silently kept the old one, so
 * 0105 failed with: column "thread_id" does not exist. No code on main or
 * studio-shell reads the old table (checked 21 Nov 2026).
 *
 * Renamed, not dropped: whatever it holds stays, under inbox_messages_0062.
 * Its indexes are renamed too, because inbox_messages_pkey and friends are
 * schema-wide names the new table needs. inbox_conversations does not clash
 * and is left alone.
 *
 * Only acts on the old shape (a conversation_id column), so it is a no-op on
 * a database that never had 0062. Run before 0105. Idempotent.
 */
do $$
declare
  r record;
begin
  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'inbox_messages' and column_name = 'conversation_id'
  ) then
    alter table public.inbox_messages rename to inbox_messages_0062;
    for r in select indexname from pg_indexes where schemaname = 'public' and tablename = 'inbox_messages_0062' loop
      execute format('alter index public.%I rename to %I', r.indexname, left(r.indexname, 58) || '_0062');
    end loop;
  end if;
end $$;

select to_regclass('public.inbox_messages_0062') is not null as old_table_parked;
