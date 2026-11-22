/*
 * Close the anon key's EXECUTE on functions that were never meant for it.
 *
 * Postgres grants EXECUTE on every new function to PUBLIC, and Supabase's
 * anon role inherits that. The kfc_* functions revoke it explicitly, but the
 * older ones (0021, 0026, 0035, 0055, 0057, the stock_items helpers…) never
 * did, so anyone holding the public anon key — it ships in the browser — could
 * call them through /rest/v1/rpc. Found by a security scan on 21 Nov 2026,
 * confirmed with no-op calls on the KeyForCars database:
 *   crm_settle_payment        mark a job payment paid
 *   crm_respond_to_offer_*    accept/decline a technician's offer by phone/chat id
 *   crm_set_job_travel        set travel costs on a job
 *   apply_stock_delta         change old stock_items quantities
 *
 * What this does, per public function anon can execute today:
 *   - remembers whether authenticated and service_role can execute it,
 *   - revokes EXECUTE from PUBLIC and anon,
 *   - grants it back to authenticated / service_role exactly where they had it.
 * So logged-in users and the server keep every right they had; only the
 * anonymous key loses access.
 *
 * Left alone: crm_install_profile() (public on purpose, 0133), trigger
 * functions (they run as part of a table write, not via RPC), and any function
 * used inside an RLS policy (anon may need it while reading public tables).
 *
 * Idempotent: a second run finds nothing left to revoke.
 */
do $$
declare
  r record;
  v_auth boolean;
  v_service boolean;
  v_closed integer := 0;
begin
  for r in
    select p.oid, p.oid::regprocedure as sig, p.proname
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.prokind = 'f'
       and p.prorettype <> 'trigger'::regtype
       and p.proname <> 'crm_install_profile'
       and has_function_privilege('anon', p.oid, 'execute')
       and not exists (
         select 1 from pg_policies pol
          where pol.schemaname = 'public'
            and (coalesce(pol.qual, '') ~ ('\m' || p.proname || '\s*\(')
              or coalesce(pol.with_check, '') ~ ('\m' || p.proname || '\s*\('))
       )
  loop
    v_auth := has_function_privilege('authenticated', r.oid, 'execute');
    v_service := has_function_privilege('service_role', r.oid, 'execute');
    execute format('revoke execute on function %s from public, anon', r.sig);
    if v_auth then execute format('grant execute on function %s to authenticated', r.sig); end if;
    if v_service then execute format('grant execute on function %s to service_role', r.sig); end if;
    v_closed := v_closed + 1;
  end loop;
  raise notice '0135: closed anon EXECUTE on % functions', v_closed;
end
$$;
