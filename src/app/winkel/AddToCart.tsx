'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MAX_QTY_PER_LINE } from '@/lib/cart';
import { useCart } from './CartProvider';
import styles from './addToCart.module.css';

/**
 * The buy button.
 *
 * Only ever rendered for an article that can actually be posted — the product
 * page decides that, not this component. A `programming` article gets the
 * phone-number box instead, and the two are mutually exclusive by
 * construction rather than by a flag passed in here.
 */
export default function AddToCart({
  slug,
  title,
  price,
  image,
  inStock,
}: {
  slug: string;
  title: string;
  price: number;
  image: string | null;
  inStock: boolean;
}) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (!inStock) {
    return (
      <div className={styles.soldOut}>
        <p className={styles.soldOutTitle}>Tijdelijk niet op voorraad</p>
        <p className={styles.soldOutText}>
          We bestellen dit artikel per klus bij onze leverancier. Bel ons en we
          zeggen wanneer het binnen is.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        <label className={styles.qtyLabel} htmlFor="qty">
          Aantal
        </label>
        <select
          id="qty"
          className={styles.qty}
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
        >
          {Array.from({ length: MAX_QTY_PER_LINE }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>

        <button
          type="button"
          className={`btn btn-primary ${styles.addBtn}`}
          onClick={() => {
            add({ slug, qty, title, price, image });
            setAdded(true);
          }}
        >
          In mandje
        </button>
      </div>

      {/*
        Stays on the page after adding rather than jumping to the basket. On a
        parts order the common case is buying a housing and a battery together,
        and a redirect makes the second one a journey back.
      */}
      {added ? (
        <p className={styles.addedRow} role="status">
          Toegevoegd. <Link href="/winkel/mandje">Naar het mandje →</Link>
        </p>
      ) : null}
    </div>
  );
}
