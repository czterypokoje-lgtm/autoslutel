import Link from 'next/link';
import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import styles from '../klanten/klanten.module.css';
import { PageHead, HelpSteps } from '../_ui';
import k from './kas.module.css';
import PayoutActions from './PayoutActions';

export const dynamic = 'force-dynamic';

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

export default async function KasPage() {
  await requireOfficeUser('/admin/kas');

  const supabase = await createSupabaseServerClient();
  const [{ data, error }, { data: pendingPayouts }] = await Promise.all([
    supabase.from('crm_technician_balance').select('*').order('saldo', { ascending: false }),
    supabase
      .from('payout_requests')
      .select('id, amount, created_at, technician_id')
      .eq('status', 'pending')
      .order('created_at', { ascending: true }),
  ]);

  if (error) {
    const missing = /does not exist|relation|permission denied/i.test(error.message);
    return (
      <div className={styles.warning}>
        De saldi konden niet worden geladen: {error.message}
        {missing && (
          <>
            <br />
            Voer <code>supabase/migrations/0007_payments_ledger.sql</code> uit.
          </>
        )}
      </div>
    );
  }

  const rows = data ?? [];
  const nameOf = new Map(rows.map((r) => [r.technician_id as string, r.name as string]));
  const owedToUs = rows
    .filter((r) => Number(r.saldo) > 0)
    .reduce((sum, r) => sum + Number(r.saldo), 0);
  const owedByUs = rows
    .filter((r) => Number(r.saldo) < 0)
    .reduce((sum, r) => sum - Number(r.saldo), 0);

  const pending = pendingPayouts ?? [];
  const pendingSum = pending.reduce((t, p) => t + Number(p.amount), 0);

  return (
    <>
      <PageHead
        title="Kas & uitbetalingen"
        sub="Wie heeft nog geld van klanten, en wie moet er nog betaald worden. Klik een monteur voor het logboek."
      />

      <div className={k.stats}>
        <div className={owedToUs > 0 ? k.statWarn : undefined}>
          <span>Nog bij monteurs</span>
          <b>{MONEY.format(owedToUs)}</b>
          <small>contant of pin geïnd, nog niet afgedragen</small>
        </div>
        <div>
          <span>Nog uit te betalen</span>
          <b>{MONEY.format(owedByUs)}</b>
          <small>verdiend door monteurs</small>
        </div>
        <div className={pending.length ? k.statAccent : undefined}>
          <span>Uitbetalingsverzoeken</span>
          <b>{pending.length}</b>
          <small>{pending.length ? `${MONEY.format(pendingSum)} aangevraagd` : 'geen open verzoeken'}</small>
        </div>
      </div>

      {pending.length > 0 && (
        <section className={k.requests}>
          <h2>Uitbetalingsverzoeken</h2>
          <ul>
            {pending.map((payout) => (
              <li key={payout.id}>
                <span className={k.reqWho}>
                  <b>{nameOf.get(payout.technician_id) ?? 'Onbekend'}</b>
                  <small>aangevraagd {new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', timeZone: 'Europe/Amsterdam' }).format(new Date(payout.created_at))}</small>
                </span>
                <span className={k.reqAmount}>{MONEY.format(Number(payout.amount))}</span>
                <PayoutActions id={payout.id} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={k.table}>
        <div className={`${k.row} ${k.head}`}>
          <span>Monteur</span>
          <span className={k.num}>Geïnd</span>
          <span className={k.num}>Afgedragen</span>
          <span className={k.num}>Verdiend</span>
          <span className={k.num}>Uitbetaald</span>
          <span className={k.num}>Saldo</span>
        </div>
        {rows.length === 0 && <p className={k.empty}>Nog geen monteurs.</p>}
        {rows.map((r) => {
          const saldo = Number(r.saldo ?? 0);
          return (
            <Link key={r.technician_id as string} href={`/admin/kas/${r.technician_id as string}`} className={k.row}>
              <span className={k.who}>
                <b>{r.name as string}</b>
                <small>
                  {r.employment_type === 'zzp' ? 'ZZP' : 'Loondienst'} · {(r.iban as string) ?? 'geen IBAN'}
                </small>
              </span>
              <span className={k.num}>{MONEY.format(Number(r.totaal_geind ?? 0))}</span>
              <span className={k.num}>{MONEY.format(Number(r.totaal_afgedragen ?? 0))}</span>
              <span className={k.num}>{MONEY.format(Number(r.totaal_verdiend ?? 0))}</span>
              <span className={k.num}>{MONEY.format(Number(r.totaal_uitbetaald ?? 0))}</span>
              <span className={`${k.num} ${k.saldo}`}>
                {saldo > 0 ? (
                  <span className={k.owes}>moet {MONEY.format(saldo)} afdragen</span>
                ) : saldo < 0 ? (
                  <span className={k.gets}>krijgt {MONEY.format(-saldo)}</span>
                ) : (
                  <span className={k.even}>niets open</span>
                )}
              </span>
            </Link>
          );
        })}
      </section>

      <HelpSteps
        steps={[
          <>
            <b>Moet afdragen</b>: de monteur heeft contant of pin van klanten geïnd dat nog bij hem is.
          </>,
          <>
            <b>Krijgt</b>: het bedrijf moet de monteur nog betalen voor zijn klussen.
          </>,
          'Tikkie, iDEAL, bank en factuur gaan rechtstreeks naar het bedrijf en raken het saldo niet.',
        ]}
      />
    </>
  );
}
