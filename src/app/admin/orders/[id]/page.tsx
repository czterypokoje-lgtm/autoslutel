import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import styles from '../../klanten/klanten.module.css';
import OrderPanel, { type OrderDetail } from './OrderPanel';
import { SERVICE_LABEL, SERVICE_NEEDS, type ServiceOption } from '@/lib/services';

export const dynamic = 'force-dynamic';

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

interface OrderLine {
  name?: string;
  title?: string;
  quantity?: number;
  /** Older orders wrote `price`; checkout writes unitPrice and lineTotal. */
  price?: number | string;
  unitPrice?: number | string;
  lineTotal?: number | string;
  surcharge?: number | string;
  service?: ServiceOption;
  slug?: string;
}

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireOfficeUser(`/admin/orders/${id}`);

  const supabase = await createSupabaseServerClient();

  const [{ data: order }, { data: jobs }] = await Promise.all([
    supabase.from('orders').select('*').eq('id', id).maybeSingle(),
    supabase
      .from('jobs')
      .select('id, status, scheduled_date, slot_start, slot_end')
      .eq('order_id', id),
  ]);

  if (!order) notFound();

  // `items` is a jsonb snapshot taken at checkout — deliberately not re-read
  // from the catalogue, so an edited product cannot rewrite an old order.
  const items: OrderLine[] = Array.isArray(order.items) ? (order.items as OrderLine[]) : [];

  return (
    <>
      <div className={styles.head}>
        <h1 className={styles.title}>{order.order_number as string}</h1>
        <span className={styles.count}>
          {MONEY.format(Number(order.total_inc ?? 0))} · {order.status as string}
        </span>
        <span className={styles.search}>
          <Link className={styles.link} href="/admin/orders">Terug naar bestellingen</Link>
        </span>
      </div>

      <div className={styles.cols}>
        <div>
          <div className={styles.panel}>
            <h2>Regels</h2>
            {items.length === 0 ? (
              <p className={styles.note}>Geen regels vastgelegd.</p>
            ) : (
              items.map((line, i) => (
                <div key={`${line.slug ?? i}`} className={styles.item}>
                  <span className={styles.strong}>
                    {line.name ?? line.title ?? 'Onbekend artikel'}
                  </span>
                  <span className={styles.sub}>
                    {line.quantity ?? 1} ×{' '}
                    {(() => {
                      const unit = line.unitPrice ?? line.price;
                      return unit !== undefined ? MONEY.format(Number(unit)) : 'geen prijs';
                    })()}
                    {/*
                      The service is the part the office has to act on: a line
                      bought as "opsturen" means a parcel is on its way here,
                      and one bought as "monteur" is a job to be planned. It
                      was in the order data and shown nowhere.
                    */}
                    {line.service && line.service !== 'product_only' && (
                      <>
                        {' · '}
                        <strong>{SERVICE_LABEL[line.service]}</strong>
                        {Number(line.surcharge) > 0 && ` (+${MONEY.format(Number(line.surcharge))})`}
                        {SERVICE_NEEDS[line.service].oldKey && ' — klant stuurt sleutel op'}
                      </>
                    )}
                  </span>
                </div>
              ))
            )}
            <div className={styles.summary} style={{ marginTop: 12 }}>
              <span className={styles.summaryKey}>Subtotaal</span>
              <span className={styles.summaryVal}>{MONEY.format(Number(order.subtotal_inc ?? 0))}</span>
              <span className={styles.summaryKey}>Verzending</span>
              <span className={styles.summaryVal}>{MONEY.format(Number(order.shipping_cost ?? 0))}</span>
              <span className={styles.summaryKey}>Btw</span>
              <span className={styles.summaryVal}>{MONEY.format(Number(order.total_vat ?? 0))}</span>
              <span className={styles.summaryKey}>Totaal</span>
              <span className={styles.summaryVal}>{MONEY.format(Number(order.total_inc ?? 0))}</span>
            </div>
          </div>

          <div className={styles.panel}>
            <h2>Klant</h2>
            <div className={styles.summary}>
              <span className={styles.summaryKey}>Naam</span>
              <span className={styles.summaryVal}>{order.name as string}</span>
              <span className={styles.summaryKey}>E-mail</span>
              <span className={styles.summaryVal}>
                <a href={`mailto:${order.email as string}`}>{order.email as string}</a>
              </span>
              <span className={styles.summaryKey}>Telefoon</span>
              <span className={styles.summaryVal}>
                {order.phone ? <a href={`tel:${order.phone as string}`}>{order.phone as string}</a> : '—'}
              </span>
              <span className={styles.summaryKey}>Adres</span>
              <span className={styles.summaryVal}>
                {[order.street, order.postcode, order.city].filter(Boolean).join(', ')}
              </span>
              <span className={styles.summaryKey}>Kenteken</span>
              <span className={styles.summaryVal}>{(order.kenteken as string) ?? '—'}</span>
            </div>
          </div>
        </div>

        <div>
          {order.needs_technician === true && (
            <div className={styles.panel}>
              <h2>Monteur</h2>
              {(jobs ?? []).length === 0 ? (
                <>
                  <p className={styles.note}>
                    Deze bestelling is met monteur besteld en er staat nog geen
                    afspraak. De klant heeft betaald — zonder afspraak komt er
                    niemand.
                  </p>
                  <Link
                    className={styles.link}
                    href={`/admin/jobs/nieuw?order=${id}`}
                  >
                    Klus inplannen →
                  </Link>
                </>
              ) : (
                (jobs ?? []).map((j) => (
                  <div key={j.id as string} className={styles.item}>
                    <Link className={styles.link} href={`/admin/jobs/${j.id as string}`}>
                      <span className={styles.strong}>
                        {j.scheduled_date as string} · {String(j.slot_start).slice(0, 5)}
                      </span>
                    </Link>
                    <span className={styles.sub}>{j.status as string}</span>
                  </div>
                ))
              )}
            </div>
          )}

          <OrderPanel order={order as unknown as OrderDetail} />
        </div>
      </div>
    </>
  );
}
