import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/lib/catalog';
import { fitClass, FIT_LABEL } from '@/lib/finder';
import type { ShopProduct } from '@/lib/shopCatalog';
import styles from './winkel.module.css';

/**
 * One article in the grid.
 *
 * A server component with no interactivity on purpose: a grid of 48 cards
 * each shipping a click handler is a slow page on the 4G connection this
 * shop is actually browsed on. Adding to the basket happens on the product
 * page, where there is a quantity and a fitment warning to read first.
 */

const BADGE_CLASS: Record<string, string> = {
  'plug-and-play': styles.badgeSelf,
  cutting: styles.badgeCutting,
  programming: styles.badgeProgramming,
  trade: styles.badgeProgramming,
};

export default function ProductCard({
  product,
  /** True when the supplier names the visitor's exact model for this article. */
  exact = false,
}: {
  product: ShopProduct;
  exact?: boolean;
}) {
  const fit = fitClass(product);
  const title = product.titleNl || product.title;

  /*
   * The subtitle answers "will this fit?" with whatever the supplier actually
   * gave us, in descending order of usefulness: the makes they name, then the
   * blade profile, then the button count. Never a guess.
   */
  const meta =
    product.makes?.length
      ? product.makes.slice(0, 3).join(' · ') +
        (product.makes.length > 3 ? ` +${product.makes.length - 3}` : '')
      : product.blade
        ? `Baard ${product.blade}`
        : product.buttons
          ? `${product.buttons} knoppen`
          : '';

  return (
    <Link href={`/winkel/artikel/${product.slug}`} className={styles.card}>
      <div className={styles.cardPhoto}>
        {product.image ? (
          <Image
            src={product.image}
            alt={title}
            fill
            sizes="(max-width: 480px) 45vw, (max-width: 900px) 30vw, 210px"
            quality={70}
          />
        ) : (
          <span className={styles.cardNoPhoto}>Geen foto</span>
        )}
      </div>

      <div className={styles.cardBody}>
        {exact ? (
          <span className={`${styles.badge} ${styles.badgeExact}`}>Past op uw model</span>
        ) : (
          <span className={`${styles.badge} ${BADGE_CLASS[fit]}`}>{FIT_LABEL[fit]}</span>
        )}

        <p className={styles.cardTitle}>{title}</p>
        {meta ? <p className={styles.cardMeta}>{meta}</p> : null}

        <div className={styles.cardFoot}>
          {/*
            A key that has to be programmed is priced but not sold as a parcel,
            so its card says "vanaf" — the final number depends on the visit,
            and quote.ts refuses to guess when a make's keys spread too far.
          */}
          {product.price == null ? (
            <span className={styles.cardPriceAsk}>Prijs op aanvraag</span>
          ) : (
            <span className={styles.cardPrice}>
              {fit === 'programming' ? 'vanaf ' : ''}
              {formatPrice(product.price)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
