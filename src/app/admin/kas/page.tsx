import Link from 'next/link';
import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import styles from '../klanten/klanten.module.css';

export const dynamic = 'force-dynamic';

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

export default async function KasPage() {
  await requireOfficeUser('/admin/kas');

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('crm_technician_balance')
    .select('*')
    .order('saldo', { ascending: false });

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
  const owedToUs = rows
    .filter((r) => Number(r.saldo) > 0)
    .reduce((sum, r) => sum + Number(r.saldo), 0);
  const owedByUs = rows
    .filter((r) => Number(r.saldo) < 0)
    .reduce((sum, r) => sum - Number(r.saldo), 0);

  return (
    <>
      <div className={styles.head}>
        <h1 className={styles.title}>Kas &amp; saldi</h1>
        <span className={styles.count}>
          Openstaand bij monteurs {MONEY.format(owedToUs)} · nog uit te betalen{' '}
          {MONEY.format(owedByUs)}
        </span>
      </div>

      <div className={styles.wrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Monteur</th>
              <th>Soort</th>
              <th style={{ textAlign: 'right' }}>Geïnd</th>
              <th style={{ textAlign: 'right' }}>Afgedragen</th>
              <th style={{ textAlign: 'right' }}>Verdiend</th>
              <th style={{ textAlign: 'right' }}>Uitbetaald</th>
              <th style={{ textAlign: 'right' }}>Saldo</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.empty}>Nog geen monteurs.</td>
              </tr>
            ) : (
              rows.map((r) => {
                const saldo = Number(r.saldo ?? 0);
                return (
                  <tr key={r.technician_id as string}>
                    <td>
                      <Link
                        className={`${styles.strong} ${styles.link}`}
                        href={`/admin/kas/${r.technician_id as string}`}
                      >
                        {r.name as string}
                      </Link>
                      <span className={styles.sub}>{(r.iban as string) ?? 'geen IBAN'}</span>
                    </td>
                    <td>
                      <span
                        className={`${styles.badge} ${
                          r.employment_type === 'zzp' ? styles.ok : styles.no
                        }`}
                      >
                        {r.employment_type as string}
                      </span>
                    </td>
                    <td className={styles.money}>{MONEY.format(Number(r.totaal_geind ?? 0))}</td>
                    <td className={styles.money}>{MONEY.format(Number(r.totaal_afgedragen ?? 0))}</td>
                    <td className={styles.money}>{MONEY.format(Number(r.totaal_verdiend ?? 0))}</td>
                    <td className={styles.money}>{MONEY.format(Number(r.totaal_uitbetaald ?? 0))}</td>
                    <td
                      className={styles.money}
                      style={{ color: saldo > 0 ? 'var(--crm-stop)' : saldo < 0 ? 'var(--crm-ok)' : undefined }}
                    >
                      {MONEY.format(saldo)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.panel} style={{ marginTop: 16 }}>
        <h2>Hoe je dit leest</h2>
        <p className={styles.note}>
          <strong>Saldo boven nul</strong> betekent dat de monteur geld van de
          klant heeft geïnd dat nog niet is afgedragen — dat bedrag staat bij
          hem in de bus, niet op de rekening.{' '}
          <strong>Saldo onder nul</strong> betekent dat het bedrijf hem nog moet
          betalen. Nul is niets open.
        </p>
        <p className={styles.note}>
          Contant en pin aan de deur belanden bij de monteur en komen dus op zijn
          saldo. Tikkie, iDEAL, bank en factuur gaan rechtstreeks naar het
          bedrijf en raken zijn saldo niet.
        </p>
      </div>
    </>
  );
}
