import Link from 'next/link';
import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import styles from '../klanten/klanten.module.css';

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

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requireOfficeUser('/admin/orders');

  const sp = await searchParams;
  const status = TABS.some((t) => t.value === sp.status) ? sp.status : undefined;
  const search = (sp.q ?? '').replace(/[,()%*\\]/g, ' ').trim().slice(0, 60);

  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from('orders')
    .select(
      'id, order_number, status, name, email, postcode, city, total_inc, needs_technician, kenteken, tracking_code, created_at, paid_at'
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
      <div className={styles.head}>
        <h1 className={styles.title}>Bestellingen</h1>
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
          <button className={styles.apply} type="submit">Zoek</button>
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
          {queue.length === 1 ? '' : 'en'} met monteur wacht nog op een afspraak:
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
              <th>Klant</th>
              <th>Plaats</th>
              <th>Status</th>
              <th>Monteur nodig</th>
              <th>Track &amp; trace</th>
              <th style={{ textAlign: 'right' }}>Totaal</th>
              <th>Datum</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.empty}>
                  Geen bestellingen. De webshop kan pas afrekenen als er een
                  Mollie-sleutel is ingesteld — tot die tijd blijft deze lijst leeg.
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
                    <span className={`${styles.badge} ${styles.no}`}>
                      {o.status as string}
                    </span>
                  </td>
                  <td>
                    {o.needs_technician ? (
                      <span className={`${styles.badge} ${styles.ok}`}>ja</span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>{(o.tracking_code as string) ?? '—'}</td>
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
    </>
  );
}
