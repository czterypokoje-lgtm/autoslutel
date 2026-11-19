-- ============================================================================
-- CRM fase 13: The Network (Discord-shaped).
--
-- Run after 0013_technician_platform.sql. Idempotent.
--
-- Servers (countries) -> Channels (region, make, general, dm) -> Messages.
-- A make channel automatically routes to technicians who declared coverage.
-- ============================================================================

-- 1. Types -------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'chat_channel_type') then
    create type public.chat_channel_type as enum (
      'general',
      'make',
      'region',
      'dm'
    );
  end if;
end $$;

-- 2. Servers -----------------------------------------------------------------
create table if not exists public.chat_servers (
  id         uuid primary key default gen_random_uuid(),
  name       text not null, -- e.g. 'Nederland'
  created_at timestamptz not null default now()
);

-- Insert initial server
insert into public.chat_servers (id, name)
values ('00000000-0000-0000-0000-000000000001', 'Nederland')
on conflict (id) do nothing;

-- 3. Update Technicians ------------------------------------------------------
alter table public.technicians 
  add column if not exists server_id uuid references public.chat_servers (id) on delete set null;

-- Set existing technicians to Nederland
update public.technicians 
set server_id = '00000000-0000-0000-0000-000000000001'
where server_id is null;

-- 4. Channels ----------------------------------------------------------------
create table if not exists public.chat_channels (
  id          uuid primary key default gen_random_uuid(),
  server_id   uuid not null references public.chat_servers (id) on delete cascade,
  name        text not null,
  slug        text not null,
  type        public.chat_channel_type not null default 'general',
  target_make text, -- Only for 'make' channels, e.g. 'Volkswagen'
  created_at  timestamptz not null default now(),
  unique (server_id, slug)
);

-- Insert default channels for Nederland
insert into public.chat_channels (id, server_id, name, slug, type)
values 
  ('00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000001', 'Algemeen', 'algemeen', 'general'),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', 'Vraagbaak', 'vraagbaak', 'general')
on conflict (server_id, slug) do nothing;

insert into public.chat_channels (id, server_id, name, slug, type, target_make)
values 
  ('00000000-0000-0000-0000-000000000200', '00000000-0000-0000-0000-000000000001', 'VW Groep', 'vw-groep', 'make', 'Volkswagen')
on conflict (server_id, slug) do nothing;

-- 5. Channel Members (for Region and DM) -------------------------------------
create table if not exists public.chat_channel_members (
  channel_id    uuid not null references public.chat_channels (id) on delete cascade,
  technician_id uuid not null references public.technicians (id) on delete cascade,
  joined_at     timestamptz not null default now(),
  primary key (channel_id, technician_id)
);

-- 6. Messages ----------------------------------------------------------------
create table if not exists public.chat_messages (
  id            uuid primary key default gen_random_uuid(),
  channel_id    uuid not null references public.chat_channels (id) on delete cascade,
  -- Sender is polymorphic: either a technician or an office user
  technician_id uuid references public.technicians (id) on delete set null,
  user_id       uuid references auth.users (id) on delete set null,
  
  parent_id     uuid references public.chat_messages (id) on delete cascade,
  content       text not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz
);

create index if not exists chat_messages_channel_idx on public.chat_messages (channel_id, created_at);
create index if not exists chat_messages_parent_idx on public.chat_messages (parent_id) where parent_id is not null;

-- 7. Row Level Security -------------------------------------------------------

alter table public.chat_servers         enable row level security;
alter table public.chat_channels        enable row level security;
alter table public.chat_channel_members enable row level security;
alter table public.chat_messages        enable row level security;

grant select, insert, update, delete on public.chat_servers         to authenticated;
grant select, insert, update, delete on public.chat_channels        to authenticated;
grant select, insert, update, delete on public.chat_channel_members to authenticated;
grant select, insert, update, delete on public.chat_messages        to authenticated;

-- Servers:
create policy chat_servers_read on public.chat_servers
  for select to authenticated
  using (
    public.crm_role() in ('owner', 'kantoor')
    or id in (select server_id from public.technicians where user_id = auth.uid())
  );

create policy chat_servers_write on public.chat_servers
  for all to authenticated
  using (public.crm_role() in ('owner', 'kantoor'));

-- Channels:
-- A technician can see channels in their server.
create policy chat_channels_read on public.chat_channels
  for select to authenticated
  using (
    public.crm_role() in ('owner', 'kantoor')
    or server_id in (select server_id from public.technicians where user_id = auth.uid())
  );

create policy chat_channels_write on public.chat_channels
  for all to authenticated
  using (public.crm_role() in ('owner', 'kantoor'));

-- Members:
create policy chat_channel_members_read on public.chat_channel_members
  for select to authenticated
  using (
    public.crm_role() in ('owner', 'kantoor')
    or technician_id = public.my_technician_id()
  );

create policy chat_channel_members_write on public.chat_channel_members
  for all to authenticated
  using (
    public.crm_role() in ('owner', 'kantoor')
    or technician_id = public.my_technician_id()
  );

-- Messages:
-- Office can read/write all.
-- Technician can read/write if they have access to the channel.
create or replace function public.can_access_channel(p_channel_id uuid)
returns boolean
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_tech_id uuid;
  v_type text;
  v_make text;
  v_server uuid;
begin
  if public.crm_role() in ('owner', 'kantoor') then
    return true;
  end if;

  v_tech_id := public.my_technician_id();
  if v_tech_id is null then return false; end if;

  select type, target_make, server_id into v_type, v_make, v_server
  from public.chat_channels where id = p_channel_id;

  if v_server is null then return false; end if;
  
  -- Must be in the right server
  if not exists (select 1 from public.technicians where id = v_tech_id and server_id = v_server) then
    return false;
  end if;

  if v_type = 'general' then
    return true;
  elsif v_type = 'make' then
    return exists (
      select 1 from public.technician_coverage 
      where technician_id = v_tech_id and lower(make) = lower(v_make)
    );
  elsif v_type in ('region', 'dm') then
    return exists (
      select 1 from public.chat_channel_members 
      where channel_id = p_channel_id and technician_id = v_tech_id
    );
  end if;

  return false;
end $$;

grant execute on function public.can_access_channel(uuid) to authenticated;

create policy chat_messages_read on public.chat_messages
  for select to authenticated
  using (public.can_access_channel(channel_id));

create policy chat_messages_insert on public.chat_messages
  for insert to authenticated
  with check (
    public.can_access_channel(channel_id)
    and (
      (public.crm_role() = 'monteur' and technician_id = public.my_technician_id())
      or (public.crm_role() in ('owner', 'kantoor') and user_id = auth.uid())
    )
  );

create policy chat_messages_update on public.chat_messages
  for update to authenticated
  using (
    (public.crm_role() = 'monteur' and technician_id = public.my_technician_id())
    or (public.crm_role() in ('owner', 'kantoor') and user_id = auth.uid())
  );

-- 8. Enable Realtime
-- This tells Supabase to broadcast INSERTs for this table to connected clients
alter publication supabase_realtime add table public.chat_messages;
