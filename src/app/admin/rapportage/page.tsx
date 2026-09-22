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

  const [source, service, response, technician, region, make, makeRegion, commission, capabilityGap, finance] = await Promise.all([
    supabase.from('erp_report_finance_monthly').select('*').order('month', { ascending: false }).limit(12),
    supabase.from('crm_report_source').select('*'),
    supabase.from('crm_report_service').select('*').order('klussen', { ascending: false }),
    supabase.from('crm_report_response').select('*').order('week', { ascending: false }).limit(8),
    supabase.from('crm_report_technician').select('*').order('klussen', { ascending: false }),
    supabase.from('crm_report_region').select('*').order('leads', { ascending: false }).limit(15),
    supabase.from('crm_report_make').select('*').order('omzet', { ascending: false }),
    supabase
      .from('crm_report_make_region')
      .select('*')
      .order('omzet', { ascending: false })
      .limit(20),
    supabase.from('crm_report_commission').select('*').order('omzet', { ascending: false }),
    supabase
      .from('crm_report_capability_gap_summary')
      .select('*')
      .order('gemiste_leads', { ascending: false })
      .limit(20),
  ]);

  const failed = [
    source,
    service,
    response,
    technician,
    region,
    make,
    makeRegion,
    commission,
    capabilityGap,
    finance,
  ].find((r) => r.error);
  if (failed?.error) {
    const missing = /does not exist|relation|permission denied/i.test(failed.error.message);
    return (
      <div className={styles.warning}>
        De rapportage kon niet worden geladen: {failed.error.message}
        {missing && (
          <>
            <br />
            Voer <code>supabase/migrations/0006_customers_reports.sql</code>,{' '}
            <code>supabase/migrations/0036_revenue_analysis.sql</code> en{' '}
            <code>supabase/migrations/0037_capability_gaps.sql</code> uit.
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

      <div className={styles.panel} style={{ marginBottom: 48, borderColor: '#0ea5e9' }}>
        <h2 style={{ color: '#0369a1' }}>ERP Financiële Rapportage (Job Costing)</h2>
        <div className={styles.wrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Maand</th>
                <th style={{ textAlign: 'right' }}>Afg. Klussen</th>
                <th style={{ textAlign: 'right' }}>Omzet</th>
                <th style={{ textAlign: 'right' }}>Kosten (Mat.)</th>
                <th style={{ textAlign: 'right' }}>Kosten (Loon)</th>
                <th style={{ textAlign: 'right' }}>Kosten (Overig)</th>
                <th style={{ textAlign: 'right', fontWeight: 700 }}>Brutowinst</th>
                <th style={{ textAlign: 'right', fontWeight: 700 }}>Marge %</th>
              </tr>
            </thead>
            <tbody>
              {(finance.data || []).map((row: any) => {
                const rev = Number(row.total_revenue) || 0;
                const margin = Number(row.total_gross_margin) || 0;
                const pct = rev > 0 ? Math.round((margin / rev) * 100) : 0;
                return (
                  <tr key={row.month}>
                    <td>{row.month}</td>
                    <td style={{ textAlign: 'right' }}>{row.completed_jobs}</td>
                    <td style={{ textAlign: 'right' }}>{MONEY.format(rev)}</td>
                    <td style={{ textAlign: 'right', color: '#dc2626' }}>{MONEY.format(row.total_material_cost)}</td>
                    <td style={{ textAlign: 'right', color: '#dc2626' }}>{MONEY.format(row.total_labor_cost)}</td>
                    <td style={{ textAlign: 'right', color: '#dc2626' }}>{MONEY.format(row.total_travel_cost + row.total_other_costs)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: margin > 0 ? '#059669' : '#dc2626' }}>{MONEY.format(margin)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: pct >= 50 ? '#059669' : pct >= 30 ? '#d97706' : '#dc2626' }}>{pct}%</td>
                  </tr>
                );
              })}
              {(!finance.data || finance.data.length === 0) && (
                <tr><td colSpan={8} className={styles.empty}>Nog geen ERP-klussen met kostprijsgegevens.</td></tr>
              )}
            </tbody>
          </table>
        </div>
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
        <div className={styles.cards}>
          {sources.length === 0 ? (
            <p className={styles.empty}>Nog geen data.</p>
          ) : (
            sources.map(([name, s]) => (
              <div key={name} className={styles.card}>
                <div className={styles.cardHead}>
                  <span className={`${styles.strong} ${styles.cardTitle}`}>{name}</span>
                </div>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Leads / klussen / verkocht</span>
                  <span className={styles.cardValue}>{s.leads} / {s.klussen} / {s.verkocht}</span>
                </div>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Conversie</span>
                  <span className={styles.cardValue}>{percent(s.verkocht, s.leads)}</span>
                </div>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Omzet</span>
                  <span className={styles.cardValue}>{MONEY.format(s.omzet)}</span>
                </div>
              </div>
            ))
          )}
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
        <div className={styles.cards}>
          {(service.data ?? []).length === 0 ? (
            <p className={styles.empty}>Nog geen afgeronde klussen.</p>
          ) : (
            (service.data ?? []).map((row) => (
              <div key={row.dienst as string} className={styles.card}>
                <div className={styles.cardHead}>
                  <span className={`${styles.strong} ${styles.cardTitle}`}>{row.dienst as string}</span>
                </div>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Afgeronde klussen</span>
                  <span className={styles.cardValue}>{show(row.klussen)}</span>
                </div>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Gemiddeld</span>
                  <span className={styles.cardValue}>{show(row.gemiddelde_waarde, (n) => MONEY.format(n))}</span>
                </div>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Totaal</span>
                  <span className={styles.cardValue}>{show(row.totaal, (n) => MONEY.format(n))}</span>
                </div>
              </div>
            ))
          )}
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
        <div className={styles.cards}>
          {(technician.data ?? []).length === 0 ? (
            <p className={styles.empty}>Nog geen monteurs.</p>
          ) : (
            (technician.data ?? []).map((row) => (
              <div key={row.technician_id as string} className={styles.card}>
                <div className={styles.cardHead}>
                  <span className={`${styles.strong} ${styles.cardTitle}`}>{row.name as string}</span>
                </div>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Klussen / werkdagen / per dag</span>
                  <span className={styles.cardValue}>{show(row.klussen)} / {show(row.werkdagen)} / {show(row.per_dag)}</span>
                </div>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Omzet</span>
                  <span className={styles.cardValue}>{show(row.omzet, (n) => MONEY.format(n))}</span>
                </div>
              </div>
            ))
          )}
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
        <div className={styles.cards}>
          {(region.data ?? []).length === 0 ? (
            <p className={styles.empty}>Nog geen data.</p>
          ) : (
            (region.data ?? []).map((row) => (
              <div key={row.postcode4 as string} className={styles.card}>
                <div className={styles.cardHead}>
                  <span className={`${styles.strong} ${styles.cardTitle}`}>{row.postcode4 as string}</span>
                </div>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Leads</span>
                  <span className={styles.cardValue}>{show(row.leads)}</span>
                </div>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Verkocht</span>
                  <span className={styles.cardValue}>{show(row.verkocht)}</span>
                </div>
              </div>
            ))
          )}
        </div>
        <p className={styles.note}>
          Dit sluit terug op de website: komen er veel leads uit één regio, dan
          verdient die stadspagina de volgende uren contentwerk. Het CRM levert
          hier het bewijs voor de SEO-planning.
        </p>
      </div>

      <div className={styles.panel}>
        <h2>6 · Omzet en annuleringen per automerk</h2>
        <div className={styles.wrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Merk</th>
                <th>Klussen</th>
                <th>Geannuleerd</th>
                <th>Annuleer %</th>
                <th style={{ textAlign: 'right' }}>Gemiddeld</th>
                <th style={{ textAlign: 'right' }}>Omzet</th>
              </tr>
            </thead>
            <tbody>
              {(make.data ?? []).length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.empty}>Nog geen afgeronde klussen.</td>
                </tr>
              ) : (
                (make.data ?? []).map((row) => (
                  <tr key={row.merk as string}>
                    <td className={styles.strong}>{row.merk as string}</td>
                    <td>{show(row.klussen)}</td>
                    <td>{show(row.geannuleerd)}</td>
                    <td>{show(row.annuleer_pct, (n) => `${n}%`)}</td>
                    <td className={styles.money}>
                      {show(row.gemiddelde_prijs, (n) => MONEY.format(n))}
                    </td>
                    <td className={styles.money}>{show(row.omzet, (n) => MONEY.format(n))}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className={styles.cards}>
          {(make.data ?? []).length === 0 ? (
            <p className={styles.empty}>Nog geen afgeronde klussen.</p>
          ) : (
            (make.data ?? []).map((row) => (
              <div key={row.merk as string} className={styles.card}>
                <div className={styles.cardHead}>
                  <span className={`${styles.strong} ${styles.cardTitle}`}>{row.merk as string}</span>
                </div>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Klussen / geannuleerd</span>
                  <span className={styles.cardValue}>{show(row.klussen)} / {show(row.geannuleerd)} ({show(row.annuleer_pct, (n) => `${n}%`)})</span>
                </div>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Gemiddeld / omzet</span>
                  <span className={styles.cardValue}>{show(row.gemiddelde_prijs, (n) => MONEY.format(n))} / {show(row.omzet, (n) => MONEY.format(n))}</span>
                </div>
              </div>
            ))
          )}
        </div>
        <p className={styles.note}>
          Een merk met veel omzet maar ook een hoog annuleerpercentage kost meer
          tijd dan het lijkt op te leveren — dit is waar dat zichtbaar wordt.
        </p>
      </div>

      <div className={styles.panel}>
        <h2>7 · Welk merk verkoopt waar (top 20 op omzet)</h2>
        <div className={styles.wrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Merk</th>
                <th>Postcode</th>
                <th>Klussen</th>
                <th>Geannuleerd</th>
                <th style={{ textAlign: 'right' }}>Omzet</th>
              </tr>
            </thead>
            <tbody>
              {(makeRegion.data ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.empty}>Nog geen data.</td>
                </tr>
              ) : (
                (makeRegion.data ?? []).map((row) => (
                  <tr key={`${row.merk}-${row.postcode4}`}>
                    <td className={styles.strong}>{row.merk as string}</td>
                    <td>{row.postcode4 as string}</td>
                    <td>{show(row.klussen)}</td>
                    <td>{show(row.geannuleerd)}</td>
                    <td className={styles.money}>{show(row.omzet, (n) => MONEY.format(n))}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className={styles.cards}>
          {(makeRegion.data ?? []).length === 0 ? (
            <p className={styles.empty}>Nog geen data.</p>
          ) : (
            (makeRegion.data ?? []).map((row) => (
              <div key={`${row.merk}-${row.postcode4}`} className={styles.card}>
                <div className={styles.cardHead}>
                  <span className={`${styles.strong} ${styles.cardTitle}`}>
                    {row.merk as string} · {row.postcode4 as string}
                  </span>
                </div>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Klussen / geannuleerd</span>
                  <span className={styles.cardValue}>{show(row.klussen)} / {show(row.geannuleerd)}</span>
                </div>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Omzet</span>
                  <span className={styles.cardValue}>{show(row.omzet, (n) => MONEY.format(n))}</span>
                </div>
              </div>
            ))
          )}
        </div>
        <p className={styles.note}>
          Waar focussen: een merk dat elders verlies draait kan hier alsnog de
          moeite waard zijn in één specifieke regio, en omgekeerd.
        </p>
      </div>

      <div className={styles.panel}>
        <h2>8 · Commissie per monteur — afgesproken vs. echt</h2>
        <div className={styles.wrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Monteur</th>
                <th>Klussen</th>
                <th style={{ textAlign: 'right' }}>Omzet</th>
                <th style={{ textAlign: 'right' }}>Commissie</th>
                <th>Effectief %</th>
                <th>Ingesteld %</th>
              </tr>
            </thead>
            <tbody>
              {(commission.data ?? []).length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.empty}>Nog geen monteurs.</td>
                </tr>
              ) : (
                (commission.data ?? []).map((row) => (
                  <tr key={row.technician_id as string}>
                    <td className={styles.strong}>{row.name as string}</td>
                    <td>{show(row.klussen)}</td>
                    <td className={styles.money}>{show(row.omzet, (n) => MONEY.format(n))}</td>
                    <td className={styles.money}>{show(row.commissie, (n) => MONEY.format(n))}</td>
                    <td>{show(row.effectief_commissie_pct, (n) => `${n}%`)}</td>
                    <td>{show(row.gemiddeld_ingesteld_pct, (n) => `${n}%`)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className={styles.cards}>
          {(commission.data ?? []).length === 0 ? (
            <p className={styles.empty}>Nog geen monteurs.</p>
          ) : (
            (commission.data ?? []).map((row) => (
              <div key={row.technician_id as string} className={styles.card}>
                <div className={styles.cardHead}>
                  <span className={`${styles.strong} ${styles.cardTitle}`}>{row.name as string}</span>
                </div>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Omzet / commissie</span>
                  <span className={styles.cardValue}>{show(row.omzet, (n) => MONEY.format(n))} / {show(row.commissie, (n) => MONEY.format(n))}</span>
                </div>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Effectief % / ingesteld %</span>
                  <span className={styles.cardValue}>{show(row.effectief_commissie_pct, (n) => `${n}%`)} / {show(row.gemiddeld_ingesteld_pct, (n) => `${n}%`)}</span>
                </div>
              </div>
            ))
          )}
        </div>
        <p className={styles.note}>
          &quot;Effectief %&quot; is commissie gedeeld door omzet — wat er echt
          binnenkomt. Wijkt dit structureel af van het ingestelde percentage,
          dan klopt er iets niet in de afspraak of in hoe een monteur betaalt.
        </p>
      </div>

      <div className={styles.panel}>
        <h2>9 · Leads buiten capaciteit</h2>
        <div className={styles.wrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Merk</th>
                <th>Jaar</th>
                <th>Scenario</th>
                <th>Gemiste leads</th>
                <th>Laatste</th>
              </tr>
            </thead>
            <tbody>
              {(capabilityGap.data ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.empty}>
                    Geen gemiste leads door ontbrekende capaciteit — of nog geen
                    dekking ingesteld om tegen te toetsen.
                  </td>
                </tr>
              ) : (
                (capabilityGap.data ?? []).map((row, i) => (
                  <tr key={i}>
                    <td className={styles.strong}>{row.brand as string}</td>
                    <td>{show(row.year)}</td>
                    <td>{row.scenario as string}</td>
                    <td>{show(row.gemiste_leads)}</td>
                    <td>
                      {row.laatste
                        ? new Date(row.laatste as string).toLocaleDateString('nl-NL')
                        : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className={styles.cards}>
          {(capabilityGap.data ?? []).length === 0 ? (
            <p className={styles.empty}>
              Geen gemiste leads door ontbrekende capaciteit — of nog geen
              dekking ingesteld om tegen te toetsen.
            </p>
          ) : (
            (capabilityGap.data ?? []).map((row, i) => (
              <div key={i} className={styles.card}>
                <div className={styles.cardHead}>
                  <span className={`${styles.strong} ${styles.cardTitle}`}>
                    {row.brand as string} {show(row.year)} · {row.scenario as string}
                  </span>
                </div>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Gemiste leads</span>
                  <span className={styles.cardValue}>{show(row.gemiste_leads)}</span>
                </div>
              </div>
            ))
          )}
        </div>
        <p className={styles.note}>
          Niet geraden: afgeleid uit de echte dekking in technician_coverage.
          Een lead staat hier alleen als geen enkele actieve monteur dat merk +
          jaar + scenario momenteel dekt — bijvoorbeeld &quot;Mercedes-Benz na
          2014&quot; als dat expliciet is uitgesloten. Dit is waar een nieuwe
          tool of monteur zich het snelst terugbetaalt.
        </p>
      </div>
    </>
  );
}
