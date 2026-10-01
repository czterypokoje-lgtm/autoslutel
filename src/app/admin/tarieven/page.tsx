import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import PriceForm from './PriceForm';
import { type PriceRowData } from './PriceRow';
import TarievenList from './TarievenList';
import styles from './tarieven.module.css';

export const dynamic = 'force-dynamic';

/**
 * What a dispatch job costs, maintained by the office directly — decoupled
 * from the webshop's parts catalogue (Producten), which prices a different
 * business. This is what /api/agent/quote reads for bijmaken/alle_sleutels_kwijt.
 */
export default async function TarievenPage() {
  await requireOfficeUser('/admin/tarieven');

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('dispatch_pricing')
    .select('id, make, model, scenario, from_year, to_year, keyless, price, note')
    .order('make', { ascending: true })
    .order('model', { ascending: true });

  if (error) {
    const missing = /does not exist|relation/i.test(error.message);
    return (
      <div className={styles.panel}>
        <p>Tarieven konden niet worden geladen: {error.message}</p>
        {missing && (
          <p>
            Voer <code>supabase/migrations/0028_dispatch_pricing.sql</code> uit.
          </p>
        )}
      </div>
    );
  }

  const rows = (data ?? []) as PriceRowData[];

  return (
    <>
      <div className={styles.head}>
        <div>
          <h1 className={styles.title}>Tarieven</h1>
          <p className={styles.sub}>
            Eén prijslijst: de AI-agent en het kantoor rekenen met deze bedragen. Een wijziging geldt direct
            voor nieuwe offertes. Klik een merk open om de prijzen te zien of aan te passen.
          </p>
        </div>
      </div>

      <details className={styles.addFold}>
        <summary className={styles.addSummary}>+ Tarief toevoegen</summary>
        <PriceForm />
      </details>

      {rows.length === 0 ? (
        <p className={styles.empty}>Nog geen tarieven ingesteld.</p>
      ) : (
        <TarievenList rows={rows} />
      )}
    </>
  );
}
