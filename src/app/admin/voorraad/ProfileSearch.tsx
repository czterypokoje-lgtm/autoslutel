'use client';

import Link from 'next/link';
import { ScanLine } from 'lucide-react';
import { usePreviewLanguage } from '../PreviewLanguage';
import styles from './keyforcars.module.css';

export interface SearchHit {
  sku: string;
  name: string;
  nameNl: string;
  image: string;
  fits: string[];
}

/**
 * One box for a handheld scanner and for typing. A USB or Bluetooth scanner
 * types the code and presses Enter, so the box keeps focus and submits a
 * plain GET: the next scan works without touching the screen.
 */
export default function ProfileSearch({ query, hits, demo, total }: { query: string; hits?: SearchHit[]; demo: boolean; total?: number }) {
  const { t } = usePreviewLanguage();
  const suffix = demo ? '?demo=1' : '';
  return (
    <section className={styles.panel} aria-label={t('Productprofiel zoeken')}>
      <form className={styles.search} action="/admin/voorraad/p" method="get" role="search">
        <ScanLine size={18} aria-hidden="true" />
        <input name="q" defaultValue={query} autoFocus autoComplete="off" enterKeyHint="search"
          aria-label={t('Scan of zoek: code, EAN, naam of auto en bouwjaar')}
          placeholder={t('Scan of zoek: code, EAN, naam of auto en bouwjaar')} />
        {demo && <input type="hidden" name="demo" value="1" />}
        <button className={styles.primary} type="submit">{t('Zoeken')}</button>
      </form>
      {hits && (hits.length ? (
        <ul className={styles.list}>
          {hits.map((hit) => (
            <li key={hit.sku}>
              <Link className={styles.article} href={`/admin/voorraad/p/${encodeURIComponent(hit.sku)}${suffix}`}>
                {hit.image ? <img src={hit.image} alt="" loading="lazy" /> : <ScanLine size={40} aria-hidden="true" />}
                <span>
                  <strong>{hit.sku} · {hit.nameNl || hit.name}</strong>
                  <small>{hit.fits.length ? hit.fits.join(' · ') : hit.name}</small>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : <p className={styles.muted}>{t('Niets gevonden.')} {query}</p>)}
      {!hits && total !== undefined && <p className={styles.muted}>{total} {t('productprofielen')}</p>}
    </section>
  );
}
