import Link from 'next/link';
import { PreviewText } from '@/app/admin/PreviewLanguage';
import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import styles from '../klanten/klanten.module.css';
import kpi from '../overzicht/overzicht.module.css';

export const dynamic = 'force-dynamic';

/**
 * E-mailmarketing van de webshop, voor kantoor. Per automatische mail de hele
 * trechter: verstuurd → afgeleverd → geopend → geklikt → besteld → omzet.
 *
 * Bronnen (allemaal geschreven door de webshop, gelezen door het CRM):
 *   marketing_sends   wat wij verstuurden (shop 0081), met Resend's bericht-id (0084)
 *   marketing_events  wat Resend terugmeldde per bericht (0084)
 *   orders            betaalde bestellingen; een bestelling telt voor een mail als
 *                     hetzelfde adres binnen 7 dagen na die mail betaalde, of als de
 *                     bestelling via de knop in die mail binnenkwam (utm_campaign).
 * Openen en klikken verschijnen pas als tracking in Resend aanstaat (Domains → Tracking).
 */

const FLOW_LABEL: Record<string, string> = {
  abandoned_checkout: 'Niet afgeronde bestelling',
  program_help: 'Hulp bij inleren (dag 3)',
  review_request: 'Reviewverzoek',
  spare_key: 'Reservesleutel (30 dagen)',
  battery: 'Batterijtip (11 maanden)',
  lead_followup: 'Opvolging prijsaanvraag',
};
const REASON_LABEL: Record<string, string> = { unsubscribed: 'Afgemeld', complained: 'Als spam gemeld', bounced: 'Adres bestaat niet' };
const EVENT_LABEL: Record<string, string> = { delivered: 'afgeleverd', opened: 'geopend', clicked: 'geklikt', bounced: 'gebounced', complained: 'spam gemeld', delivery_delayed: 'vertraagd' };
const PAID = ['paid', 'processing', 'shipped', 'delivered'];
const DAY = 86400000;
const ATTRIBUTION_DAYS = 7;

const DATE = new Intl.DateTimeFormat('nl-NL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' });
const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 1000) / 10}%` : '—');

interface Send { flow: string; ref: string; email: string; status: string; sent_at: string; provider_id: string | null }
interface Ev { provider_id: string | null; type: string; email: string | null; url: string | null; occurred_at: string }
interface Order { id: string; email: string; status: string; total_inc: number | string; created_at: string; utm_campaign: string | null; consent_marketing: boolean | null }

/** Data loading outside the component: the clock is read here, not during render. */
async function load() {
  const supabase = await createSupabaseServerClient();
  const now = Date.now();
  const since = (days: number) => new Date(now - days * DAY).toISOString();
  const [sends, events, orders, sup] = await Promise.all([
    supabase.from('marketing_sends').select('flow, ref, email, status, sent_at, provider_id').gte('sent_at', since(90)).order('sent_at', { ascending: false }),
    supabase.from('marketing_events').select('provider_id, type, email, url, occurred_at').gte('occurred_at', since(90)).order('occurred_at', { ascending: false }).limit(5000),
    supabase.from('orders').select('id, email, status, total_inc, created_at, utm_campaign, consent_marketing').gte('created_at', since(90)),
    supabase.from('marketing_suppressions').select('email, reason, source, created_at').order('created_at', { ascending: false }).limit(200),
  ]);
  return { now, sends, events, orders, sup };
}

const lower = (s: string | null | undefined) => (s ?? '').trim().toLowerCase();

/** Orders a send can claim: same address within the window after the send, or arrived through that mail's button. */
function attributed(send: Send, orders: Order[]): Order[] {
  const t0 = Date.parse(send.sent_at);
  return orders.filter((o) => {
    if (!PAID.includes(o.status)) return false;
    const t = Date.parse(o.created_at);
    if (t < t0 || t > t0 + ATTRIBUTION_DAYS * DAY) return false;
    return lower(o.email) === lower(send.email) || o.utm_campaign === send.flow;
  });
}

function Bars({ title, values, labels, money }: { title: string; values: number[]; labels: string[]; money?: boolean }) {
  const max = Math.max(1, ...values);
  const w = 600, h = 96, pad = 2, bw = w / values.length - pad;
  const maxAt = values.indexOf(max);
  const total = values.reduce((a, b) => a + b, 0);
  return (
    <div className={styles.panel}>
      <div className={styles.cardHead}><span className={styles.cardTitle}>{title}</span><span className={styles.sub}>{money ? MONEY.format(total) : total} in 30 dagen</span></div>
      <svg viewBox={`0 0 ${w} ${h + 18}`} width="100%" height="114" role="img" aria-label={`${title}, per dag, laatste 30 dagen`}>
        <line x1="0" y1={h} x2={w} y2={h} stroke="var(--crm-rule)" strokeWidth="1" />
        {values.map((v, i) => {
          const bh = Math.max(v > 0 ? 3 : 0, Math.round((v / max) * (h - 14)));
          const x = i * (bw + pad);
          return (
            <g key={i}>
              <rect x={x} y={h - bh} width={bw} height={bh} rx="3" fill="#2a78d6"><title>{`${labels[i]}: ${money ? MONEY.format(v) : v}`}</title></rect>
              {i === maxAt && v > 0 && <text x={x + bw / 2} y={h - bh - 4} textAnchor="middle" fontSize="11" fill="var(--crm-ink-2, #52514e)">{money ? MONEY.format(v) : v}</text>}
              {(i === 0 || i === values.length - 1 || i === 15) && <text x={x + bw / 2} y={h + 13} textAnchor="middle" fontSize="10" fill="var(--crm-ink-2, #52514e)">{labels[i]}</text>}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default async function MarketingPage() {
  await requireOfficeUser('/admin/marketing');
  const loaded = await load().catch((e: Error) => ({ error: e }));
  const err = 'error' in loaded ? loaded.error : loaded.sends.error ?? loaded.sup.error;
  if (err || 'error' in loaded) {
    const message = err?.message ?? 'onbekende fout';
    return (
      <div className={styles.warning}>
        Marketinggegevens konden niet worden geladen: {message}
        {/does not exist|relation|permission denied/i.test(message) && <><br />Voer in de webshop-repo <code>supabase/0081_marketing_consent.sql</code> en <code>0084_marketing_events.sql</code> uit.</>}
      </div>
    );
  }
  const { now, sends, events, orders, sup } = loaded;
  const S = (sends.data ?? []) as Send[];
  const E = (events.error ? [] : events.data ?? []) as Ev[];
  const O = (orders.error ? [] : orders.data ?? []) as Order[];
  const since30 = now - 30 * DAY;

  // Events by message id; a send without provider_id (older than 0084) cannot be followed.
  const byMsg = new Map<string, Set<string>>();
  for (const e of E) if (e.provider_id) { const set = byMsg.get(e.provider_id) ?? new Set(); set.add(e.type); byMsg.set(e.provider_id, set); }
  const has = (s: Send, type: string) => !!s.provider_id && !!byMsg.get(s.provider_id)?.has(type);

  const flows = Object.keys(FLOW_LABEL).map((flow) => {
    const rows = S.filter((s) => s.flow === flow && s.status !== 'failed');
    const claimed = new Set<string>();
    let revenue = 0;
    for (const s of rows) for (const o of attributed(s, O)) if (!claimed.has(o.id)) { claimed.add(o.id); revenue += Number(o.total_inc); }
    return {
      flow, sent: rows.length,
      sent30: rows.filter((s) => Date.parse(s.sent_at) >= since30).length,
      delivered: rows.filter((s) => has(s, 'delivered')).length,
      opened: rows.filter((s) => has(s, 'opened')).length,
      clicked: rows.filter((s) => has(s, 'clicked')).length,
      orders: claimed.size, revenue,
    };
  });
  const tot = flows.reduce((a, f) => ({ sent: a.sent + f.sent, delivered: a.delivered + f.delivered, opened: a.opened + f.opened, clicked: a.clicked + f.clicked, orders: a.orders + f.orders, revenue: a.revenue + f.revenue }), { sent: 0, delivered: 0, opened: 0, clicked: 0, orders: 0, revenue: 0 });
  const sent30 = S.filter((s) => s.status !== 'failed' && Date.parse(s.sent_at) >= since30);
  const paid30 = O.filter((o) => PAID.includes(o.status) && Date.parse(o.created_at) >= since30);
  const consented30 = paid30.filter((o) => o.consent_marketing === true).length;
  const revenue30 = (() => { const seen = new Set<string>(); let sum = 0; for (const s of sent30) for (const o of attributed(s, O)) if (!seen.has(o.id)) { seen.add(o.id); sum += Number(o.total_inc); } return sum; })();
  const trackingOn = E.some((e) => e.type === 'opened' || e.type === 'clicked');

  // 30 days, oldest first.
  const days = Array.from({ length: 30 }, (_, i) => { const d = new Date(now - (29 - i) * DAY); d.setHours(0, 0, 0, 0); return d; });
  const label = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}`;
  const perDay = (ts: number[]) => days.map((d) => ts.filter((t) => t >= d.getTime() && t < d.getTime() + DAY).length);
  const sendsPerDay = perDay(sent30.map((s) => Date.parse(s.sent_at)));
  const attributedOrders = (() => { const seen = new Map<string, Order>(); for (const s of S) for (const o of attributed(s, O)) seen.set(o.id, o); return [...seen.values()]; })();
  const revenuePerDay = days.map((d) => attributedOrders.filter((o) => { const t = Date.parse(o.created_at); return t >= d.getTime() && t < d.getTime() + DAY; }).reduce((a, o) => a + Number(o.total_inc), 0));

  const flowOfMsg = new Map(S.filter((s) => s.provider_id).map((s) => [s.provider_id as string, s.flow]));
  const feed = E.filter((e) => e.type !== 'delivery_delayed').slice(0, 60);

  return (
    <>
      <div className={styles.head}>
        <h1 className={styles.title}><PreviewText>{"E-mailmarketing"}</PreviewText></h1>
        <span className={styles.count}>laatste 30 dagen · bestellingen toegerekend binnen {ATTRIBUTION_DAYS} dagen na een mail</span>
      </div>

      <div className={kpi.kpiStrip}>
        <div className={kpi.kpiCard}><div className={kpi.kpiTitle}>Toestemming bij betaalde bestellingen</div><div className={kpi.kpiMain}>{orders.error ? '—' : pct(consented30, paid30.length)}</div><div className={kpi.kpiSub}>{orders.error ? 'bestellingen niet leesbaar' : `${consented30} van ${paid30.length} vinkten het vakje aan`}</div></div>
        <div className={kpi.kpiCard}><div className={kpi.kpiTitle}>Verstuurd</div><div className={kpi.kpiMain}>{sent30.length}</div><div className={kpi.kpiSub}>{S.filter((s) => s.status === 'failed').length} mislukt in 90 dagen</div></div>
        <div className={kpi.kpiCard}><div className={kpi.kpiTitle}>Klikratio</div><div className={kpi.kpiMain}>{trackingOn ? pct(tot.clicked, tot.delivered) : '—'}</div><div className={kpi.kpiSub}>{trackingOn ? `${tot.clicked} geklikt van ${tot.delivered} afgeleverd (90 d)` : 'zet tracking aan in Resend'}</div></div>
        <div className={kpi.kpiCard}><div className={kpi.kpiTitle}>Omzet na een mail</div><div className={kpi.kpiMain}>{MONEY.format(revenue30)}</div><div className={kpi.kpiSub}>{tot.orders} bestellingen in 90 dagen · {MONEY.format(tot.revenue)}</div></div>
      </div>

      <div className={styles.cols}>
        <Bars title="Verstuurd per dag" values={sendsPerDay} labels={days.map(label)} />
        <Bars title="Omzet na een mail, per dag" values={revenuePerDay} labels={days.map(label)} money />
      </div>

      <h2 className={styles.cardTitle}><PreviewText>{"Trechter per e-mail (90 dagen)"}</PreviewText></h2>
      <div className={styles.wrap}>
        <table className={styles.table}>
          <thead><tr><th>E-mail</th><th>Verstuurd</th><th>Afgeleverd</th><th>Geopend</th><th>Geklikt</th><th>Bestellingen</th><th>Omzet</th><th>Conversie</th></tr></thead>
          <tbody>
            {flows.map((f) => (
              <tr key={f.flow}>
                <td>{FLOW_LABEL[f.flow]}<div className={styles.sub}><code>{f.flow}</code> · {f.sent30} in 30 d</div></td>
                <td>{f.sent}</td>
                <td>{f.delivered} <span className={styles.sub}>{pct(f.delivered, f.sent)}</span></td>
                <td>{trackingOn ? <>{f.opened} <span className={styles.sub}>{pct(f.opened, f.delivered)}</span></> : '—'}</td>
                <td>{trackingOn ? <>{f.clicked} <span className={styles.sub}>{pct(f.clicked, f.delivered)}</span></> : '—'}</td>
                <td>{f.orders}</td>
                <td className={styles.money}>{MONEY.format(f.revenue)}</td>
                <td className={styles.strong}>{pct(f.orders, f.sent)}</td>
              </tr>
            ))}
            <tr className={styles.strong}><td>Totaal</td><td>{tot.sent}</td><td>{tot.delivered}</td><td>{trackingOn ? tot.opened : '—'}</td><td>{trackingOn ? tot.clicked : '—'}</td><td>{tot.orders}</td><td className={styles.money}>{MONEY.format(tot.revenue)}</td><td>{pct(tot.orders, tot.sent)}</td></tr>
          </tbody>
        </table>
      </div>
      <p className={styles.note}>
        Verstuurd telt onze eigen verzending; afgeleverd, geopend en geklikt komen van Resend. Een bestelling telt één keer, bij de eerste mail die hem kan claimen. GA4 rapporteert dezelfde bestellingen onder <code>utm_medium=flow</code>, maar alleen voor bezoekers die cookies accepteerden; deze tabel niet, dus de cijfers hier zijn hoger.
        {' '}Aan/uit: Vercel, project <code>shop</code>, <code>MARKETING_FLOWS</code>.
      </p>

      <div className={styles.cols}>
        <div>
          <h2 className={styles.cardTitle}><PreviewText>{"Activiteit"}</PreviewText></h2>
          <div className={styles.wrap}>
            <table className={styles.table}>
              <thead><tr><th>Wanneer</th><th>Wat</th><th>Wie</th><th>E-mail</th></tr></thead>
              <tbody>
                {feed.length === 0 && <tr><td colSpan={4} className={styles.empty}>{S.length ? 'Nog geen terugmeldingen van Resend. Zet tracking aan in Resend → Domains, of wacht op de eerste aflevering.' : 'Nog niets verstuurd.'}</td></tr>}
                {feed.map((e, i) => (
                  <tr key={i}><td>{DATE.format(new Date(e.occurred_at))}</td><td><span className={e.type === 'clicked' ? styles.ok : e.type === 'bounced' || e.type === 'complained' ? styles.danger : undefined}>{EVENT_LABEL[e.type] ?? e.type}</span></td><td>{e.email}</td><td className={styles.sub}>{FLOW_LABEL[flowOfMsg.get(e.provider_id ?? '') ?? ''] ?? '—'}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <h2 className={styles.cardTitle}><PreviewText>{"Laatst verstuurd"}</PreviewText></h2>
          <div className={styles.wrap}>
            <table className={styles.table}>
              <thead><tr><th>Datum</th><th>E-mail</th><th>Aan</th><th>Bestelling</th></tr></thead>
              <tbody>
                {S.length === 0 && <tr><td colSpan={4} className={styles.empty}>Nog niets verstuurd.</td></tr>}
                {S.slice(0, 60).map((r) => {
                  const got = attributed(r, O);
                  return (
                    <tr key={`${r.flow}-${r.ref}`}>
                      <td>{DATE.format(new Date(r.sent_at))}</td>
                      <td>{FLOW_LABEL[r.flow] ?? r.flow}{r.status === 'failed' && <span className={styles.danger}> · mislukt</span>}</td>
                      <td>{r.email}</td>
                      <td>{got.length ? got.map((o) => <Link key={o.id} className={styles.link} href={`/admin/orders/${o.id}`}>{MONEY.format(Number(o.total_inc))}</Link>) : <span className={styles.sub}>—</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <h2 className={styles.cardTitle}><PreviewText>{"Afgemeld of geweigerd"}</PreviewText></h2>
      <div className={styles.wrap}>
        <table className={styles.table}>
          <thead><tr><th>Datum</th><th>Adres</th><th>Reden</th><th>Via</th></tr></thead>
          <tbody>
            {(sup.data ?? []).length === 0 && <tr><td colSpan={4} className={styles.empty}>Niemand.</td></tr>}
            {(sup.data ?? []).map((s) => (
              <tr key={s.email}><td>{DATE.format(new Date(s.created_at))}</td><td>{s.email}</td><td>{REASON_LABEL[s.reason] ?? s.reason}</td><td className={styles.sub}>{s.source}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
