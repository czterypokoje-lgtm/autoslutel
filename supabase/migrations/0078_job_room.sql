-- ============================================================================
-- CRM: the job room (slice S1, data part). SHADOW: rows are written, nothing is
-- sent. NOT APPLIED: owner reviews, then pastes it into the Supabase SQL editor
-- (there is no migration runner).
--
-- Run after 0077_whatsapp_ad_reviews.sql. Additive and idempotent: it creates
-- seven new tables and two sequences, and changes no existing table.
--
-- What it holds (design: claw-server docs/designs/concepts_brief.md):
--   contacts, contact_aliases  who is who, by code, never guessed by a model
--   job_rooms                  one record per customer job, spoken code J-418
--   job_parties                who takes part in a job (customer, technicians)
--   job_events                 every message in and out, exact text kept
--   job_outbox                 what may be sent; never sends twice (dedupe_key)
--   job_approvals              who released which exact text
--
-- Shadow guard: job_outbox has a CHECK that a shadow row can never be claimed,
-- sent or unknown. Going live is a deliberate second migration that flips the
-- default, not a code path someone can reach by accident.
--
-- Written only through the service role in /api/ops/jobroom/*. Only the owner
-- may read, through row level security. No customer data in comments.
-- ============================================================================

-- Spoken job code: J-418. Approval codes keep their own series (A7).
create sequence if not exists public.job_room_code_seq;
create sequence if not exists public.job_approval_code_seq;

-- ---------------------------------------------------------------------------
-- contacts: one E.164 number per contact, a role, and aliases.
-- Customers, technicians, garages and staff in one table; the role says which.
-- ---------------------------------------------------------------------------
create table if not exists public.contacts (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  phone_e164       text not null unique check (phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  display_name     text not null check (length(display_name) between 1 and 120),
  wa_name          text,
  role             text not null default 'customer'
                     check (role in ('customer','technician','garage','staff','owner')),
  country          text not null default 'NL' check (country in ('NL','DE')),
  language         text not null default 'nl' check (language in ('nl','de','en','tr')),
  city             text,
  technician_id    uuid references public.technicians(id) on delete set null,
  available_night  boolean not null default false,
  night_hours      text,
  partner_id       uuid,
  first_contact_at timestamptz,
  last_contact_at  timestamptz,
  active           boolean not null default true
);

create index if not exists contacts_role_idx on public.contacts (role) where active;
create index if not exists contacts_technician_idx on public.contacts (technician_id);

-- An alias is an exact name after folding accents (ğ->g, ı->i, ö->o ...), done
-- in code and stored in alias_folded. Several contacts may share one alias; the
-- resolver then asks instead of guessing. Aliases are created only from an
-- explicit pick and are revoked, never deleted, so the history stays.
create table if not exists public.contact_aliases (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  contact_id    uuid not null references public.contacts(id) on delete cascade,
  alias         text not null check (length(alias) between 1 and 120),
  alias_folded  text not null check (length(alias_folded) between 1 and 120),
  source        text not null default 'owner_pick'
                  check (source in ('owner_pick','import','system')),
  confirmed_by  text,
  revoked_at    timestamptz
);

create unique index if not exists contact_aliases_live_uq
  on public.contact_aliases (contact_id, alias_folded) where revoked_at is null;
create index if not exists contact_aliases_lookup_idx
  on public.contact_aliases (alias_folded) where revoked_at is null;

-- ---------------------------------------------------------------------------
-- job_rooms: the job. country/language/currency/partner_id are fields now so
-- Germany and KEY24 need no new table later.
-- ---------------------------------------------------------------------------
create table if not exists public.job_rooms (
  id                   uuid primary key default gen_random_uuid(),
  code                 bigint not null unique default nextval('public.job_room_code_seq'),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  state                text not null default 'intake'
                         check (state in ('intake','offered','quoted','awarded','scheduled',
                                          'done','invoiced','closed','cancelled')),
  country              text not null default 'NL' check (country in ('NL','DE')),
  language             text not null default 'nl' check (language in ('nl','de','en')),
  currency             text not null default 'EUR' check (currency in ('EUR')),
  partner_id           uuid,
  lead_id              uuid references public.leads(id) on delete set null,
  job_id               uuid references public.jobs(id) on delete set null,
  customer_contact_id  uuid references public.contacts(id) on delete set null,
  service_type         text,
  city                 text,
  postcode4            text check (postcode4 is null or postcode4 ~ '^[0-9]{4}$'),
  car_label            text,
  plate                text
);

create unique index if not exists job_rooms_lead_uq on public.job_rooms (lead_id) where lead_id is not null;
create unique index if not exists job_rooms_job_uq  on public.job_rooms (job_id)  where job_id  is not null;
create index if not exists job_rooms_state_idx   on public.job_rooms (state, created_at desc);
create index if not exists job_rooms_created_idx on public.job_rooms (created_at desc);

-- ---------------------------------------------------------------------------
-- job_parties: who takes part in one job.
-- ---------------------------------------------------------------------------
create table if not exists public.job_parties (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  job_room_id  uuid not null references public.job_rooms(id) on delete cascade,
  contact_id   uuid not null references public.contacts(id) on delete restrict,
  role         text not null check (role in ('customer','technician','assistant','owner')),
  status       text not null default 'invited'
                 check (status in ('invited','quoted','declined','awarded','released')),
  unique (job_room_id, contact_id, role)
);

create index if not exists job_parties_contact_idx on public.job_parties (contact_id);

-- ---------------------------------------------------------------------------
-- job_events: durable log of everything in and out. The exact text sent to a
-- person is kept here (the owner must be able to see it). Raw inbound is
-- written before it is processed; provider_message_id makes a replay harmless.
-- job_room_id is null for an inbound message not yet matched to a job.
-- ---------------------------------------------------------------------------
create table if not exists public.job_events (
  id                   uuid primary key default gen_random_uuid(),
  created_at           timestamptz not null default now(),
  job_room_id          uuid references public.job_rooms(id) on delete set null,
  contact_id           uuid references public.contacts(id) on delete set null,
  direction            text not null check (direction in ('in','out','internal')),
  channel              text not null check (channel in ('whatsapp','telegram','crm','voice','system')),
  actor                text not null check (length(actor) between 1 and 80),
  kind                 text not null check (length(kind) between 1 and 80),
  provider_message_id  text,
  event_key            text,
  body                 text check (body is null or length(body) <= 8000),
  meta                 jsonb not null default '{}'::jsonb,
  status               text not null default 'recorded'
                         check (status in ('recorded','processed','blocked','error'))
);

create unique index if not exists job_events_provider_uq
  on public.job_events (channel, provider_message_id) where provider_message_id is not null;
create unique index if not exists job_events_key_uq
  on public.job_events (event_key) where event_key is not null;
create index if not exists job_events_job_idx     on public.job_events (job_room_id, created_at);
create index if not exists job_events_created_idx on public.job_events (created_at desc);

-- ---------------------------------------------------------------------------
-- job_outbox: nothing reaches a person without a row here.
-- dedupe_key = hash(job, recipient, kind, text hash): the same message for the
-- same job and person is one row, so a retry can never send twice.
-- shadow = true (the default) means "recorded, never sent".
-- ---------------------------------------------------------------------------
create table if not exists public.job_outbox (
  id                   uuid primary key default gen_random_uuid(),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  job_room_id          uuid not null references public.job_rooms(id) on delete cascade,
  contact_id           uuid not null references public.contacts(id) on delete restrict,
  audience             text not null check (audience in ('customer_reply','technician','self_started','internal')),
  kind                 text not null check (length(kind) between 1 and 80),
  tier                 smallint not null check (tier between 0 and 2),
  body                 text not null check (length(body) between 1 and 4000),
  text_hash            text not null check (text_hash ~ '^[0-9a-f]{64}$'),
  dedupe_key           text not null unique check (dedupe_key ~ '^[0-9a-f]{64}$'),
  state                text not null default 'proposed'
                         check (state in ('proposed','approved','claimed','sent','unknown','failed','cancelled')),
  shadow               boolean not null default true,
  approved_by          text,
  approved_at          timestamptz,
  claimed_by           text,
  lease_until          timestamptz,
  attempts             integer not null default 0,
  provider_message_id  text,
  last_error           text,
  sent_at              timestamptz,
  -- A shadow row can only be recorded, approved, failed or cancelled.
  constraint job_outbox_shadow_never_sends
    check (shadow = false or state in ('proposed','approved','failed','cancelled'))
);

create index if not exists job_outbox_state_idx on public.job_outbox (state, created_at);
create index if not exists job_outbox_job_idx   on public.job_outbox (job_room_id);

-- ---------------------------------------------------------------------------
-- job_approvals: a release is bound to the hash of the exact text, so an edit
-- cancels it. code is the short spoken form (A7), separate from the job code.
-- ---------------------------------------------------------------------------
create table if not exists public.job_approvals (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  code         bigint not null unique default nextval('public.job_approval_code_seq'),
  outbox_id    uuid not null references public.job_outbox(id) on delete cascade,
  job_room_id  uuid not null references public.job_rooms(id) on delete cascade,
  decision     text not null check (decision in ('approved','rejected')),
  text_hash    text not null check (text_hash ~ '^[0-9a-f]{64}$'),
  decided_by   text not null check (length(decided_by) between 1 and 80),
  decided_via  text not null check (decided_via in ('owner_tap','owner_voice','assistant','system')),
  unique (outbox_id)
);

-- ---------------------------------------------------------------------------
-- touch updated_at (same pattern as jobs_touch_trg)
-- ---------------------------------------------------------------------------
create or replace function public.job_room_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists contacts_touch_trg on public.contacts;
create trigger contacts_touch_trg before update on public.contacts
  for each row execute function public.job_room_touch();

drop trigger if exists job_rooms_touch_trg on public.job_rooms;
create trigger job_rooms_touch_trg before update on public.job_rooms
  for each row execute function public.job_room_touch();

drop trigger if exists job_outbox_touch_trg on public.job_outbox;
create trigger job_outbox_touch_trg before update on public.job_outbox
  for each row execute function public.job_room_touch();

-- ---------------------------------------------------------------------------
-- Row level security: service role writes; only the owner reads.
-- ---------------------------------------------------------------------------
alter table public.contacts        enable row level security;
alter table public.contact_aliases enable row level security;
alter table public.job_rooms       enable row level security;
alter table public.job_parties     enable row level security;
alter table public.job_events      enable row level security;
alter table public.job_outbox      enable row level security;
alter table public.job_approvals   enable row level security;

grant select on public.contacts, public.contact_aliases, public.job_rooms,
  public.job_parties, public.job_events, public.job_outbox, public.job_approvals
  to authenticated;

do $$
declare t text;
begin
  foreach t in array array['contacts','contact_aliases','job_rooms','job_parties',
                           'job_events','job_outbox','job_approvals'] loop
    if not exists (select 1 from pg_policies
                   where schemaname = 'public' and tablename = t and policyname = t || '_owner_read') then
      execute format(
        'create policy %I on public.%I for select using (public.crm_role() = ''owner'')',
        t || '_owner_read', t);
    end if;
  end loop;
end $$;
