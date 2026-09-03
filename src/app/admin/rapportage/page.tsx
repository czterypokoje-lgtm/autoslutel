import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import styles from '../klanten/klanten.module.css';

export const dynamic = 'force-dynamic';

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

/** Never invent a number. No data means an em dash, not a zero that reads as fact. */
function show(value: unknown, format?: (n: number) => string): string {
  if (value === null || value === undefined || value === '') return '—';
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return format ? format(n) : String(n);
}

function percent(part: number, whole: number): string {
  if (!whole) return '—';
  return `${Math.round((part / whole) * 100)}%`;
}

export default async function RapportagePage() {
  await requireOfficeUser('/admin/rapportage');

  const supabase = await createSupabaseServerClient();

  const [source, service, response, technician, region] = await Promise.all([
    supabase.from('crm_report_source').select('*'),
    supabase.from('crm_report_service').select('*').order('klussen', { ascending: false }),
    supabase.from('crm_report_response').select('*').order('week', { ascending: false }).limit(8),
    supabase.from('crm_report_technician').select('*').order('klussen', { ascending: false }),
    supabase.from('crm_report_region').select('*').order('leads', { ascending: false }).limit(15),
  ]);

  const failed = [source, service, response, technician, region].find((r) => r.error);
  if (failed?.error) {
    const missing = /does not exist|relation|permission denied/i.test(failed.error.message);
    return (
      <div className={styles.warning}>
        De rapportage kon niet worden geladen: {failed.error.message}
        {missing && (
          <>
            <br />
            Voer <code>supabase/migrations/0006_customers_reports.sql</code> uit.
          </>
        )}
      </div>
    );
  }

  // The source view is split per month; the office wants the total.
  const bySource = new Map<
    string,
    { leads: number; verkocht: number; klussen: number; omzet: number }
  >();
  for (const row of source.data ?? []) {
    const key = row.source as string;
    const current = bySource.get(key) ?? { leads: 0, verkocht: 0, klussen: 0, omzet: 0 };
    current.leads += Number(row.leads ?? 0);
    current.verkocht += Number(row.verkocht ?? 0);
    current.klussen += Number(row.klussen ?? 0);
    current.omzet += Number(row.omzet ?? 0);
    bySource.set(key, current);
  }
  const sources = [...bySource.entries()].sort((a, b) => b[1].leads - a[1].leads);

  const latestWeek = (response.data ?? [])[0];

  return (
    <>
      <div className={styles.head}>
        <h1 className={styles.title}>Rapportage</h1>
        <span className={styles.count}>
          vijf getallen die een beslissing veranderen
        </span>
      </div>

      <div className={styles.panel}>
        <h2>1 · Lead → klus, per bron</h2>
        <div className={styles.wrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Bron</th>
                <th>Leads</th>
                <th>Klussen</th>
                <th>Verkocht</th>
                <th>Conversie</th>
                <th style={{ textAlign: 'right' }}>Omzet</th>
              </tr>
            </thead>
            <tbody>
              {sources.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.empty}>Nog geen data.</td>
                </tr>
              ) : (
                sources.map(([name, s]) => (
                  <tr key={name}>
                    <td className={styles.strong}>{name}</td>
                    <td>{s.leads}</td>
                    <td>{s.klussen}</td>
                    <td>{s.verkocht}</td>
                    <td>{percent(s.verkocht, s.leads)}</td>
                    <td className={styles.money}>{MONEY.format(s.omzet)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className={styles.note}>
          Welk kanaal echt werk oplevert, niet alleen kliks. Telefonische leads
          ontbreken hier: er is nog geen belregistratie, dus elk getal in deze
          tabel is een ondergrens.
        </p>
      </div>

      <div className={styles.panel}>
        <h2>2 · Gemiddelde kluswaarde, per dienst</h2>
        <div className={styles.wrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Dienst</th>
                <th>Afgeronde klussen</th>
                <th style={{ textAlign: 'right' }}>Gemiddeld</th>
                <th style={{ textAlign: 'right' }}>Totaal</th>
              </tr>
            </thead>
            <tbody>
              {(service.data ?? []).length === 0 ? (
                <tr>
                  <td colSpan={4} className={styles.empty}>
                    Nog geen afgeronde klussen.
                  </td>
                </tr>
              ) : (
                (service.data ?? []).map((row) => (
                  <tr key={row.dienst as string}>
                    <td className={styles.strong}>{row.dienst as string}</td>
                    <td>{show(row.klussen)}</td>
                    <td className={styles.money}>
                      {show(row.gemiddelde_waarde, (n) => MONEY.format(n))}
                    </td>
                    <td className={styles.money}>
                      {show(row.totaal, (n) => MONEY.format(n))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className={styles.note}>Stuurt prijsstelling en advertentiebudget.</p>
      </div>

      <div className={styles.panel}>
        <h2>3 · Reactietijd — lead tot eerste contact</h2>
        {latestWeek ? (
          <div className={styles.summary}>
            <span className={styles.summaryKey}>Mediaan deze week</span>
            <span className={styles.summaryVal}>
              {show(latestWeek.mediaan_minuten, (n) => `${n} min`)}
            </span>
            <span className={styles.summaryKey}>Gemiddeld</span>
            <span className={styles.summaryVal}>
              {show(latestWeek.gemiddelde_minuten, (n) => `${n} min`)}
            </span>
            <span className={styles.summaryKey}>Te laat (&gt; 60 min)</span>
            <span className={styles.summaryVal}>
              {show(latestWeek.te_laat)} van {show(latestWeek.leads_met_contact)}
            </span>
          </div>
        ) : (
          <p className={styles.note}>
            Nog geen meetbare reactietijd. Dit getal ontstaat vanzelf zodra
            leads in het CRM van <em>nieuw</em> af worden gehaald — pas dan wordt
            het moment van eerste contact vastgelegd.
          </p>
        )}
        <p className={styles.note}>
          In spoedwerk de sterkste verliesreden. Wie na een uur terugbelt, belt
          een klant die al iemand anders heeft gebeld.
        </p>
      </div>

      <div className={styles.panel}>
        <h2>4 · Klussen per monteur per dag</h2>
        <div className={styles.wrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Monteur</th>
                <th>Klussen</th>
                <th>Werkdagen</th>
                <th>Per dag</th>
                <th style={{ textAlign: 'right' }}>Omzet</th>
              </tr>
            </thead>
            <tbody>
              {(technician.data ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.empty}>Nog geen monteurs.</td>
                </tr>
              ) : (
                (technician.data ?? []).map((row) => (
                  <tr key={row.technician_id as string}>
                    <td className={styles.strong}>{row.name as string}</td>
                    <td>{show(row.klussen)}</td>
                    <td>{show(row.werkdagen)}</td>
                    <td>{show(row.per_dag)}</td>
                    <td className={styles.money}>
                      {show(row.omzet, (n) => MONEY.format(n))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className={styles.note}>Capaciteit, en de vraag of er iemand bij moet.</p>
      </div>

      <div className={styles.panel}>
        <h2>5 · Vraag per regio</h2>
        <div className={styles.wrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Postcode</th>
                <th>Leads</th>
                <th>Verkocht</th>
              </tr>
            </thead>
            <tbody>
              {(region.data ?? []).length === 0 ? (
                <tr>
                  <td colSpan={3} className={styles.empty}>Nog geen data.</td>
                </tr>
              ) : (
                (region.data ?? []).map((row) => (
                  <tr key={row.postcode4 as string}>
                    <td className={styles.strong}>{row.postcode4 as string}</td>
                    <td>{show(row.leads)}</td>
                    <td>{show(row.verkocht)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className={styles.note}>
          Dit sluit terug op de website: komen er veel leads uit één regio, dan
          verdient die stadspagina de volgende uren contentwerk. Het CRM levert
          hier het bewijs voor de SEO-planning.
        </p>
      </div>
    </>
  );
}
