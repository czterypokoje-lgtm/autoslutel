-- ============================================================================
-- CRM fase 11: eigen profiel voor de monteur.
--
-- Run after 0011_product_content.sql. Idempotent.
--
-- A monteur maintains their own name, photo, phone, working area and whether
-- they are on or off duty right now. What they may NOT touch: `active`, which
-- is the office deciding whether someone still works here, and `user_id`, which
-- is the link between a login and a person.
-- ============================================================================

-- 1. Profile fields -----------------------------------------------------------
alter table public.technicians add column if not exists photo_url text;

/*
 * On or off duty right now — distinct from `technician_availability`, which is
 * about whole days planned ahead. This is the switch someone flips when they
 * finish for the evening, and it is what the planner needs at 23:00 when an
 * emergency call comes in.
 */
alter table public.technicians add column if not exists online       boolean not null default false;
alter table public.technicians add column if not exists online_since timestamptz;

create index if not exists technicians_online_idx on public.technicians (online)
  where online = true;

-- 2. Self-service, through a function rather than a table grant ---------------
/*
 * A monteur is never given UPDATE on `technicians`.
 *
 * The anon key ships in the page bundle, so anyone holding a monteur session
 * can call PostgREST directly. A row-scoped RLS policy would let them write
 * *any* column of their own row — including `active` (am I still employed) and
 * `user_id` (which login is me). Neither is theirs to decide.
 *
 * This function is the whole surface instead: security definer, fixed
 * parameters, and it can only ever reach the caller's own row. Null means
 * "leave this one alone", so a photo upload does not have to resend the
 * working area.
 */
create or replace function public.crm_update_own_profile(
  p_name       text default null,
  p_phone      text default null,
  p_werkgebied text[] default null,
  p_color      text default null,
  p_photo_url  text default null,
  p_online     boolean default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.technicians%rowtype;
begin
  select * into target
  from public.technicians
  where user_id = auth.uid();

  if not found then
    raise exception 'Geen monteur gekoppeld aan dit account'
      using errcode = 'P0002';
  end if;

  update public.technicians
  set
    name       = coalesce(nullif(trim(p_name), ''), name),
    phone      = coalesce(p_phone, phone),
    werkgebied = coalesce(p_werkgebied, werkgebied),
    color      = coalesce(
                   case when p_color ~ '^#[0-9a-fA-F]{6}$' then p_color else null end,
                   color
                 ),
    photo_url  = coalesce(p_photo_url, photo_url),
    online     = coalesce(p_online, online),
    -- Only moved when the switch actually changes, so "since" means what it says.
    online_since = case
                     when p_online is null or p_online = online then online_since
                     when p_online then now()
                     else null
                   end
  where id = target.id
  returning * into target;

  return jsonb_build_object(
    'id', target.id,
    'name', target.name,
    'phone', target.phone,
    'werkgebied', target.werkgebied,
    'color', target.color,
    'photo_url', target.photo_url,
    'online', target.online,
    'online_since', target.online_since
  );
end $$;

grant execute on function public.crm_update_own_profile(text, text, text[], text, text, boolean)
  to authenticated;

-- 3. Reading your own profile -------------------------------------------------
-- The existing technicians_read policy from 0004 already lets every signed-in
-- role read the list, so no new read path is needed.

notify pgrst, 'reload schema';
