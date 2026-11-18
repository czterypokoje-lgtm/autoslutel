'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { StockState } from '@/lib/keyforcarsStock';
import type { ProductProfileData } from '@/lib/productProfiles';
import { usePreviewLanguage } from '../PreviewLanguage';
import ProductFacts from './ProductFacts';
import styles from './keyforcars.module.css';

const api = '/api/admin/voorraad-local';
const WHEN = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Amsterdam' });

/**
 * Everything a warehouse hand needs after scanning a drawer: which product,
 * where it lies, how many, and which cars it fits. Stock comes from the local
 * stock record by article id; the rest is the profile built from the shops.
 */
export default function ProductProfile({ profile, articles, demo }: { profile: ProductProfileData; articles: string[]; demo: boolean }) {
  const { t } = usePreviewLanguage();
  const [stock, setStock] = useState<StockState | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(demo ? `${api}?demo=1` : api, { signal: controller.signal, cache: 'no-store' })
      .then((response) => (response.ok ? response.json() as Promise<StockState> : Promise.reject(new Error(String(response.status)))))
      .then(setStock)
      .catch((error: unknown) => { if (!controller.signal.aborted) { console.error(error); setFailed(true); } });
    return () => controller.abort();
  }, [demo]);

  const ids = new Set(articles);
  const bins = stock?.bins.filter((bin) => ids.has(bin.article)) ?? [];
  const lastMove = stock?.moves.find((move) => ids.has(move.article));
  const lastSale = stock?.moves.find((move) => ids.has(move.article) && move.operation === 'sale');
  const total = bins.reduce((sum, bin) => sum + bin.quantity, 0);

  return (
    <article className={styles.profile}>
      <Link className={styles.secondary} href={`/admin/voorraad${demo ? '?demo=1' : ''}`}><ArrowLeft size={15} /> {t('Voorraad')}</Link>

      <header className={styles.profileHead}>
        <span>
          <h1>{profile.nameNl || profile.name}</h1>
          {profile.nameNl && <p className={styles.muted}>{profile.name}</p>}
        </span>
      </header>

      <section className={styles.panel} aria-label={t('Productinformatie')}>
        <ProductFacts profile={profile} demo={demo} />
      </section>

      <section className={styles.panel} aria-label={t('Voorraad op locatie')}>
        <h2>{t('Voorraad op locatie')}</h2>
        {failed ? <p className={styles.muted}>{t('Voorraad kon niet geladen worden.')}</p>
          : !stock ? <p className={styles.muted}>{t('Laden…')}</p>
          : !articles.length ? <p className={styles.muted}>{t('Dit product staat nog niet in de voorraadlijst.')}</p>
          : !bins.length ? <p className={styles.muted}>{t('Nog niet geteld')}</p>
          : (
            <ul className={styles.locations}>
              {bins.map((bin) => (
                <li key={`${bin.article}-${bin.shelf}-${bin.box}`}>
                  <strong>{bin.shelf} · {bin.box}</strong>
                  <span>{bin.quantity} {t('st.')}</span>
                  {bin.minimum > 0 && bin.quantity <= bin.minimum && <span className={styles.low}>{t('Lage voorraad')}</span>}
                </li>
              ))}
              <li><strong>{t('Totaal')}</strong><span>{total} {t('st.')}</span></li>
            </ul>
          )}
        {stock && articles.length > 0 && (
          <p className={styles.muted}>
            {t('Laatst verkocht')}: {lastSale ? WHEN.format(new Date(lastSale.time)) : '—'}
            {' · '}{t('Laatste boeking')}: {lastMove ? WHEN.format(new Date(lastMove.time)) : '—'}
          </p>
        )}
      </section>

      {profile.specs.length > 0 && (
        <section className={styles.panel} aria-label={t('Alle kenmerken')}>
          <h2>{t('Alle kenmerken')}</h2>
          <dl className={styles.specs}>
            {profile.specs.map(([name, value]) => <div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}
          </dl>
        </section>
      )}

      <section className={styles.panel} aria-label={t('In de webshops')}>
        <h2>{t('In de webshops')}</h2>
        <p className={styles.sources}>
          {profile.links.map((link) => <a key={link.shop} href={link.url} target="_blank" rel="noreferrer">{link.shop}</a>)}
        </p>
      </section>
    </article>
  );
}
