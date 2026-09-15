import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { SCENARIO_INFO, type Scenario } from '@/lib/scenarios';
import PriceForm from './PriceForm';
import DeletePriceButton from './DeletePriceButton';
import styles from './tarieven.module.css';

export const dynamic = 'force-dynamic';

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

interface PriceRow {
  id: string;
  make: string;
  model: string | null;
  scenario: Scenario;
  from_year: number | null;
  to_year: number | null;
  keyless: boolean | null;
  price: number;
  note: string | null;
}

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

  const rows = (data ?? []) as PriceRow[];

  return (
    <>
      <div className={styles.head}>
        <div>
          <h1 className={styles.title}>Tarieven</h1>
          <p className={styles.sub}>
            De prijzen die de spraakassistent en het kantoor gebruiken voor een rijdende monteur — los van de
            webshopprijzen in Producten.
          </p>
        </div>
      </div>

      <PriceForm />

      <div className={styles.wrap}>
        {rows.length === 0 ? (
          <p className={styles.empty}>Nog geen tarieven ingesteld.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Merk</th>
                <th>Model</th>
                <th>Scenario</th>
                <th>Bouwjaar</th>
                <th>Sleutel</th>
                <th style={{ textAlign: 'right' }}>Prijs</th>
                <th>Notitie</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className={styles.strong}>{row.make}</td>
                  <td className={row.model ? undefined : styles.muted}>{row.model ?? 'Heel merk'}</td>
                  <td>{SCENARIO_INFO[row.scenario]?.label ?? row.scenario}</td>
                  <td className={styles.muted}>
                    {row.from_year || row.to_year ? `${row.from_year ?? ''}–${row.to_year ?? ''}` : '—'}
                  </td>
                  <td className={styles.muted}>
                    {row.keyless === true ? 'Keyless' : row.keyless === false ? 'Baard/contact' : 'Beide'}
                  </td>
                  <td className={styles.money}>{MONEY.format(row.price)}</td>
                  <td className={styles.muted}>{row.note ?? ''}</td>
                  <td>
                    <DeletePriceButton id={row.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
