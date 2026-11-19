import Link from 'next/link';
import { PageHead, Label, Notice, Table } from '../_ui';
import { BarChart, Donut, RankedBars, chart } from '../_ui/charts';
import { PreviewDate, PreviewText } from '../PreviewLanguage';
import { SHOPS, SOLD, sampleCatalogue, sampleOrders, type SampleOrder } from '@/lib/kfcSampleOrders';
import styles from './dashboard.module.css';
import { rankProducts } from './productRanking';

/**
 * The KeyForCars owner's view: orders, revenue without VAT, units, which
 * shop, best sellers, and what has not sold. Margin waits for purchase prices.
 *
 * Reads the sample orders in the preview; the real install reads the
 * WooCommerce import, in the same shape.
 */

export type KfcPeriod = 'vandaag' | '7' | '30' | '90';
const PERIODS: { id: KfcPeriod; label: string; days: number }[] = [
  { id: 'vandaag', label: 'Vandaag', days: 1 },
  { id: '7', label: '7 dagen', days: 7 },
  { id: '30', label: '30 dagen', days: 30 },
  { id: '90', label: '90 dagen', days: 90 },
];

export function parseKfcPeriod(value: string | undefined): KfcPeriod {
  return PERIODS.some((p) => p.id === value) ? (value as KfcPeriod) : '30';
}

const TZ = 'Europe/Amsterdam';
const DAY = 86_400_000;
const dayFormatter = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, dateStyle: 'short' });
const hourFormatter = new Intl.DateTimeFormat('nl-NL', { hour: 'numeric', hourCycle: 'h23', timeZone: TZ });
export const dayKey = (time: number | string) => dayFormatter.format(new Date(time));
const hourOf = (iso: string) =>
  Number(hourFormatter.format(new Date(iso)));
const currencyFormatter = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const integerFormatter = new Intl.NumberFormat('nl-NL');
const euro = (cents: number) => currencyFormatter.format(cents / 100);
const number = (n: number) => integerFormatter.format(n);

interface Totals { orders: number; revenue: number; units: number }

function totals(orders: SampleOrder[]): Totals {
  return orders.reduce<Totals>(
    (sum, order) => ({
      orders: sum.orders + 1,
      revenue: sum.revenue + order.totalExcl,
      units: sum.units + order.lines.reduce((u, line) => u + line.quantity, 0),
    }),
    { orders: 0, revenue: 0, units: 0 },
  );
}

function Trend({ now, before }: { now: number; before: number }) {
  if (!before) return <span className={styles.trendNone}><PreviewText>geen vergelijking</PreviewText></span>;
  const change = Math.round(((now - before) / before) * 100);
  return (
    <span className={change >= 0 ? styles.trendUp : styles.trendDown}>
      {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% <PreviewText>vs vorige periode</PreviewText>
    </span>
  );
}

function Kpi({ label, value, now, before, foot, strong }: {
  label: string; value: string; now: number; before: number; foot: string; strong?: boolean;
}) {
  return (
    <div className={strong ? `${styles.kpi} ${styles.kpiStrong}` : styles.kpi}>
      <span className={styles.kpiLabel}><PreviewText>{label}</PreviewText></span>
      <span className={styles.kpiValue}>{value}</span>
      <Trend now={now} before={before} />
      <span className={styles.kpiFoot}><PreviewText>{foot}</PreviewText></span>
    </div>
  );
}

/** Every figure on the dashboard, for this moment and period. */
function readKfcDashboard(period: KfcPeriod) {
  const now = Date.now();
  const { days } = PERIODS.find((p) => p.id === period)!;
  const from = dayKey(now - (days - 1) * DAY);
  const prevFrom = dayKey(now - (2 * days - 1) * DAY);

  const all = sampleOrders(now);
  const sold = all.filter(order => SOLD.includes(order.status)).map(order => ({ order, date: dayKey(order.created) }));
  const current = sold.filter(({ date }) => date >= from);
  const inPeriod = current.map(({ order }) => order);
  // The previous period up to the same moment, so "today so far" is not compared to a whole day.
  const prevCutoff = now - days * DAY;
  const before = sold
    .filter(({ date, order }) => date >= prevFrom && date < from && Date.parse(order.created) <= prevCutoff)
    .map(({ order }) => order);
  const cur = totals(inPeriod);
  const prev = totals(before);
  const onHold = all.filter((order) => order.status === 'on-hold' && dayKey(order.created) >= from).length;

  // Revenue over time: by hour today, by day up to 30 days, by week for 90.
  const bars: { label: string; value: number }[] = [];
  if (days === 1) {
    for (let hour = 8; hour <= 23; hour++) {
      const value = inPeriod.filter((o) => hourOf(o.created) === hour).reduce((s, o) => s + o.totalExcl, 0);
      bars.push({ label: `${hour}`, value: value / 100 });
    }
  } else if (days <= 30) {
    const revenueByDay = new Map<string, number>();
    for (const { order, date } of current) {
      revenueByDay.set(date, (revenueByDay.get(date) ?? 0) + order.totalExcl);
    }
    for (let d = days - 1; d >= 0; d--) {
      const key = dayKey(now - d * DAY);
      bars.push({ label: key.slice(8), value: (revenueByDay.get(key) ?? 0) / 100 });
    }
  } else {
    for (let w = 12; w >= 0; w--) {
      const end = now - w * 7 * DAY;
      const start = end - 7 * DAY;
      const value = inPeriod
        .filter((o) => Date.parse(o.created) > start && Date.parse(o.created) <= end)
        .reduce((s, o) => s + o.totalExcl, 0);
      bars.push({ label: dayKey(end).slice(5).replace('-', '/'), value: value / 100 });
    }
  }

  const byShop = SHOPS.map((shop) => ({
    label: shop,
    value: inPeriod.filter((o) => o.shop === shop).reduce((s, o) => s + o.totalExcl, 0) / 100,
  }));

  const best = rankProducts(inPeriod)
    .slice(0, 10)
    .map(({ sku, name, units }) => ({ label: `${sku} · ${name}`, value: units }));

  // "Do not reorder": priced products without a single sale in 90 days.
  const ninety = dayKey(now - 89 * DAY);
  const soldRecently = new Set(sold.filter(({ date }) => date >= ninety).flatMap(({ order }) => order.lines.map(line => line.sku)));
  const catalogue = sampleCatalogue();
  const unsold = catalogue.filter((product) => !soldRecently.has(product.sku));

  return { now, days, cur, prev, onHold, bars, byShop, best, unsold, catalogue };
}

/**
 * Standalone it is a page of its own; embedded it is the "Webshops" section
 * under the office dashboard, with its own period switch (?webshop=) so it
 * does not fight the dashboard's (?periode=).
 */
export default function KfcDashboard({ period, embedded = false }: { period: KfcPeriod; embedded?: boolean }) {
  const { now, days, cur, prev, onHold, bars, byShop, best, unsold, catalogue } = readKfcDashboard(period);

  return (
    <div className={styles.page}>
      {embedded ? (
        <h2 className={styles.kpiValue}><PreviewText>Webshops</PreviewText></h2>
      ) : (
        <PageHead
          title={<PreviewText>Dashboard</PreviewText>}
          sub={<PreviewDate value={now} />}
        />
      )}

      <Notice>
        <PreviewText>Proefversie met voorbeeldbestellingen: echte producten en prijzen uit de webshops, verzonnen aantallen. In de echte versie komen hier de bestellingen van keyforcars.nl, klapsleutels.nl en remkeys.com binnen.</PreviewText>
      </Notice>

      <div className={styles.kpiHead}>
        <Label><PreviewText>Webshops</PreviewText></Label>
        <nav className={styles.periods} aria-label="Periode webshops">
          {PERIODS.map((p) => (
            <Link key={p.id} href={`/admin/overzicht?webshop=${p.id}`} className={p.id === period ? styles.periodOn : styles.period}>
              <PreviewText>{p.label}</PreviewText>
            </Link>
          ))}
        </nav>
      </div>
      <div className={styles.kpis}>
        <Kpi label="Bestellingen" value={number(cur.orders)} now={cur.orders} before={prev.orders}
          foot="betaald of verzonden" />
        {onHold > 0 && <div className={styles.kpi}>
          <span className={styles.kpiLabel}><PreviewText>Wacht op betaling</PreviewText></span>
          <span className={styles.kpiValue}>{number(onHold)}</span>
        </div>}
        <Kpi strong label="Omzet excl. btw" value={euro(cur.revenue)} now={cur.revenue} before={prev.revenue}
          foot="producten en verzending, zonder 21% btw" />
        <Kpi label="Stuks verkocht" value={number(cur.units)} now={cur.units} before={prev.units}
          foot="alle drie de webshops" />
        <Kpi label="Gemiddelde bestelling" value={euro(cur.orders ? cur.revenue / cur.orders : 0)}
          now={cur.orders ? cur.revenue / cur.orders : 0} before={prev.orders ? prev.revenue / prev.orders : 0}
          foot="omzet excl. btw per bestelling" />
        <div className={styles.kpi}>
          <span className={styles.kpiLabel}><PreviewText>Marge</PreviewText></span>
          <span className={styles.kpiValue}>—</span>
          <span className={styles.kpiFoot}><PreviewText>zodra de inkoopprijzen bekend zijn</PreviewText></span>
        </div>
      </div>

      <section className={styles.card}>
        <header className={styles.cardHead}>
          <span>
            <PreviewText>Omzet excl. btw</PreviewText>
            {' · '}
            <PreviewText>{days === 1 ? 'per uur' : days <= 30 ? 'per dag' : 'per week'}</PreviewText>
          </span>
          <Link href="/admin/orders"><PreviewText>Alle bestellingen →</PreviewText></Link>
        </header>
        <div className={`${styles.shopChart} ${chart.dashboardPlot}`}><BarChart bars={bars} format={(v) => euro(v * 100)} /></div>
      </section>

      <div className={styles.twoCol}>
        <section className={styles.card}>
          <header className={styles.cardHead}><span><PreviewText>Omzet per webshop</PreviewText></span></header>
          <div className={styles.shopChart}><Donut slices={byShop} format={(v) => euro(v * 100)} showValues ariaLabel="Omzet per webshop" /></div>
        </section>
        <section className={styles.card}>
          <header className={styles.cardHead}><span><PreviewText>Best verkocht (stuks)</PreviewText></span><Link href="/admin/best-verkocht"><PreviewText>Bekijk ranglijst</PreviewText></Link></header>
          <div className={`${styles.shopChart} ${styles.shopRanks} ${chart.reportWideLabels}`}><RankedBars rows={best} format={(v) => number(v)} /></div>
        </section>
      </div>

      <section className={styles.card}>
        <header className={styles.cardHead}>
          <span><PreviewText>Niet verkocht in 90 dagen</PreviewText> · {number(unsold.length)} / {number(catalogue.length)}</span>
          <Link href="/admin/voorraad"><PreviewText>Naar de voorraad →</PreviewText></Link>
        </header>
        <Notice>
          <PreviewText>Niet bijbestellen zonder eerst te tellen. Dit zijn de eerste 12.</PreviewText>
        </Notice>
        <Table head={<><th>SKU</th><th><PreviewText>Product</PreviewText></th><th><PreviewText>Prijs</PreviewText></th></>}>
          {unsold.slice(0, 12).map((product) => (
            <tr key={product.sku}>
              <td>
                <Link href={`/admin/voorraad/p/${encodeURIComponent(product.sku)}`}>{product.sku}</Link>
              </td>
              <td>{product.name}</td>
              <td>{euro(product.price)}</td>
            </tr>
          ))}
        </Table>
      </section>
    </div>
  );
}
