-- Amounts are in millionths of the policy's configured billing unit.
create table public.kfc_spend_policy (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  agent text not null,
  operation text not null,
  billing_unit text not null,
  enabled boolean not null default false,
  daily_limit bigint not null default 0 check (daily_limit >= 0),
  monthly_limit bigint not null default 0 check (monthly_limit >= 0),
  daily_count integer not null default 0 check (daily_count >= 0),
  max_seconds integer not null default 0 check (max_seconds >= 0),
  max_concurrent integer not null default 0 check (max_concurrent >= 0),
  unique (provider, agent, operation)
);

create table public.kfc_spend_approval (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid not null references public.kfc_spend_policy,
  approved_by uuid not null,
  approved_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  limit_amount bigint not null check (limit_amount > 0),
  limit_count integer not null check (limit_count > 0),
  check (expires_at > approved_at)
);

create table public.kfc_spend_usage (
  id uuid primary key,
  approval_id uuid not null references public.kfc_spend_approval,
  policy_id uuid not null references public.kfc_spend_policy,
  reserved_at timestamptz not null,
  ceiling bigint not null check (ceiling > 0),
  duration_seconds integer not null check (duration_seconds >= 0),
  actual bigint check (actual >= 0),
  finished_at timestamptz
);
create index kfc_spend_usage_policy_time on public.kfc_spend_usage (policy_id, reserved_at);
create index kfc_spend_usage_approval on public.kfc_spend_usage (approval_id);

alter table public.kfc_spend_policy enable row level security;
alter table public.kfc_spend_approval enable row level security;
alter table public.kfc_spend_usage enable row level security;
revoke all on public.kfc_spend_policy, public.kfc_spend_approval, public.kfc_spend_usage from public, anon, authenticated;
grant select, insert, update on public.kfc_spend_policy, public.kfc_spend_approval, public.kfc_spend_usage to service_role;

create function public.kfc_reserve_spend(p_id uuid, p_approval uuid, p_policy uuid, p_ceiling bigint, p_seconds integer)
returns text language plpgsql set search_path = '' as $$
declare
  policy public.kfc_spend_policy%rowtype;
  approval public.kfc_spend_approval%rowtype;
  day_used numeric; month_used numeric; approval_used numeric;
  day_count bigint; approval_count bigint; active_count bigint;
  stamp timestamptz;
  start_day timestamptz; start_month timestamptz;
begin
  if p_id is null or p_ceiling is null or p_ceiling <= 0 or p_seconds is null or p_seconds < 0 then return 'unknown_cost'; end if;
  -- Serialize reservations for the same provider, agent and operation across workers.
  select * into policy from public.kfc_spend_policy where id = p_policy for update;
  if not found or not policy.enabled then return 'disabled'; end if;
  select * into approval from public.kfc_spend_approval where id = p_approval and policy_id = p_policy for update;
  stamp := clock_timestamp();
  if not found or approval.revoked_at is not null or approval.expires_at <= stamp then return 'approval_required'; end if;
  if p_seconds > policy.max_seconds then return 'duration_limit'; end if;
  if exists (select 1 from public.kfc_spend_usage where id = p_id) then return 'already_reserved'; end if;
  start_day := date_trunc('day', stamp, 'Europe/Amsterdam');
  start_month := date_trunc('month', stamp, 'Europe/Amsterdam');

  select
    coalesce(sum(coalesce(actual, ceiling)) filter (where reserved_at >= start_day or actual is null), 0),
    coalesce(sum(coalesce(actual, ceiling)) filter (where reserved_at >= start_month or actual is null), 0),
    coalesce(sum(coalesce(actual, ceiling)) filter (where approval_id = p_approval), 0),
    count(*) filter (where reserved_at >= start_day),
    count(*) filter (where approval_id = p_approval),
    count(*) filter (where finished_at is null)
  into day_used, month_used, approval_used, day_count, approval_count, active_count
  from public.kfc_spend_usage
  where policy_id = p_policy and (reserved_at >= start_month or approval_id = p_approval or actual is null or finished_at is null);

  if day_used + p_ceiling > policy.daily_limit or month_used + p_ceiling > policy.monthly_limit then return 'budget_limit'; end if;
  if approval_used + p_ceiling > approval.limit_amount or approval_count >= approval.limit_count then return 'approval_limit'; end if;
  if day_count >= policy.daily_count then return 'count_limit'; end if;
  if active_count >= policy.max_concurrent then return 'concurrency_limit'; end if;

  insert into public.kfc_spend_usage (id, approval_id, policy_id, reserved_at, ceiling, duration_seconds)
    values (p_id, p_approval, p_policy, stamp, p_ceiling, p_seconds)
    on conflict (id) do nothing;
  if not found then return 'already_reserved'; end if;
  return 'reserved';
end;
$$;
revoke all on function public.kfc_reserve_spend(uuid, uuid, uuid, bigint, integer) from public, anon, authenticated;
grant execute on function public.kfc_reserve_spend(uuid, uuid, uuid, bigint, integer) to service_role;
