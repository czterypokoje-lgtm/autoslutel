import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { slotLabel } from '@/lib/crmJobs';
import styles from '../klanten.module.css';
import EraseButton from './EraseButton';

export const dynamic = 'force-dynamic';

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const DATE = new Intl.DateTimeFormat('nl-NL', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'Europe/Amsterdam',
});

export default async function KlantPage({
  params,
}: {
  params: Promise<{ telefoon: string }>;
}) {
  const { telefoon } = await params;
  const phone = decodeURIComponent(telefoon);
  await requireOfficeUser(`/admin/klanten/${telefoon}`);

  const supabase = await createSupabaseServerClient();

  const [{ data: customer }, { data: vehicles }, { data: leads }, { data: jobs }] =
    await Promise.all([
      supabase
        .from('crm_customers')
        .select('*')
        .eq('phone_e164', phone)
        .maybeSingle(),
      supabase
        .from('crm_customer_vehicles')
        .select('kenteken, brand, model, year, aanvragen, last_seen')
        .eq('phone_e164', phone)
        .order('last_seen', { ascending: false }),
      supabase
        .from('leads')
        .select('id, created_at, status, source, service, brand, model, kenteken, sale_price')
        .eq('phone_e164', phone)
        .order('created_at', { ascending: false }),
      supabase
        .from('jobs')
        .select('id, status, scheduled_date, slot_start, slot_end, service_type, final_price, quoted_price')
        .eq('customer_phone', phone)
        .order('scheduled_date', { ascending: false }),
    ]);

  if (!customer) notFound();

  return (
    <>
      <div className={styles.head}>
        <h1 className={styles.title}>{customer.name ?? 'Klant zonder naam'}</h1>
        <span className={styles.count}>{phone}</span>
        <span className={styles.search}>
          <Link className={styles.link} href="/admin/klanten">
            Terug naar klanten
          </Link>
        </span>
      </div>

      <div className={styles.cols}>
        <div>
          <div className={styles.panel}>
            <h2>Voertuigen</h2>
            {(vehicles ?? []).length === 0 ? (
              <p className={styles.note}>
                Geen kenteken bekend. Kentekens worden pas sinds migratie 0003 in
                een eigen kolom bewaard; oudere aanvragen hebben hem alleen in de
                modelnaam staan.
              </p>
            ) : (
              (vehicles ?? []).map((v) => (
                <div key={v.kenteken as string} className={styles.item}>
                  <span className={styles.plate}>{v.kenteken as string}</span>{' '}
                  <span className={styles.strong}>
                    {[v.brand, v.model, v.year].filter(Boolean).join(' ')}
                  </span>
                  <span className={styles.sub}>
                    {v.aanvragen as number} aanvraag/aanvragen · laatst{' '}
                    {DATE.format(new Date(v.last_seen as string))}
                  </span>
                </div>
              ))
            )}
            <p className={styles.note}>
              Komt dezelfde auto terug voor een tweede sleutel, dan staat hier
              wat de vorige keer is gebruikt — dat scheelt tijd op de oprit.
            </p>
          </div>

          <div className={styles.panel}>
            <h2>Aanvragen ({(leads ?? []).length})</h2>
            {(leads ?? []).map((l) => (
              <div key={l.id as string} className={styles.item}>
                <span className={styles.strong}>
                  {DATE.format(new Date(l.created_at as string))} ·{' '}
                  {(l.service as string) ?? 'geen dienst'}
                </span>
                <span className={styles.sub}>
                  {(l.source as string) ?? 'unknown'} · {l.status as string}
                  {l.sale_price !== null &&
                    ` · ${MONEY.format(Number(l.sale_price))}`}
                </span>
              </div>
            ))}
          </div>

          <div className={styles.panel}>
            <h2>Klussen ({(jobs ?? []).length})</h2>
            {(jobs ?? []).length === 0 ? (
              <p className={styles.note}>Nog geen klus ingepland.</p>
            ) : (
              (jobs ?? []).map((j) => (
                <div key={j.id as string} className={styles.item}>
                  <Link className={styles.link} href={`/admin/jobs/${j.id as string}`}>
                    <span className={styles.strong}>
                      {j.scheduled_date as string}{' '}
                      {slotLabel(j.slot_start as string, j.slot_end as string)}
                    </span>
                  </Link>
                  <span className={styles.sub}>
                    {(j.service_type as string) ?? 'geen dienst'} · {j.status as string}
                    {(j.final_price ?? j.quoted_price) !== null &&
                      ` · ${MONEY.format(Number(j.final_price ?? j.quoted_price))}`}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <div className={styles.panel}>
            <h2>Overzicht</h2>
            <div className={styles.summary}>
              <span className={styles.summaryKey}>Telefoon</span>
              <span className={styles.summaryVal}>
                <a href={`tel:${phone}`}>{phone}</a>
              </span>
              <span className={styles.summaryKey}>E-mail</span>
              <span className={styles.summaryVal}>{customer.email ?? '—'}</span>
              <span className={styles.summaryKey}>Postcode</span>
              <span className={styles.summaryVal}>{customer.postcode ?? '—'}</span>
              <span className={styles.summaryKey}>Klant sinds</span>
              <span className={styles.summaryVal}>
                {DATE.format(new Date(customer.first_seen as string))}
              </span>
              <span className={styles.summaryKey}>Omzet</span>
              <span className={styles.summaryVal}>
                {MONEY.format(Number(customer.total_value ?? 0))}
              </span>
            </div>
          </div>

          <div className={styles.panel}>
            <h2>AVG</h2>
            <div className={styles.summary}>
              <span className={styles.summaryKey}>Marketing</span>
              <span className={styles.summaryVal}>
                <span
                  className={`${styles.badge} ${
                    customer.consent_marketing ? styles.ok : styles.no
                  }`}
                >
                  {customer.consent_marketing ? 'toestemming' : 'geen toestemming'}
                </span>
              </span>
              <span className={styles.summaryKey}>Gegeven op</span>
              <span className={styles.summaryVal}>
                {customer.consent_at
                  ? DATE.format(new Date(customer.consent_at as string))
                  : '—'}
              </span>
            </div>
            <p className={styles.note}>
              Zet deze klant alleen op een mailinglijst als hierboven
              &ldquo;toestemming&rdquo; staat.
            </p>
          </div>

          <div className={`${styles.panel} ${styles.danger}`}>
            <h2 className={styles.dangerTitle}>Gegevens verwijderen</h2>
            <p className={styles.note}>
              Verwijdert alle aanvragen van dit nummer en haalt naam, telefoon,
              adres en notities van de klussen af. De klussen zelf blijven
              bestaan: het werk is gedaan en de administratie daarvan moet zeven
              jaar bewaard blijven. Dit kan niet ongedaan worden gemaakt.
            </p>
            <EraseButton phone={phone} />
          </div>
        </div>
      </div>
    </>
  );
}
