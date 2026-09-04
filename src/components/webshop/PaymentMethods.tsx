import React from 'react';
import icons from '@/lib/paymentIcons.json';

/**
 * The payment methods a customer will actually be offered, and who delivers.
 *
 * Not a decorative row of logos: the icons are the official ones from Mollie,
 * for exactly the methods enabled on our own account — read from their API and
 * saved into public/images/payment. Showing a card logo we cannot accept is
 * the kind of promise a customer discovers at the last step of the checkout.
 *
 * When a method is switched on or off at Mollie, re-run:
 *
 *   node scripts/sync-payment-icons.mjs
 *
 * That writes the icons and src/lib/paymentIcons.json. The list is imported
 * rather than read off disk because the footer renders inside the client
 * layout, where there is no filesystem.
 *
 * The carrier is separate: it is a fact about our shipping, not about Mollie.
 */

/** Enabled on the Mollie account, in the order a Dutch customer expects. */
const METHODS: { id: string; label: string }[] = [
  { id: 'ideal', label: 'iDEAL' },
  { id: 'creditcard', label: 'Creditcard' },
  { id: 'bancontact', label: 'Bancontact' },
  { id: 'paypal', label: 'PayPal' },
  { id: 'klarna', label: 'Klarna — achteraf betalen' },
  { id: 'riverty', label: 'Riverty — achteraf betalen' },
  { id: 'banktransfer', label: 'Overboeking' },
  { id: 'paybybank', label: 'Pay by Bank' },
  { id: 'kbc', label: 'KBC' },
  { id: 'belfius', label: 'Belfius' },
];

/**
 * Who we hand the parcel to.
 *
 * A logo file in public/images/carriers/<id>.svg (or .png) is used when it is
 * there; without one the name is shown as text, which is a true statement
 * either way. Add or remove a carrier here — never leave one on the page that
 * we do not actually ship with.
 */
const CARRIERS: { id: string; label: string }[] = [
  { id: 'dhl', label: 'DHL' },
  { id: 'postnl', label: 'PostNL' },
];

const ICONS = icons as { id: string; file: string }[];

/** The icon we actually downloaded for this method, or nothing. */
const iconFor = (id: string): string | null =>
  ICONS.find((i) => i.id === id)?.file ?? null;

export default function PaymentMethods({
  compact = false,
}: {
  /** In a sidebar or a footer column, where the row has to stay small. */
  compact?: boolean;
}) {
  const methods = METHODS.map((m) => ({ ...m, icon: iconFor(m.id) })).filter((m) => m.icon);

  /*
   * Carrier logos are trademarks and we hold no file for them yet; the name
   * in text says the same thing truthfully. Drop <id>.svg into
   * public/images/carriers and add it to the manifest to show the mark.
   */
  const carriers = CARRIERS.map((c) => ({ ...c, icon: null as string | null }));

  if (methods.length === 0 && carriers.length === 0) return null;

  const height = compact ? 22 : 28;

  return (
    <div className="pay-strip">
      <div className="pay-strip-group">
        <span className="pay-strip-label">Veilig betalen met</span>
        <ul className="pay-strip-list">
          {methods.map((m) => (
            <li key={m.id} title={m.label}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.icon!} alt={m.label} height={height} style={{ height }} loading="lazy" />
            </li>
          ))}
        </ul>
      </div>

      {carriers.length > 0 && (
        <div className="pay-strip-group">
          <span className="pay-strip-label">Verzonden met</span>
          <ul className="pay-strip-list">
            {carriers.map((c) =>
              c.icon ? (
                <li key={c.id} title={c.label}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.icon} alt={c.label} height={height} style={{ height }} loading="lazy" />
                </li>
              ) : (
                // No logo file yet — the carrier's name is the honest fallback.
                <li key={c.id}>
                  <span className="pay-strip-name">{c.label}</span>
                </li>
              )
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
