'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  formatPrice,
  FREE_SHIPPING_FROM,
  shippingFor,
  VAT_RATE,
} from '@/lib/catalog';
import { MAX_QTY_PER_LINE } from '@/lib/cart';
import { SITE_CONFIG } from '@/config/site.config';
import { useCart } from '../CartProvider';
import styles from './mandje.module.css';

/**
 * Basket and address on one screen.
 *
 * One screen and not a three-step wizard, because this is a parts order: the
 * median article in the sellable catalogue costs a few euro, and a €9
 * housing does not survive three pages of form. Everything needed to pay is
 * visible at once, and paying leaves for Mollie.
 *
 * Every total here is a preview. `/api/checkout` recomputes all of it from
 * the catalogue — see the note at the top of src/lib/cart.ts for why that is
 * not duplication but the whole point.
 */

interface Rejected {
  slug: string;
  reason: string;
}

export default function CartScreen() {
  const { lines, ready, subtotal, update, remove } = useCart();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    street: '',
    postcode: '',
    city: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejected, setRejected] = useState<Rejected[]>([]);

  const shipping = shippingFor(subtotal);
  const total = Math.round((subtotal + shipping) * 100) / 100;
  const vat = Math.round((total - total / (1 + VAT_RATE)) * 100) / 100;
  const toFreeShipping = Math.max(0, FREE_SHIPPING_FROM - subtotal);

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function pay() {
    setBusy(true);
    setError(null);
    setRejected([]);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        /*
         * Slugs and quantities only. The route ignores anything else in the
         * body, so sending prices would be pointless as well as dishonest.
         */
        body: JSON.stringify({
          ...form,
          lines: lines.map((l) => ({ slug: l.slug, qty: l.qty })),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json?.error ?? 'Afrekenen lukte niet.');
        if (Array.isArray(json?.rejected)) setRejected(json.rejected);
        return;
      }

      /*
       * The basket is NOT cleared here. It is cleared on the confirmation
       * page, once Mollie has sent the customer back — someone who abandons
       * the Mollie screen must still find their basket where they left it.
       */
      window.location.href = json.checkoutUrl;
    } catch {
      setError('Afrekenen lukte niet. Probeer het opnieuw of bel ons.');
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return (
      <main className="container">
        <div className={styles.loading}>Mandje laden…</div>
      </main>
    );
  }

  if (lines.length === 0) {
    return (
      <main className="container">
        <div className={styles.empty}>
          <h1 className={styles.emptyTitle}>Uw mandje is leeg</h1>
          <p className={styles.emptyText}>
            Zoek op uw auto en we laten zien welke onderdelen erop passen.
          </p>
          <Link href="/winkel" className="btn btn-primary">
            Naar de winkel
          </Link>
        </div>
      </main>
    );
  }

  const canPay =
    !busy &&
    form.name.trim() !== '' &&
    form.email.trim() !== '' &&
    form.street.trim() !== '' &&
    form.postcode.trim() !== '' &&
    form.city.trim() !== '';

  return (
    <main className="container">
      <h1 className={styles.title}>Uw mandje</h1>

      <div className={styles.layout}>
        {/* ── the lines ──────────────────────────────────────────────── */}
        <section>
          <ul className={styles.lines}>
            {lines.map((line) => {
              const bad = rejected.find((r) => r.slug === line.slug);
              return (
                <li
                  key={line.slug}
                  className={`${styles.line} ${bad ? styles.lineBad : ''}`}
                >
                  <div className={styles.linePhoto}>
                    {line.image ? (
                      <Image
                        src={line.image}
                        alt={line.title}
                        fill
                        sizes="72px"
                        quality={60}
                        style={{ objectFit: 'contain' }}
                      />
                    ) : null}
                  </div>

                  <div className={styles.lineBody}>
                    <Link href={`/winkel/artikel/${line.slug}`} className={styles.lineTitle}>
                      {line.title}
                    </Link>
                    <p className={styles.lineUnit}>{formatPrice(line.price)} per stuk</p>
                    {bad ? <p className={styles.lineError}>{bad.reason}</p> : null}
                  </div>

                  <div className={styles.lineControls}>
                    <label className={styles.srOnly} htmlFor={`qty-${line.slug}`}>
                      Aantal {line.title}
                    </label>
                    <select
                      id={`qty-${line.slug}`}
                      className={styles.lineQty}
                      value={line.qty}
                      onChange={(e) => update(line.slug, Number(e.target.value))}
                    >
                      {Array.from({ length: MAX_QTY_PER_LINE }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                    <p className={styles.lineTotal}>
                      {formatPrice(Math.round(line.price * line.qty * 100) / 100)}
                    </p>
                    <button
                      type="button"
                      className={styles.lineRemove}
                      onClick={() => remove(line.slug)}
                    >
                      Verwijder
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          <Link href="/winkel" className={styles.keepShopping}>
            ← Verder zoeken
          </Link>
        </section>

        {/* ── address and totals ─────────────────────────────────────── */}
        <aside className={styles.panel}>
          <h2 className={styles.panelTitle}>Bezorgen aan</h2>

          <div className={styles.fields}>
            <Field label="Naam" value={form.name} onChange={set('name')} autoComplete="name" />
            <Field
              label="E-mailadres"
              value={form.email}
              onChange={set('email')}
              type="email"
              autoComplete="email"
              hint="Hier sturen we uw bestelbevestiging naartoe."
            />
            <Field
              label="Telefoon"
              value={form.phone}
              onChange={set('phone')}
              type="tel"
              autoComplete="tel"
              optional
            />
            <Field
              label="Straat en huisnummer"
              value={form.street}
              onChange={set('street')}
              autoComplete="street-address"
            />
            <div className={styles.fieldRow}>
              <Field
                label="Postcode"
                value={form.postcode}
                onChange={set('postcode')}
                autoComplete="postal-code"
                placeholder="1234 AB"
              />
              <Field
                label="Woonplaats"
                value={form.city}
                onChange={set('city')}
                autoComplete="address-level2"
              />
            </div>
          </div>

          <dl className={styles.totals}>
            <div className={styles.totalRow}>
              <dt>Artikelen</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            <div className={styles.totalRow}>
              <dt>Verzending</dt>
              <dd>{shipping === 0 ? 'gratis' : formatPrice(shipping)}</dd>
            </div>
            <div className={`${styles.totalRow} ${styles.totalRowGrand}`}>
              <dt>Totaal</dt>
              <dd>{formatPrice(total)}</dd>
            </div>
            <div className={styles.totalRowSmall}>
              <dt>waarvan btw ({Math.round(VAT_RATE * 100)}%)</dt>
              <dd>{formatPrice(vat)}</dd>
            </div>
          </dl>

          {toFreeShipping > 0 ? (
            <p className={styles.shippingNudge}>
              Nog {formatPrice(toFreeShipping)} en de verzending is gratis.
            </p>
          ) : null}

          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            className={`btn btn-primary ${styles.payBtn}`}
            onClick={() => void pay()}
            disabled={!canPay}
          >
            {busy ? 'Even geduld…' : `Afrekenen · ${formatPrice(total)}`}
          </button>

          <p className={styles.legal}>
            U betaalt via Mollie (iDEAL, creditcard). Door te bestellen gaat u akkoord
            met onze{' '}
            <Link href="/algemene-voorwaarden">algemene voorwaarden</Link>. U heeft 14
            dagen bedenktijd: binnen die termijn kunt u de bestelling zonder opgaaf van
            reden terugsturen. Een sleutelbaard die al op uw slot gezaagd is kunnen we
            niet terugnemen — die is dan op maat gemaakt.
          </p>

          <p className={styles.helpLine}>
            Liever even overleggen?{' '}
            <a href={`tel:${SITE_CONFIG.phoneTel}`}>{SITE_CONFIG.phone}</a>
          </p>
        </aside>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  autoComplete,
  placeholder,
  hint,
  optional,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  hint?: string;
  optional?: boolean;
}) {
  const id = `f-${label.toLowerCase().replace(/[^a-z]+/g, '-')}`;
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel} htmlFor={id}>
        {label}
        {optional ? <span className={styles.fieldOptional}> (optioneel)</span> : null}
      </label>
      <input
        id={id}
        className={styles.fieldInput}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={!optional}
      />
      {hint ? <p className={styles.fieldHint}>{hint}</p> : null}
    </div>
  );
}
