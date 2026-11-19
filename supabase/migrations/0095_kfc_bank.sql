-- 0095: bank statement lines for the KeyForCars customer accounts (phase 4).
--
--   kfc_bank_lines  one row per statement entry, unique on (iban, entry_ref), so a
--                   file imported twice adds nothing. Money in from a customer is
--                   matched to a payment entry through kfc_match_bank_line; payment
--                   provider payouts and money out are ignored with a reason.
-- Server-only like 0090. Idempotent.
create table if not exists public.kfc_bank_lines (
  id                 uuid primary key default gen_random_uuid(),
  iban               text not null,
  entry_ref          text not null,
  booked_on          date not null,
  amount_cents       integer not null,          -- signed: positive = money in
  counterparty_name  text,
  counterparty_iban  text,
  description        text,
  status             text not null default 'open' check (status in ('open', 'matched', 'ignored')),
  ignore_reason      text,
  matched_entry_id   bigint references public.kfc_customer_ledger (id),
  matched_at         timestamptz,
  raw                jsonb,
  imported_at        timestamptz not null default now(),
  unique (iban, entry_ref)
);
create index if not exists kfc_bank_lines_status_idx on public.kfc_bank_lines (status, booked_on desc);

-- Match: one payment entry for the line's amount on its booking date, allocated
-- as given or oldest due first, and the line closed. Idempotent on p_key.
create or replace function public.kfc_match_bank_line(p_line uuid, p_customer uuid, p_key text, p_created_by uuid default null, p_allocations jsonb default null)
returns bigint language plpgsql as $$
declare v_line public.kfc_bank_lines; v_entry bigint;
begin
  select * into v_line from public.kfc_bank_lines where id = p_line for update;
  if not found then raise exception 'KFC_NO_LINE'; end if;
  if v_line.status = 'matched' then return v_line.matched_entry_id; end if;
  if v_line.amount_cents <= 0 then raise exception 'KFC_NOT_A_RECEIPT'; end if;
  v_entry := public.kfc_post_entry(p_customer, 'payment', v_line.amount_cents, p_key, v_line.booked_on,
    concat_ws(' · ', 'Bank', v_line.counterparty_name, nullif(v_line.description, '')), p_created_by, p_allocations, null);
  update public.kfc_bank_lines set status = 'matched', matched_entry_id = v_entry, matched_at = now(), ignore_reason = null where id = p_line;
  return v_entry;
end $$;

alter table public.kfc_bank_lines enable row level security;
revoke all on public.kfc_bank_lines from anon, authenticated;
revoke all on function public.kfc_match_bank_line(uuid, uuid, text, uuid, jsonb) from public, anon, authenticated;
