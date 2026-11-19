-- ============================================================================
-- CRM fase 70: koppelen met een code die verloopt, niet met een id.
--
-- Run after 0069_bid_is_a_cost_not_a_price.sql. Idempotent.
--
-- De bot koppelde een chat aan een monteur met `/start <technician_id>`, en
-- aan kantoor met `/start admin_<user_id>`. Er werd niets gecontroleerd: wie
-- dat id kende, kreeg die identiteit.
--
-- Een uuid is een aanduiding, geen geheim. Technician-ids staan in URL's van
-- het CRM, in opslagpaden van bonnen (facturen/<technician_id>/...) en in
-- elke export die ooit over een scherm is gedeeld. Wie er een te pakken
-- kreeg, kon zijn eigen Telegram eraan koppelen en daarna de klussen, het
-- saldo, de bus, de facturen en de uitgaven van die monteur lezen, en op zijn
-- aanbod bieden. Met een admin-id was het erger: klussen gunnen, klussen
-- aanmaken, uitgaven goedkeuren en elke lead meelezen.
--
-- Dit vervangt het id door een code die eenmalig is en verloopt. De code zegt
-- niets over wie je bent; hij wordt opgezocht, gebruikt, en is daarna op.
--
-- Bestaande koppelingen blijven staan. Dit gaat alleen over nieuwe.
-- ============================================================================

create table if not exists public.telegram_connect_tokens (
  /* URL-safe en kort genoeg voor Telegram's start-payload (64 tekens). */
  token       text primary key,
  kind        text not null check (kind in ('technician', 'admin')),
  /* technicians.id of auth.users.id, afhankelijk van kind. Geen foreign key:
     twee doelen in een kolom, en de webhook controleert het bestaan toch. */
  subject_id  uuid not null,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null,
  used_at     timestamptz,
  used_by_chat text
);

create index if not exists telegram_connect_tokens_open_idx
  on public.telegram_connect_tokens (subject_id, expires_at)
  where used_at is null;

alter table public.telegram_connect_tokens enable row level security;

grant select, insert on public.telegram_connect_tokens to authenticated;

/*
 * Een code maken mag alleen voor jezelf.
 *
 * Dit is de hele beveiliging: zonder deze with check zou een ingelogde
 * monteur een code voor een collega kunnen aanmaken en precies het gat
 * terugzetten dat deze migratie dichtzet.
 */
drop policy if exists telegram_tokens_own_insert on public.telegram_connect_tokens;
create policy telegram_tokens_own_insert on public.telegram_connect_tokens
  for insert
  with check (
    (kind = 'admin' and subject_id = auth.uid())
    or (kind = 'technician' and subject_id = public.my_technician_id())
  );

/* Lezen idem: je eigen openstaande code, zodat de pagina hem kan hergebruiken
   in plaats van bij elke refresh een nieuwe regel te maken. */
drop policy if exists telegram_tokens_own_read on public.telegram_connect_tokens;
create policy telegram_tokens_own_read on public.telegram_connect_tokens
  for select
  using (
    (kind = 'admin' and subject_id = auth.uid())
    or (kind = 'technician' and subject_id = public.my_technician_id())
  );

/*
 * De code inwisselen. Security definer omdat de webhook geen sessie heeft,
 * en één statement omdat "nog niet gebruikt" en "nu gebruikt" anders twee
 * momenten zijn waartussen dezelfde code twee chats kan koppelen.
 */
create or replace function public.crm_use_connect_token(p_token text, p_chat text)
returns table (kind text, subject_id uuid)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.telegram_connect_tokens
     set used_at = now(), used_by_chat = p_chat
   where token = p_token
     and used_at is null
     and expires_at > now()
  returning telegram_connect_tokens.kind, telegram_connect_tokens.subject_id;
end $$;

/* Alleen de service-role: dit is de webhook, en een browser heeft hier niets
   te zoeken. Geen grant aan authenticated. */
revoke all on function public.crm_use_connect_token(text, text) from public;

notify pgrst, 'reload schema';
