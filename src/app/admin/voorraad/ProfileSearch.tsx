'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRef, useState } from 'react';
import { ScanLine } from 'lucide-react';
import { usePreviewLanguage } from '../PreviewLanguage';
import styles from './keyforcars.module.css';
import { normaliseCode } from '@/lib/stockBulkCount';

const StockCamera = dynamic(() => import('./StockCamera'));

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
  const { english, t } = usePreviewLanguage();
  const input = useRef<HTMLInputElement>(null);
  const [camera, setCamera] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [codes, setCodes] = useState<string[]>([]);
  const [scanError, setScanError] = useState(false);
  const suffix = demo ? '?demo=1' : '';

  function searchCode(code: string) {
    if (!input.current) return;
    input.current.value = code;
    input.current.form?.requestSubmit();
  }

  async function scan(file: File) {
    setCamera(false);
    setScanning(true);
    setScanError(false);
    setCodes([]);
    try {
      const { scanPhotos } = await import('./bulkScanPool');
      await scanPhotos([file], { onResult: result => {
        const found = [...new Set(result.codes.map(code => normaliseCode(code.text)).filter(code => /^[A-Z0-9][A-Z0-9._ /-]{0,79}$/.test(code)))];
        if (found.length === 1) searchCode(found[0]);
        else if (found.length > 1) setCodes(found);
        else setScanError(true);
      } });
    } catch {
      setScanError(true);
    } finally {
      setScanning(false);
    }
  }
  return (
    <section className={styles.panel} aria-label={t('Productprofiel zoeken')}>
      <h1>{t('Productzoeker')}</h1>
      <p className={styles.muted}>{english ? 'Search by SKU, EAN, or vehicle. You can also scan a label with your camera, choose a photo, or use a handheld scanner.' : 'Zoek op SKU, EAN of voertuig. Je kunt ook een etiket scannen met je camera, een foto kiezen of een handscanner gebruiken.'}</p>
      <form className={styles.search} action="/admin/voorraad/p" method="get" role="search">
        <input ref={input} name="q" defaultValue={query} autoComplete="off" enterKeyHint="search"
          aria-label={t('Scan of zoek: code, EAN, naam of auto en bouwjaar')}
          placeholder={t('Scan of zoek: code, EAN, naam of auto en bouwjaar')} />
        {demo && <input type="hidden" name="demo" value="1" />}
        <button className={styles.primary} type="submit">{t('Zoeken')}</button>
        <button className={styles.secondary} type="button" disabled={scanning} onClick={() => setCamera(true)}><ScanLine size={16} aria-hidden="true" />{english ? 'Scan label' : 'Etiket scannen'}</button>
      </form>
      {camera && <StockCamera onClose={() => setCamera(false)} onPhoto={file => void scan(file)} />}
      {scanning && <p role="status">{t('Code lezen…')}</p>}
      {scanError && <p role="alert">{english ? 'No usable code found. Try a sharper photo or enter the code above.' : 'Geen bruikbare code gevonden. Probeer een scherpere foto of voer de code hierboven in.'}</p>}
      {codes.length > 0 && <div className={styles.labelActions}>
        <span>{english ? 'Select a code' : 'Kies een code'}</span>
        {codes.map(code => <button type="button" className={styles.secondary} key={code} onClick={() => searchCode(code)}>{code}</button>)}
      </div>}
      {!query && <button type="button" className={styles.secondary} onClick={() => searchCode('ALRK03')}>{english ? 'Try an example: ALRK03' : 'Probeer een voorbeeld: ALRK03'}</button>}
      {hits && (hits.length ? (
        <ul className={styles.list}>
          {hits.map((hit) => (
            <li key={hit.sku}>
              <Link className={styles.article} href={`/admin/voorraad/p/${encodeURIComponent(hit.sku)}${suffix}`}>
                {hit.image ? <img src={hit.image} alt="" loading="lazy" /> : <ScanLine size={40} aria-hidden="true" />}
                <span>
                  <strong>{hit.sku} · {english ? hit.name : hit.nameNl || hit.name}</strong>
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
