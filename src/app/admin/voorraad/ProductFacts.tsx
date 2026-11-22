'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { ProductProfileData } from '@/lib/productProfiles';
import { usePreviewLanguage } from '../PreviewLanguage';
import styles from './keyforcars.module.css';

const api = '/api/admin/voorraad-local';
const FIRST_FITS = 10;

/**
 * The facts a warehouse hand checks before picking: a large photo, what kind
 * of part it is, chip, frequency, key blade, buttons and the cars it fits.
 * For a housing the chip and blade are the ones it takes, which is what
 * decides whether a customer's old key parts move over.
 *
 * Pass `profile` when the page already has it, or `sku` to load it.
 */
export default function ProductFacts({ profile: given, sku, demo, compact = false }: {
  profile?: ProductProfileData;
  sku?: string;
  demo: boolean;
  compact?: boolean;
}) {
  const { t } = usePreviewLanguage();
  const [loaded, setLoaded] = useState<{ sku: string; profile: ProductProfileData | null } | null>(null);
  const [allFits, setAllFits] = useState(false);

  useEffect(() => {
    if (given || !sku) return;
    const controller = new AbortController();
    fetch(`${api}?profile=${encodeURIComponent(sku)}${demo ? '&demo=1' : ''}`, { signal: controller.signal, cache: 'no-store' })
      .then((response) => (response.ok ? response.json() as Promise<ProductProfileData | null> : null))
      .then((profile) => setLoaded({ sku, profile }))
      .catch(() => { if (!controller.signal.aborted) setLoaded({ sku, profile: null }); });
    return () => controller.abort();
  }, [given, sku, demo]);

  const profile = given ?? (loaded && loaded.sku === sku ? loaded.profile : undefined);
  if (profile === undefined) return sku ? <p className={styles.muted}>{t('Laden…')}</p> : null;
  if (!profile) return <p className={styles.muted}>{t('Geen productprofiel voor deze SKU.')}</p>;

  const { facts } = profile;
  const housing = facts.kind === 'Behuizing';
  const tiles: [string, string][] = [
    [t('Soort'), facts.kind ? t(facts.kind) : '—'],
    [t(housing ? 'Chip (past in)' : 'Chip'), facts.chips.join(', ') || '—'],
    [t(housing ? 'Sleutelbaard (past op)' : 'Sleutelbaard'), facts.blade.join(', ') || '—'],
    [t('Frequentie'), facts.frequency.join(', ') || '—'],
    [t('Knoppen'), facts.buttons || '—'],
  ];
  const fits = allFits ? profile.fits : profile.fits.slice(0, FIRST_FITS);

  return (
    <div className={styles.facts}>
      <div className={styles.factsTop}>
        {profile.imageLarge || profile.image
          ? <a href={profile.imageLarge || profile.image} target="_blank" rel="noreferrer" title={t('Foto groot openen')}>
            <img className={styles.factsPhoto} src={profile.imageLarge || profile.image} alt={profile.name} referrerPolicy="no-referrer" />
          </a>
          : null}
        <div>
          <p className={styles.factsSku}>{profile.sku}</p>
          {profile.ean.length > 0 && <p className={styles.muted}>EAN {profile.ean.join(', ')}</p>}
          <dl className={styles.factTiles}>
            {tiles.map(([name, value]) => <div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}
          </dl>
        </div>
      </div>

      <h3>{t('Past op')} {profile.fits.length > 0 && <small className={styles.muted}>({profile.fits.length})</small>}</h3>
      {profile.fits.length ? (
        <>
          <ul className={styles.fitList}>{fits.map((fit, index) => <li key={index}>{fit.text}</li>)}</ul>
          {profile.fits.length > FIRST_FITS && (
            <button type="button" className={styles.secondary} onClick={() => setAllFits(!allFits)}>
              {allFits ? t('Minder tonen') : `${t('Alle voertuigen tonen')} (${profile.fits.length})`}
            </button>
          )}
        </>
      ) : <p className={styles.muted}>{t('Geen voertuiglijst. Vul aan in Artikelbeheer.')}</p>}

      {compact && <Link className={styles.secondary} href={`/admin/voorraad/p/${encodeURIComponent(profile.sku)}${demo ? '?demo=1' : ''}`}>{t('Volledig productprofiel')}</Link>}
    </div>
  );
}
