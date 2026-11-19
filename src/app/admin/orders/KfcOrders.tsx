import Link from 'next/link';
import { PageHead, Card, Badge, Notice, Table, ui } from '../_ui';
import { PreviewInput, PreviewText } from '../PreviewLanguage';
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

const LIMIT = 30;
const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const WHEN = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' });

export default function KfcOrders({ shop, status, q, requestedPage }: { shop?: string; status?: string; q?: string; requestedPage?: string }) {
  const query = (q ?? '').trim().toUpperCase();
  const orders = sampleOrders().filter((order) =>
    (!shop || order.shop === shop) &&
    (!status || order.status === status) &&
    (!query || order.number.includes(query) || order.lines.some((line) => line.sku.toUpperCase().includes(query))));
  const pageCount = Math.max(1, Math.ceil(orders.length / LIMIT));
  const requested = Number(requestedPage);
  const page = Number.isInteger(requested) ? Math.min(pageCount, Math.max(1, requested)) : 1;
  const shown = orders.slice((page - 1) * LIMIT, page * LIMIT);

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

      <div className={styles.orderFilters}>
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
        <PreviewInput className={ui.input} type="search" name="q" defaultValue={q} placeholder="Zoek op ordernummer of SKU" aria-label="Zoek bestelling" />
      </form>
      </div>

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
              <td>{WHEN.format(new Date(order.created))}</td>
              <td>{order.shop}</td>
              <td>#{order.number}</td>
              <td>
                {order.lines.map((line) => (
                  <div key={line.sku}>
                    {line.quantity} × <Link prefetch={false} href={`/admin/voorraad/p/${encodeURIComponent(line.sku)}`}>{line.sku}</Link>{' '}
                    <span className={styles.kpiFoot}>{line.name.slice(0, 48)}</span>
                  </div>
                ))}
              </td>
              <td>{order.country}</td>
              <td>{MONEY.format(order.totalExcl / 100)}</td>
              <td><Badge tone={STATUS[order.status].tone}><PreviewText>{STATUS[order.status].label}</PreviewText></Badge></td>
            </tr>
          ))}
        </Table>
      </Card>
      {pageCount > 1 && <div className={styles.orderFilters}>
        {page > 1 && <Link className={ui.btn} href={link({ page: String(page - 1) })}><PreviewText>Vorige pagina</PreviewText></Link>}
        <span>{page} / {pageCount}</span>
        {page < pageCount && <Link className={ui.btn} href={link({ page: String(page + 1) })}><PreviewText>Volgende pagina</PreviewText></Link>}
      </div>}
    </div>
  );
}
