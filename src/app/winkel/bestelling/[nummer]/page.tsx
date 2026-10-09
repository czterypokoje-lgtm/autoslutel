import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SITE_CONFIG } from '@/config/site.config';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { formatPrice } from '@/lib/catalog';
import ClearCart from './ClearCart';
import styles from './bestelling.module.css';

/**
 * Where Mollie sends the customer back.
 *
 * Deliberately NOT the page that marks anything paid. The redirect is a
 * browser navigation the customer controls — they can reach this URL by
 * typing it, and Mollie's own docs are explicit that the webhook, not the
 * redirect, is what settles a payment. So this page only *reads* the order
 * the webhook may or may not have updated yet, and says honestly which of
 * those two it is looking at.
 *
 * `pending` here is normal and not an error: the webhook and the redirect
 * race, and the webhook often lands a second later.
 */

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { absolute: 'Uw bestelling | Autosleutel24' },
  robots: { index: false, follow: false },
};

/** AS24-2026-00042 and nothing else. */
const ORDER_NUMBER = /^AS24-\d{4}-\d{5}$/;

interface OrderItem {
  slug: string;
  title: string;
  qty: number;
  unit_price_inc: number;
  line_total_inc: number;
}

export default async function BestellingPage({
  params,
}: {
  params: Promise<{ nummer: string }>;
}) {
  const { nummer } = await params;
  const orderNumber = decodeURIComponent(nummer).toUpperCase();

  if (!ORDER_NUMBER.test(orderNumber)) notFound();

  /*
   * A deployment with no service-role key cannot read the order back. That
   * must not be a blank 500: this is the page a customer lands on straight
   * after paying, and a stack trace there reads as "my money is gone". They
   * get their order number and a phone number instead.
   */
  let db;
  try {
    db = createSupabaseAdminClient();
  } catch {
    return <OrderUnavailable orderNumber={orderNumber} />;
  }

  /*
   * Read by order number alone, with no further credential.
   *
   * That is a real decision and worth naming: the number is guessable in
   * principle — it is sequential — so this page must never show anything
   * whose disclosure would matter. It shows the lines, the total and the
   * status. It does NOT select the name, address, e-mail or phone, even
   * though they sit on the same row, so a guessed number leaks a parts list
   * and not a customer. A guest checkout has no account to log into, and
   * e-mailing a token to see your own order confirmation is a worse trade
   * than withholding the address from a page the customer already knows.
   */
  const { data: order, error } = await db
    .from('orders')
    .select('order_number, status, items, subtotal_inc, shipping_cost, total_inc, created_at')
    .eq('order_number', orderNumber)
    .maybeSingle();

  if (error || !order) notFound();

  const items = (Array.isArray(order.items) ? order.items : []) as OrderItem[];
  const paid = order.status === 'paid';
  const failed = order.status === 'cancelled';

  return (
    <main className="container">
      {/*
        The basket is emptied here and not at checkout: someone who backed out
        of the Mollie screen has to find their basket intact. Only a paid order
        clears it.
      */}
      {paid ? <ClearCart /> : null}

      <div className={styles.wrap}>
        {paid ? (
          <>
            <p className={styles.kicker}>Bedankt</p>
            <h1 className={styles.title}>Uw bestelling is betaald</h1>
            <p className={styles.lead}>
              Bestelnummer <strong>{order.order_number}</strong>. U krijgt een
              bevestiging per e-mail. We pakken uw onderdelen in op de eerstvolgende
              werkdag en sturen het track &amp; trace-nummer zodra het pakket
              onderweg is.
            </p>
          </>
        ) : failed ? (
          <>
            <p className={`${styles.kicker} ${styles.kickerBad}`}>Niet gelukt</p>
            <h1 className={styles.title}>De betaling is niet afgerond</h1>
            <p className={styles.lead}>
              Bestelnummer <strong>{order.order_number}</strong> staat klaar, maar er
              is niet betaald — misschien is de betaling afgebroken of verlopen. Er is
              niets afgeschreven. Uw mandje staat er nog, dus u kunt het opnieuw
              proberen.
            </p>
            <div className={styles.actions}>
              <Link href="/winkel/mandje" className="btn btn-primary">
                Opnieuw afrekenen
              </Link>
              <a href={`tel:${SITE_CONFIG.phoneTel}`} className="btn btn-outline">
                Bel {SITE_CONFIG.phone}
              </a>
            </div>
          </>
        ) : (
          <>
            <p className={styles.kicker}>Even geduld</p>
            <h1 className={styles.title}>We wachten op de betaling</h1>
            <p className={styles.lead}>
              Bestelnummer <strong>{order.order_number}</strong>. Uw bank heeft ons de
              bevestiging nog niet doorgegeven — dat duurt meestal een paar seconden.
              Vernieuw deze pagina. Blijft dit staan en is er wél geld afgeschreven,
              bel ons dan met dit bestelnummer.
            </p>
            <div className={styles.actions}>
              <a href={`tel:${SITE_CONFIG.phoneTel}`} className="btn btn-outline">
                Bel {SITE_CONFIG.phone}
              </a>
            </div>
          </>
        )}

        <section className={styles.summary}>
          <h2 className={styles.summaryTitle}>Wat u besteld heeft</h2>
          <ul className={styles.items}>
            {items.map((item) => (
              <li key={item.slug} className={styles.item}>
                <span className={styles.itemQty}>{item.qty}×</span>
                <Link href={`/winkel/artikel/${item.slug}`} className={styles.itemTitle}>
                  {item.title}
                </Link>
                <span className={styles.itemPrice}>{formatPrice(item.line_total_inc)}</span>
              </li>
            ))}
          </ul>

          <dl className={styles.totals}>
            <div className={styles.totalRow}>
              <dt>Artikelen</dt>
              <dd>{formatPrice(Number(order.subtotal_inc))}</dd>
            </div>
            <div className={styles.totalRow}>
              <dt>Verzending</dt>
              <dd>
                {Number(order.shipping_cost) === 0
                  ? 'gratis'
                  : formatPrice(Number(order.shipping_cost))}
              </dd>
            </div>
            <div className={`${styles.totalRow} ${styles.totalGrand}`}>
              <dt>Totaal</dt>
              <dd>{formatPrice(Number(order.total_inc))}</dd>
            </div>
          </dl>
        </section>

        <p className={styles.footNote}>
          14 dagen bedenktijd: u mag de bestelling binnen 14 dagen na ontvangst zonder
          opgaaf van reden terugsturen. Mail{' '}
          <a href={`mailto:${SITE_CONFIG.email}`}>{SITE_CONFIG.email}</a> met uw
          bestelnummer en we sturen de retourinstructies. Een sleutelbaard die al op
          uw slot gezaagd is valt daarbuiten — die is op maat gemaakt.
        </p>
      </div>
    </main>
  );
}

/**
 * Shown when we cannot read the order back at all.
 *
 * It deliberately claims nothing about whether the payment succeeded, because
 * we do not know — the one thing we can honestly give the customer is their
 * order number and a way to reach a person.
 */
function OrderUnavailable({ orderNumber }: { orderNumber: string }) {
  return (
    <main className="container">
      <div className={styles.wrap}>
        <p className={styles.kicker}>Even geduld</p>
        <h1 className={styles.title}>We kunnen uw bestelling nu niet ophalen</h1>
        <p className={styles.lead}>
          Uw bestelnummer is <strong>{orderNumber}</strong> — schrijf het even op.
          Vernieuw deze pagina over een minuut. Lukt dat niet, bel ons dan met dit
          nummer; wij zien aan onze kant of de betaling is aangekomen.
        </p>
        <div className={styles.actions}>
          <a href={`tel:${SITE_CONFIG.phoneTel}`} className="btn btn-primary">
            Bel {SITE_CONFIG.phone}
          </a>
          <a href={`mailto:${SITE_CONFIG.email}`} className="btn btn-outline">
            {SITE_CONFIG.email}
          </a>
        </div>
      </div>
    </main>
  );
}
