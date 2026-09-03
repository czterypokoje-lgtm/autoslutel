import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import styles from '../../klanten/klanten.module.css';
import LedgerForm from './LedgerForm';

export const dynamic = 'force-dynamic';

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const WHEN = new Intl.DateTimeFormat('nl-NL', {
  day: '2-digit', month: '2-digit', year: 'numeric',
  hour: '2-digit', minute: '2-digit',
  timeZone: 'Europe/Amsterdam',
});

const TYPE_LABELS: Record<string, string> = {
  incasso: 'Geïnd bij klant',
  afdracht: 'Afgedragen',
  verdienste: 'Verdiend',
  uitbetaling: 'Uitbetaald',
  correctie: 'Correctie',
};

/** Same rule as ledger_effect() in the database. One meaning, two places it is read. */
function effect(type: string, amount: number, direction: number): number {
  if (type === 'incasso' || type === 'uitbetaling') return amount;
  if (type === 'afdracht' || type === 'verdienste') return -amount;
  if (type === 'correctie') return amount * direction;
  return 0;
}

export default async function KasDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireOfficeUser(`/admin/kas/${id}`);

  const supabase = await createSupabaseServerClient();

  const [{ data: balance }, { data: entries }] = await Promise.all([
    supabase.from('crm_technician_balance').select('*').eq('technician_id', id).maybeSingle(),
    supabase
      .from('technician_ledger')
      .select('id, entry_type, amount, direction, occurred_at, note, job_id')
      .eq('technician_id', id)
      .order('occurred_at', { ascending: false })
      .limit(200),
  ]);

  if (!balance) notFound();

  const saldo = Number(balance.saldo ?? 0);

  return (
    <>
      <div className={styles.head}>
        <h1 className={styles.title}>{balance.name as string}</h1>
        <span className={styles.count}>
          Saldo {MONEY.format(saldo)}{' '}
          {saldo > 0 ? '— moet nog afdragen' : saldo < 0 ? '— moet nog uitbetaald' : '— niets open'}
        </span>
        <span className={styles.search}>
          <Link className={styles.link} href="/admin/kas">Terug naar kas</Link>
        </span>
      </div>

      <div className={styles.cols}>
        <div className={styles.panel}>
          <h2>Mutaties</h2>
          {(entries ?? []).length === 0 ? (
            <p className={styles.note}>Nog geen mutaties.</p>
          ) : (
            (entries ?? []).map((e) => {
              const value = effect(
                e.entry_type as string,
                Number(e.amount),
                Number(e.direction ?? 1)
              );
              return (
                <div key={e.id as string} className={styles.item}>
                  <span className={styles.strong}>
                    {TYPE_LABELS[e.entry_type as string] ?? (e.entry_type as string)}
                    {'  '}
                    <span style={{ color: value > 0 ? 'var(--crm-stop)' : 'var(--crm-ok)' }}>
                      {value > 0 ? '+' : ''}
                      {MONEY.format(value)}
                    </span>
                  </span>
                  <span className={styles.sub}>
                    {WHEN.format(new Date(e.occurred_at as string))}
                    {e.note ? ` · ${e.note as string}` : ''}
                    {e.job_id ? ' · ' : ''}
                  </span>
                  {e.job_id != null && (
                    <Link className={styles.link} href={`/admin/jobs/${e.job_id as string}`}>
                      klus bekijken
                    </Link>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div>
          <div className={styles.panel}>
            <h2>Overzicht</h2>
            <div className={styles.summary}>
              <span className={styles.summaryKey}>Geïnd bij klanten</span>
              <span className={styles.summaryVal}>{MONEY.format(Number(balance.totaal_geind ?? 0))}</span>
              <span className={styles.summaryKey}>Afgedragen</span>
              <span className={styles.summaryVal}>{MONEY.format(Number(balance.totaal_afgedragen ?? 0))}</span>
              <span className={styles.summaryKey}>Verdiend</span>
              <span className={styles.summaryVal}>{MONEY.format(Number(balance.totaal_verdiend ?? 0))}</span>
              <span className={styles.summaryKey}>Uitbetaald</span>
              <span className={styles.summaryVal}>{MONEY.format(Number(balance.totaal_uitbetaald ?? 0))}</span>
              <span className={styles.summaryKey}>IBAN</span>
              <span className={styles.summaryVal}>{(balance.iban as string) ?? '—'}</span>
            </div>
          </div>

          <div className={styles.panel}>
            <h2>Mutatie boeken</h2>
            <LedgerForm technicianId={id} />
            <p className={styles.note}>
              Mutaties worden nooit gewijzigd of verwijderd — een saldo dat je
              alleen kunt herrekenen is een saldo dat je kunt controleren. Een
              fout corrigeer je met een correctie mét reden.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
