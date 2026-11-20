import { PreviewText } from '@/app/admin/PreviewLanguage';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { isoDate } from '@/lib/crmJobs';
import { technicianColour } from '@/lib/crmColours';
import { PageHead } from '../_ui';
import SalesChart from '../overzicht/SalesChart';
import { SPAN_LABEL, type Bucket, type Report, type Span } from './reportData';
import r from './rapport.module.css';

const EUR = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const money = (v: number | null) => (v === null ? '—' : EUR.format(v));
const pct = (part: number, whole: number) => (whole > 0 ? `${Math.round((part / whole) * 100)}%` : '—');

/** "↑ 12%" against the previous period; lower-is-better flips the colour. */
function Delta({ cur, prev, lowerIsBetter = false }: { cur: number | null; prev: number | null; lowerIsBetter?: boolean }) {
  if (cur === null || prev === null || prev === 0) return <span className={r.dNone}>—</span>;
  const change = Math.round(((cur - prev) / Math.abs(prev)) * 100);
  const good = lowerIsBetter ? change <= 0 : change >= 0;
  return (
    <span className={good ? r.dUp : r.dDown}>
      {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
    </span>
  );
}

function BucketTable({ title, rows, total }: { title: string; rows: Bucket[]; total: number }) {
  return (
    <section className={r.card}>
      <h3>{title}</h3>
      {rows.length === 0 ? (
        <p className={r.empty}><PreviewText>{"Geen klussen in deze periode."}</PreviewText></p>
      ) : (
        <ul className={r.bars}>
          {rows.map((b) => (
            <li key={b.label}>
              <span className={r.barLabel}>{b.label}</span>
              <span className={r.barTrack}>
                <span style={{ width: `${total ? Math.max(3, Math.round((b.revenue / total) * 100)) : 0}%` }} />
              </span>
              <span className={r.barValue}>{EUR.format(b.revenue)}</span>
              <span className={r.barCount}>{b.jobs}×</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** The report itself, given its numbers. */
export default function ReportView({ d, anchor }: { d: Report; anchor: string }) {
  const span = d.span;
  const c = d.cur;
  const p = d.prev;

  const net = (t: typeof c) => t.margin - (t.adSpend ?? 0) - t.expenses;
  const href = (s: Span, a: string) => `/admin/rapport?p=${s}&d=${a}`;
  const maxTech = Math.max(1, ...d.technicians.map((t) => t.revenue));
  const prevName = { week: 'vorige week', maand: 'vorige maand', kwartaal: 'vorig kwartaal', jaar: 'vorig jaar' }[span];

  return (
    <>
      <PageHead
        title="Prestaties"
        sub={`Wat het bedrijf en elke monteur deden, vergeleken met ${prevName}.`}
        actions={
          <a className={r.export} href={`/api/admin/winst/export?van=${d.range.from}&tot=${d.range.to}`}>
            <Download size={16} /> Excel
          </a>
        }
      />

      <div className={r.toolbar}>
        <nav className={r.spans} aria-label="Periode">
          {(['week', 'maand', 'kwartaal', 'jaar'] as Span[]).map((s) => (
            <Link key={s} href={href(s, anchor)} className={s === span ? r.spanOn : r.span}>
              {SPAN_LABEL[s]}
            </Link>
          ))}
        </nav>
        <div className={r.stepper}>
          <Link href={href(span, d.prevAnchor)} className={r.step} aria-label="Vorige periode">
            <ChevronLeft size={18} />
          </Link>
          <span className={r.period}>{d.label}</span>
          <Link href={href(span, d.nextAnchor)} className={r.step} aria-label="Volgende periode">
            <ChevronRight size={18} />
          </Link>
          {!d.isCurrent && (
            <Link href={href(span, isoDate(new Date()))} className={r.now}>
              Naar nu
            </Link>
          )}
        </div>
      </div>

      {/* ── the business ── */}
      <div className={r.kpis}>
        <div className={`${r.kpi} ${r.kpiMain}`}>
          <span><PreviewText>{"Omzet"}</PreviewText></span>
          <b>{money(c.revenue)}</b>
          <small>
            <Delta cur={c.revenue} prev={p.revenue} /> · {prevName} {money(p.revenue)}
          </small>
        </div>
        <div className={r.kpi}>
          <span><PreviewText>{"Brutowinst"}</PreviewText></span>
          <b>{money(c.margin)}</b>
          <small>
            <Delta cur={c.margin} prev={p.margin} /> · {pct(c.margin, c.revenue)} van omzet
          </small>
        </div>
        <div className={r.kpi}>
          <span><PreviewText>{"Onze commissie"}</PreviewText></span>
          <b>{money(c.commission)}</b>
          <small>
            <Delta cur={c.commission} prev={p.commission} /> · van monteurs
          </small>
        </div>
        <div className={r.kpi}>
          <span><PreviewText>{"Klussen"}</PreviewText></span>
          <b>{c.jobs}</b>
          <small>
            <Delta cur={c.jobs} prev={p.jobs} /> · {c.cancelled} geannuleerd
          </small>
        </div>
        <div className={r.kpi}>
          <span><PreviewText>{"Gemiddelde klus"}</PreviewText></span>
          <b>{money(c.jobs ? c.revenue / c.jobs : null)}</b>
          <small>
            <Delta cur={c.jobs ? c.revenue / c.jobs : null} prev={p.jobs ? p.revenue / p.jobs : null} />
          </small>
        </div>
        <div className={r.kpi}>
          <span>Leads</span>
          <b>{c.leads}</b>
          <small>
            <Delta cur={c.leads} prev={p.leads} /> · {pct(c.sold, c.leads)} <PreviewText>{"verkocht"}</PreviewText>
          </small>
        </div>
        <div className={r.kpi}>
          <span><PreviewText>{"Advertenties"}</PreviewText></span>
          <b>{c.adSpend === null ? 'Niet gekoppeld' : money(c.adSpend)}</b>
          <small>
            {c.adSpend === null ? (
              'kosten nog niet gesynchroniseerd'
            ) : (
              <>
                <Delta cur={c.adSpend} prev={p.adSpend} lowerIsBetter /> · {c.jobs && c.adSpend ? `${money(c.adSpend / c.jobs)} per klus` : '—'}
              </>
            )}
          </small>
        </div>
        <div className={r.kpi}>
          <span><PreviewText>{"Uitgaven"}</PreviewText></span>
          <b>{money(c.expenses)}</b>
          <small>
            <Delta cur={c.expenses} prev={p.expenses} lowerIsBetter /> · bonnetjes
          </small>
        </div>
        <div className={`${r.kpi} ${r.kpiNet}`}>
          <span><PreviewText>{"Netto over"}</PreviewText></span>
          <b>{money(net(c))}</b>
          <small>
            <Delta cur={net(c)} prev={net(p)} /> · winst − advertenties − uitgaven
          </small>
        </div>
      </div>

      <section className={r.card}>
        <h3>
          Verloop · {span === 'jaar' ? 'per maand' : span === 'kwartaal' ? 'per week' : 'per dag'}
        </h3>
        <SalesChart data={d.series} barLabel="Omzet" lineLabel="Brutowinst" countLabel="klussen" />
      </section>

      {/* ── every technician ── */}
      <section className={r.card}>
        <h3><PreviewText>{"Per monteur"}</PreviewText></h3>
        {d.technicians.length === 0 ? (
          <p className={r.empty}><PreviewText>{"Geen monteurs met klussen in deze periode."}</PreviewText></p>
        ) : (
          <div className={r.tableWrap}>
            <table className={r.table}>
              <thead>
                <tr>
                  <th><PreviewText>{"Monteur"}</PreviewText></th>
                  <th className={r.num}><PreviewText>{"Klussen"}</PreviewText></th>
                  <th className={r.num}><PreviewText>{"Omzet"}</PreviewText></th>
                  <th className={r.num}>vs {prevName}</th>
                  <th className={r.num}><PreviewText>{"Brutowinst"}</PreviewText></th>
                  <th className={r.num}><PreviewText>{"Onze commissie"}</PreviewText></th>
                  <th className={r.num}><PreviewText>{"Monteur verdiende"}</PreviewText></th>
                  <th className={r.num}><PreviewText>{"Gem. klus"}</PreviewText></th>
                  <th className={r.num}><PreviewText>{"Aanbod geaccepteerd"}</PreviewText></th>
                  <th className={r.num}><PreviewText>{"Geannuleerd"}</PreviewText></th>
                </tr>
              </thead>
              <tbody>
                {d.technicians.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <Link href={`/admin/monteurs/${t.id}`} className={r.tech}>
                        <span className={r.dot} style={{ background: technicianColour(t.color) }} />
                        <span>
                          <b>{t.name}</b>
                          <span className={r.share}>
                            <span style={{ width: `${Math.round((t.revenue / maxTech) * 100)}%`, background: technicianColour(t.color) }} />
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className={r.num}>{t.jobs}</td>
                    <td className={`${r.num} ${r.strong}`}>{EUR.format(t.revenue)}</td>
                    <td className={r.num}>
                      <Delta cur={t.revenue} prev={t.prevRevenue} />
                    </td>
                    <td className={r.num}>{EUR.format(t.margin)}</td>
                    <td className={r.num}>{EUR.format(t.commission)}</td>
                    <td className={r.num}>{EUR.format(t.earned)}</td>
                    <td className={r.num}>{t.jobs ? EUR.format(t.revenue / t.jobs) : '—'}</td>
                    <td className={r.num}>{t.offered ? `${t.accepted}/${t.offered} · ${pct(t.accepted, t.offered)}` : '—'}</td>
                    <td className={`${r.num} ${t.cancelled ? r.warn : ''}`}>{t.cancelled || '—'}</td>
                  </tr>
                ))}
                {d.unassigned.jobs > 0 && (
                  <tr>
                    <td className={r.muted}><PreviewText>{"Zonder monteur"}</PreviewText></td>
                    <td className={r.num}>{d.unassigned.jobs}</td>
                    <td className={r.num}>{EUR.format(d.unassigned.revenue)}</td>
                    <td colSpan={7} />
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td><PreviewText>{"Totaal"}</PreviewText></td>
                  <td className={r.num}>{c.jobs}</td>
                  <td className={r.num}>{EUR.format(c.revenue)}</td>
                  <td className={r.num}>
                    <Delta cur={c.revenue} prev={p.revenue} />
                  </td>
                  <td className={r.num}>{EUR.format(c.margin)}</td>
                  <td className={r.num}>{EUR.format(c.commission)}</td>
                  <td className={r.num}>{EUR.format(c.revenue - c.commission)}</td>
                  <td className={r.num}>{c.jobs ? EUR.format(c.revenue / c.jobs) : '—'}</td>
                  <td />
                  <td className={r.num}>{c.cancelled || '—'}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      {/* ── where it came from ── */}
      <div className={r.grid}>
        <BucketTable title="Per dienst" rows={d.byService} total={c.revenue} />
        <BucketTable title="Per automerk" rows={d.byMake} total={c.revenue} />
        <BucketTable title="Per plaats" rows={d.byCity} total={c.revenue} />
        <section className={r.card}>
          <h3><PreviewText>{"Leads per bron"}</PreviewText></h3>
          {d.bySource.length === 0 ? (
            <p className={r.empty}><PreviewText>{"Geen leads in deze periode."}</PreviewText></p>
          ) : (
            <ul className={r.bars}>
              {d.bySource.map((s) => (
                <li key={s.label}>
                  <span className={r.barLabel}>{s.label}</span>
                  <span className={r.barTrack}>
                    <span style={{ width: `${Math.max(3, Math.round((s.leads / Math.max(1, c.leads)) * 100))}%` }} />
                  </span>
                  <span className={r.barValue}>{s.leads}</span>
                  <span className={r.barCount}>{pct(s.sold, s.leads)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <p className={r.foot}>
        Omzet = wat de klant betaalde op afgeronde klussen, geteld op de dag van afronden. Brutowinst = na materiaal, reis,
        betaalkosten en monteur. Commissie = wat Autosleutel24 inhoudt (afgesproken percentage, anders 25%).
      </p>
    </>
  );
}
