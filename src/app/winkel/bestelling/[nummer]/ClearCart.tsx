'use client';

import { useEffect } from 'react';
import { useCart } from '../../CartProvider';

/**
 * Empties the basket once an order is paid.
 *
 * A one-line client component rather than logic on the page, because the page
 * is a server component and the basket lives in localStorage. Rendered only
 * when the order's status is actually `paid`, so an abandoned Mollie screen
 * leaves the basket alone.
 */
export default function ClearCart() {
  const { clear, ready, count } = useCart();

  useEffect(() => {
    if (ready && count > 0) clear();
  }, [ready, count, clear]);

  return null;
}
