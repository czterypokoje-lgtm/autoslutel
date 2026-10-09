'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { formatPrice } from '@/lib/catalog';
import { useCart } from './CartProvider';
import styles from './cartBar.module.css';

/**
 * A thin bar above the shop showing what is in the basket.
 *
 * It renders nothing until the basket has been read and has something in it,
 * which keeps it out of the way of the finder — the shop's first screen is a
 * question about the visitor's car, not a sales furniture. It also hides
 * itself on the basket page, where it would be a link to the page you are on.
 */
export default function CartBar() {
  const { ready, count, subtotal } = useCart();
  const pathname = usePathname();

  if (!ready || count === 0) return null;
  if (pathname === '/winkel/mandje' || pathname?.startsWith('/winkel/afrekenen')) return null;

  return (
    <div className={styles.bar}>
      <div className={`container ${styles.inner}`}>
        <span className={styles.text}>
          {count} {count === 1 ? 'artikel' : 'artikelen'} in uw mandje ·{' '}
          <strong>{formatPrice(subtotal)}</strong>
        </span>
        <Link href="/winkel/mandje" className={styles.link}>
          Naar het mandje →
        </Link>
      </div>
    </div>
  );
}
