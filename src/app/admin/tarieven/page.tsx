import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { STUDIO_UI } from '@/config/install';
import PriceForm from './PriceForm';
import { type PriceRowData } from './PriceRow';
import TarievenList from './TarievenList';
import StudioPriceForm from './StudioPriceForm';
import StudioTarievenList from './StudioTarievenList';
import styles from './tarieven.module.css';
import { PreviewText } from '../PreviewLanguage';
import { Card, CardContent } from '@/components/ui/card';

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
    .select('id, make, model, scenario, from_year, to_year, keyless, price, service_price, note')
    .order('make', { ascending: true })
    .order('model', { ascending: true });

  if (error) {
    const missing = /does not exist|relation/i.test(error.message);
    if (STUDIO_UI) {
      return (
        <div className="kfc-neutral flex flex-col gap-4 md:gap-6">
          <p className="text-destructive text-sm">
            <PreviewText>{`Tarieven konden niet worden geladen: ${error.message}`}</PreviewText>
            {missing && (
              <>
                <br />
                <PreviewText>{'Voer supabase/migrations/0028_dispatch_pricing.sql uit.'}</PreviewText>
              </>
            )}
          </p>
        </div>
      );
    }
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

  if (STUDIO_UI) {
    return (
      <div className="kfc-neutral flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl leading-none font-medium tracking-tight"><PreviewText>Tarieven</PreviewText></h1>
          <p className="text-muted-foreground text-sm">
            <PreviewText>
              Eén prijslijst: de AI-agent en het kantoor rekenen met deze bedragen. Een wijziging geldt direct voor nieuwe
              offertes. Klik een merk open om de prijzen te zien of aan te passen.
            </PreviewText>
          </p>
        </div>

        <details className="rounded-lg border">
          <summary className="cursor-pointer list-none px-4 py-3 font-medium select-none">
            <PreviewText>+ Tarief toevoegen</PreviewText>
          </summary>
          <div className="border-t p-4">
            <StudioPriceForm />
          </div>
        </details>

        {rows.length === 0 ? (
          <Card>
            <CardContent className="text-muted-foreground pt-6 text-sm">
              <PreviewText>Nog geen tarieven ingesteld.</PreviewText>
            </CardContent>
          </Card>
        ) : (
          <StudioTarievenList rows={rows} />
        )}
      </div>
    );
  }

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
