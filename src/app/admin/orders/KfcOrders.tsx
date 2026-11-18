import Link from 'next/link';
import { PageHead, Card, Badge, Notice, Table, ui } from '../_ui';
import { PreviewText } from '../PreviewLanguage';
import { SHOPS, sampleOrders, type OrderStatus } from '@/lib/kfcSampleOrders';
import styles from '../overzicht/dashboard.module.css';

/**
 * Orders from the three web shops, newest first. Read-only: an order is
 * handled in WooCommerce; this screen is for finding one and seeing what was
 * in it. Preview: sample orders.
 */

const STATUS: Record<OrderStatus, { label: string; tone?: 'ok' | 'warn' | 'stop' | 'info' }> = {
  processing: { label: 'In behandeling', tone: 'info' },
  completed: { label: 'Afgerond', tone: 'ok' },
  'on-hold': { label: 'Wacht op betaling', tone: 'warn' },
  cancelled: { label: 'Geannuleerd' },
  refunded: { label: 'Terugbetaald', tone: 'stop' },
};

const LIMIT = 150;
const euro = (cents: number) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100);
const when = (iso: string) =>
  new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' }).format(new Date(iso));

export default function KfcOrders({ shop, status, q }: { shop?: string; status?: string; q?: string }) {
  const query = (q ?? '').trim().toUpperCase();
  const orders = sampleOrders().filter((order) =>
    (!shop || order.shop === shop) &&
    (!status || order.status === status) &&
    (!query || order.number.includes(query) || order.lines.some((line) => line.sku.toUpperCase().includes(query))));
  const shown = orders.slice(0, LIMIT);

  const link = (change: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const next = { shop, status, q, ...change };
    for (const [key, value] of Object.entries(next)) if (value) params.set(key, value);
    const text = params.toString();
    return text ? `/admin/orders?${text}` : '/admin/orders';
  };

  return (
    <div className={styles.page}>
      <PageHead
        title={<PreviewText>Bestellingen</PreviewText>}
        sub={<><PreviewText>Alle drie de webshops</PreviewText> · {orders.length}</>}
      />
      <Notice><PreviewText>Voorbeeldbestellingen. Echte producten en prijzen, verzonnen klanten en aantallen.</PreviewText></Notice>

      <nav className={styles.periods} aria-label="Webshop">
        <Link href={link({ shop: undefined })} className={!shop ? styles.periodOn : styles.period}><PreviewText>Alle</PreviewText></Link>
        {SHOPS.map((s) => (
          <Link key={s} href={link({ shop: s })} className={shop === s ? styles.periodOn : styles.period}>{s}</Link>
        ))}
      </nav>
      <nav className={styles.periods} aria-label="Status">
        <Link href={link({ status: undefined })} className={!status ? styles.periodOn : styles.period}><PreviewText>Elke status</PreviewText></Link>
        {(Object.keys(STATUS) as OrderStatus[]).map((s) => (
          <Link key={s} href={link({ status: s })} className={status === s ? styles.periodOn : styles.period}>
            <PreviewText>{STATUS[s].label}</PreviewText>
          </Link>
        ))}
      </nav>
      <form method="get" action="/admin/orders">
        {shop && <input type="hidden" name="shop" value={shop} />}
        {status && <input type="hidden" name="status" value={status} />}
        <input className={ui.input} type="search" name="q" defaultValue={q} placeholder="Zoek op ordernummer of SKU" aria-label="Zoek bestelling" />
      </form>

      <Card>
        <Table head={<>
          <th><PreviewText>Datum</PreviewText></th>
          <th><PreviewText>Webshop</PreviewText></th>
          <th><PreviewText>Bestelling</PreviewText></th>
          <th><PreviewText>Producten</PreviewText></th>
          <th><PreviewText>Land</PreviewText></th>
          <th><PreviewText>Excl. btw</PreviewText></th>
          <th>Status</th>
        </>}>
          {shown.map((order) => (
            <tr key={`${order.shop}-${order.number}`}>
              <td>{when(order.created)}</td>
              <td>{order.shop}</td>
              <td>#{order.number}</td>
              <td>
                {order.lines.map((line) => (
                  <div key={line.sku}>
                    {line.quantity} × <Link href={`/admin/voorraad/p/${encodeURIComponent(line.sku)}`}>{line.sku}</Link>{' '}
                    <span className={styles.kpiFoot}>{line.name.slice(0, 48)}</span>
                  </div>
                ))}
              </td>
              <td>{order.country}</td>
              <td>{euro(order.totalExcl)}</td>
              <td><Badge tone={STATUS[order.status].tone}><PreviewText>{STATUS[order.status].label}</PreviewText></Badge></td>
            </tr>
          ))}
        </Table>
      </Card>
      {orders.length > LIMIT && (
        <p className={styles.kpiFoot}><PreviewText>De nieuwste 150. Zoek op ordernummer of SKU voor oudere.</PreviewText></p>
      )}
    </div>
  );
}
