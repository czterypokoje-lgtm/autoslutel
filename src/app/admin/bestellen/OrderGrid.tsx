'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Check } from 'lucide-react';
import { ui } from '../_ui';
import styles from './bestellen.module.css';

export interface ShopProduct {
  slug: string;
  title: string;
  category: string | null;
  subcategory: string | null;
  articleCode: string | null;
  image: string | null;
  costPrice: number | null;
  shelf: number | null;
  frequency: string | null;
  chip: string | null;
  buttons: number | null;
  fits: string[];
  fitsMore: number;
  makes: string[];
}

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

const CATEGORY_LABEL: Record<string, string> = {
  'woningsleutels': 'Woningsleutels',
  'behuizingen': 'Behuizingen',
  'sleutels-zonder-chip': 'Zonder chip',
  'accessoires': 'Accessoires',
  'afstandsbedieningen': 'Afstandsbedieningen',
  'frezen-en-tasters': 'Frezen & tasters',
  'universal-remotes': 'Universeel',
  'transpondersleutels': 'Transpondersleutels',
  'sleutelbaarden': 'Sleutelbaarden',
  'batterijen': 'Batterijen',
  'sloten': 'Sloten',
  'smart-keys': 'Smart keys',
};

/**
 * The catalogue as cards, and one button per card.
 *
 * A photo, the article number, what it fits and what it costs — those four
 * are what a monteur checks before asking for a part, and a card that hides
 * any of them sends them back to a phone call. No basket: parts are asked for
 * one at a time, usually while standing next to the car that needs one.
 */
export default function OrderGrid({
  products,
  total,
  page,
  pages,
  q,
  cat,
  merk,
  categories,
  makes,
  canOrder,
}: {
  products: ShopProduct[];
  total: number;
  page: number;
  pages: number;
  q: string;
  cat: string;
  merk: string;
  categories: [string, number][];
  makes: [string, number][];
  canOrder: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(q);
  const [busy, setBusy] = useState<string | null>(null);
  const [done, setDone] = useState<Record<string, number>>({});
  const [error, setError] = useState('');

  const go = (next: Partial<{ q: string; cat: string; merk: string; p: string }>) => {
    const values = { q: search, cat, merk, p: '1', ...next };
    const params = new URLSearchParams();
    if (values.q) params.set('q', values.q);
    if (values.cat) params.set('cat', values.cat);
    if (values.merk) params.set('merk', values.merk);
    if (values.p && values.p !== '1') params.set('p', values.p);
    router.push(`/admin/bestellen${params.toString() ? `?${params}` : ''}`);
  };

  async function order(product: ShopProduct) {
    setBusy(product.slug);
    setError('');

    const response = await fetch('/api/admin/part-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_slug: product.slug,
        description: product.title,
        article_code: product.articleCode,
        unit_cost: product.costPrice,
        quantity: 1,
      }),
    }).catch(() => null);

    const result = await response?.json().catch(() => null);
    if (!response?.ok) {
      setError(result?.error ?? 'Aanvragen mislukt.');
      setBusy(null);
      return;
    }

    /* Counts up rather than flipping to "besteld": asking for a second one is
       a normal thing to do and the card should say how many. */
    setDone((prev) => ({ ...prev, [product.slug]: (prev[product.slug] ?? 0) + 1 }));
    setBusy(null);
  }

  return (
    <>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          go({ q: search });
        }}
        className={styles.bar}
      >
        <input
          type="search"
          className={ui.input}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Zoek op artikelnummer, merk of model — bijv. 1012AB, Golf, Peugeot 107"
          style={{ flex: '1 1 260px' }}
        />
        <button type="submit" className={`${ui.btn} ${ui.btnPrimary}`}>
          <Search size={16} /> Zoek
        </button>
        {(q || cat || merk) && (
          <button
            type="button"
            className={ui.btn}
            onClick={() => {
              setSearch('');
              router.push('/admin/bestellen');
            }}
          >
            <X size={16} /> Wis
          </button>
        )}
      </form>

      <div className={styles.chips}>
        {categories.map(([value, count]) => (
          <button
            key={value}
            className={`${styles.chip} ${cat === value ? styles.chipOn : ''}`}
            onClick={() => go({ cat: cat === value ? '' : value })}
          >
            {CATEGORY_LABEL[value] ?? value} <span className={styles.chipCount}>{count}</span>
          </button>
        ))}
      </div>

      {makes.length > 1 && (
        <div className={styles.chips}>
          {makes.map(([value, count]) => (
            <button
              key={value}
              className={`${styles.chip} ${merk === value ? styles.chipOn : ''}`}
              onClick={() => go({ merk: merk === value ? '' : value })}
            >
              {value} <span className={styles.chipCount}>{count}</span>
            </button>
          ))}
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}

      <p className={styles.count}>
        {total.toLocaleString('nl-NL')} artikel{total === 1 ? '' : 'en'}
        {pages > 1 ? ` · pagina ${page} van ${pages}` : ''}
      </p>

      <div className={styles.grid}>
        {products.map((product) => (
          <div key={product.slug} className={styles.card}>
            {product.image ? (
              /* eslint-disable-next-line @next/next/no-img-element -- catalogue
                 images are remote and already sized, and next/image would add
                 a loader round trip per card for no gain on a grid of 48. */
              <img className={styles.photo} src={product.image} alt={product.title} loading="lazy" />
            ) : (
              <div className={styles.photoEmpty}>geen foto</div>
            )}

            <div className={styles.body}>
              <div className={styles.title}>{product.title}</div>

              {product.articleCode && <div className={styles.code}>{product.articleCode}</div>}

              <div className={styles.specs}>
                {product.frequency && <span>{product.frequency}</span>}
                {product.chip && <span>chip {product.chip}</span>}
                {product.buttons ? <span>{product.buttons} knoppen</span> : null}
              </div>

              {product.fits.length > 0 ? (
                <div className={styles.fits} title={product.fits.join('\n')}>
                  {product.fits.slice(0, 3).join(' · ')}
                  {product.fitsMore > 0 ? ` +${product.fitsMore} meer` : ''}
                </div>
              ) : product.makes.length ? (
                <div className={styles.fits}>{product.makes.join(' · ')}</div>
              ) : null}

              <div className={styles.foot}>
                <span className={styles.price}>
                  {product.costPrice != null ? MONEY.format(product.costPrice) : '—'}
                </span>

                {canOrder ? (
                  <button
                    className={`${ui.btn} ${done[product.slug] ? '' : ui.btnPrimary}`}
                    onClick={() => order(product)}
                    disabled={busy === product.slug}
                  >
                    {busy === product.slug ? '…' : done[product.slug] ? (
                      <>
                        <Check size={14} /> {done[product.slug]}× gevraagd
                      </>
                    ) : (
                      'Vraag aan'
                    )}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>

      {pages > 1 && (
        <div className={styles.pager}>
          <button className={ui.btn} disabled={page <= 1} onClick={() => go({ p: String(page - 1) })}>
            ← Vorige
          </button>
          <span className={styles.count}>
            {page} / {pages}
          </span>
          <button className={ui.btn} disabled={page >= pages} onClick={() => go({ p: String(page + 1) })}>
            Volgende →
          </button>
        </div>
      )}
    </>
  );
}
