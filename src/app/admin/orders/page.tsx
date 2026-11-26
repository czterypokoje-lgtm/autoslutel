import { PreviewText } from '@/app/admin/PreviewLanguage';
import Link from 'next/link';
import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import styles from '../klanten/klanten.module.css';
import KfcOrders from './KfcOrders';
import LiveRefresh from '../live/LiveRefresh';
import { IS_KEYFORCARS, WAREHOUSE } from '@/config/install';

export const dynamic = 'force-dynamic';

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const DATE = new Intl.DateTimeFormat('nl-NL', {
  day: '2-digit', month: '2-digit', year: 'numeric',
  timeZone: 'Europe/Amsterdam',
});

const TABS = [
  { value: '', label: 'Alles' },
  { value: 'paid', label: 'Betaald' },
  { value: 'processing', label: 'In behandeling' },
  { value: 'shipped', label: 'Verzonden' },
  { value: 'delivered', label: 'Bezorgd' },
  { value: 'pending', label: 'Niet betaald' },
  { value: 'cancelled', label: 'Geannuleerd' },
  { value: 'refunded', label: 'Terugbetaald' },
] as const;

const STATUS_CLASS: Record<string, string> = {
  paid: styles.stPaid, delivered: styles.stDelivered, processing: styles.stProcessing, shipped: styles.stShipped,
  pending: styles.stPending, cancelled: styles.stCancelled, refunded: styles.stRefunded,
};
const STATUS_LABEL: Record<string, string> = Object.fromEntries(TABS.filter((t) => t.value).map((t) => [t.value, t.label]));
const StatusBadge = ({ status }: { status: string }) => (
  <span className={`${styles.badge} ${STATUS_CLASS[status] ?? styles.no}`}>{STATUS_LABEL[status] ?? status}</span>
);

/** First 90 characters of the note; a key code line stays readable because this screen is office-only anyway. */
function noteSnippet(note: string | null): string {
  const t = (note ?? '').trim().replace(/\s+/g, ' ');
  if (!t) return '—';
  return t.length > 90 ? `${t.slice(0, 90)}…` : t;
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; shop?: string; page?: string }>;
}) {
  await requireOfficeUser('/admin/orders');

  const sp = await searchParams;
  // Warehouse installs: the order ledger. The WooCommerce import panel is KeyForCars's; Autosleutel24 imports its own webshop.
  // New orders appear without a reload (paused while the tab is hidden).
  if (WAREHOUSE) return (
    <>
      <LiveRefresh seconds={10} />
      <KfcOrders shop={sp.shop} status={sp.status} q={sp.q} requestedPage={sp.page} canImport={IS_KEYFORCARS} canImportOwn={!IS_KEYFORCARS} />
    </>
  );
  const status = TABS.some((t) => t.value === sp.status) ? sp.status : undefined;
  const search = (sp.q ?? '').replace(/[,()%*\\]/g, ' ').trim().slice(0, 60);

  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from('orders')
    .select(
      'id, order_number, status, name, email, postcode, city, total_inc, needs_technician, kenteken, tracking_code, internal_note, created_at, paid_at'
    )
    .order('created_at', { ascending: false })
    .limit(200);

  if (status) query = query.eq('status', status);
  if (search) {
    query = query.or(
      [
        `order_number.ilike.%${search}%`,
        `email.ilike.%${search}%`,
        `name.ilike.%${search}%`,
        `postcode.ilike.%${search}%`,
      ].join(',')
    );
  }

  const [{ data, error }, { data: toPlan }] = await Promise.all([
    query,
    supabase.from('crm_orders_to_plan').select('id, order_number, postcode, city, kenteken'),
  ]);

  if (error) {
    const missing = /does not exist|relation|permission denied/i.test(error.message);
    return (
      <div className={styles.warning}>
        Bestellingen konden niet worden geladen: {error.message}
        {missing && (
          <>
            <br />
            Voer <code>supabase/migrations/0009_webshop_orders.sql</code> uit.
          </>
        )}
      </div>
    );
  }

  const rows = data ?? [];
  const queue = toPlan ?? [];

  return (
    <>
      <LiveRefresh seconds={10} />
      <div className={styles.head}>
        <h1 className={styles.title}><PreviewText>{"Bestellingen"}</PreviewText></h1>
        <Link className={styles.link} href="/admin/orders/inkoop">A-Key inkoop vandaag →</Link>
        <span className={styles.count}>{rows.length} getoond</span>
        <form className={styles.search} method="get" action="/admin/orders">
          {status && <input type="hidden" name="status" value={status} />}
          <input
            className={styles.control}
            type="search"
            name="q"
            defaultValue={search}
            placeholder="ordernummer, e-mail, postcode"
          />
          <button className={styles.apply} type="submit"><PreviewText>{"Zoek"}</PreviewText></button>
        </form>
      </div>

      {/*
        * The queue the handoff document warned about: a paid service order that
        * nobody plans, because the money is in one table and the agenda reads
        * another. It sits above the list so it cannot be scrolled past.
        */}
      {queue.length > 0 && (
        <div className={styles.warning}>
          <strong>{queue.length}</strong> betaalde bestelling
          <PreviewText>{queue.length === 1 ? '' : 'en'}</PreviewText> met monteur wacht nog op een afspraak:
          {' '}
          {queue.map((o, i) => (
            <span key={o.id as string}>
              {i > 0 && ', '}
              <Link className={styles.link} href={`/admin/orders/${o.id as string}`}>
                {o.order_number as string}
              </Link>{' '}
              ({[o.postcode, o.city].filter(Boolean).join(' ')})
            </span>
          ))}
          . De klant heeft betaald — zonder afspraak komt er niemand.
        </div>
      )}

      <nav className={styles.head} style={{ gap: 4 }}>
        {TABS.map((tab) => (
          <Link
            key={tab.value || 'all'}
            href={tab.value ? `/admin/orders?status=${tab.value}` : '/admin/orders'}
            className={
              (status ?? '') === tab.value
                ? `${styles.strong} ${styles.link}`
                : styles.link
            }
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <div className={styles.wrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Order</th>
              <th><PreviewText>{"Klant"}</PreviewText></th>
              <th><PreviewText>{"Plaats"}</PreviewText></th>
              <th>Status</th>
              <th>Monteur nodig</th>
              <th>Track &amp; trace</th>
              <th><PreviewText>{"Notitie"}</PreviewText></th>
              <th style={{ textAlign: 'right' }}><PreviewText>{"Totaal"}</PreviewText></th>
              <th><PreviewText>{"Datum"}</PreviewText></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} className={styles.empty}>
                  Geen bestellingen. De webshop is offline; hier staan alleen bestellingen
                  van vóór die tijd.
                </td>
              </tr>
            ) : (
              rows.map((o) => (
                <tr key={o.id as string}>
                  <td>
                    <Link
                      className={`${styles.strong} ${styles.link}`}
                      href={`/admin/orders/${o.id as string}`}
                    >
                      {o.order_number as string}
                    </Link>
                  </td>
                  <td>
                    <span className={styles.strong}>{o.name as string}</span>
                    <span className={styles.sub}>{o.email as string}</span>
                  </td>
                  <td>{[o.postcode, o.city].filter(Boolean).join(' ')}</td>
                  <td>
                    <StatusBadge status={o.status as string} />
                  </td>
                  <td>
                    {o.needs_technician ? (
                      <span className={`${styles.badge} ${styles.ok}`}>ja</span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>{(o.tracking_code as string) ?? '—'}</td>
                  {/* The office's own note, readable from the list; the full text on hover, the last line first since that is the newest. */}
                  <td title={(o.internal_note as string) ?? ''} style={{ maxWidth: 260, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {noteSnippet(o.internal_note as string | null)}
                  </td>
                  <td className={styles.money}>
                    {MONEY.format(Number(o.total_inc ?? 0))}
                  </td>
                  <td>{DATE.format(new Date(o.created_at as string))}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.cards}>
        {rows.length === 0 ? (
          <p className={styles.empty}>
            Geen bestellingen. De webshop is offline; hier staan alleen bestellingen van
            vóór die tijd.
          </p>
        ) : (
          rows.map((o) => (
            <div key={o.id as string} className={styles.card}>
              <div className={styles.cardHead}>
                <Link
                  className={`${styles.strong} ${styles.link} ${styles.cardTitle}`}
                  href={`/admin/orders/${o.id as string}`}
                >
                  {o.order_number as string}
                  <span className={styles.sub}>{o.name as string}</span>
                </Link>
                <StatusBadge status={o.status as string} />
              </div>
              <div className={styles.cardRow}>
                <span className={styles.cardLabel}><PreviewText>{"Plaats"}</PreviewText></span>
                <span className={styles.cardValue}>{[o.postcode, o.city].filter(Boolean).join(' ') || '—'}</span>
              </div>
              <div className={styles.cardRow}>
                <span className={styles.cardLabel}>Monteur nodig</span>
                <span className={styles.cardValue}>{o.needs_technician ? 'ja' : '—'}</span>
              </div>
              <div className={styles.cardRow}>
                <span className={styles.cardLabel}>Track &amp; trace</span>
                <span className={styles.cardValue}>{(o.tracking_code as string) ?? '—'}</span>
              </div>
              {o.internal_note ? (
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}><PreviewText>{"Notitie"}</PreviewText></span>
                  <span className={styles.cardValue} style={{ whiteSpace: 'pre-line' }}>{o.internal_note as string}</span>
                </div>
              ) : null}
              <div className={styles.cardRow}>
                <span className={styles.cardLabel}><PreviewText>{"Totaal"}</PreviewText></span>
                <span className={styles.cardValue}>{MONEY.format(Number(o.total_inc ?? 0))}</span>
              </div>
              <div className={styles.cardRow}>
                <span className={styles.cardLabel}><PreviewText>{"Datum"}</PreviewText></span>
                <span className={styles.cardValue}>{DATE.format(new Date(o.created_at as string))}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
