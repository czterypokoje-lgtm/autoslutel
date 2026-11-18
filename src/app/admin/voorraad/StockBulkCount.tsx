'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Images, Save, TriangleAlert, X } from 'lucide-react';
import type { StockArticle, StockState } from '@/lib/keyforcarsStock';
import { aggregate, articleIndex, defaultBin, tallyPhoto, type PhotoTally } from '@/lib/stockBulkCount';
import { uuid } from '@/lib/sha256';
import { usePreviewLanguage } from '../PreviewLanguage';
import styles from './keyforcars.module.css';

const api = '/api/admin/voorraad-local';
const MAX_PHOTOS = 200;
const MAX_BYTES = 30 * 1024 * 1024;
const binKey = (shelf: string, box: string) => `${shelf}/${box}`;
const PROBLEM: Record<string, string> = {
  error: 'Niet te lezen',
  empty: 'Geen code gevonden',
  duplicate: 'Dezelfde foto twee keer gekozen',
  'counted-before': 'Al eerder geteld',
};

interface LineEdit { quantity?: number; bin?: string; include?: boolean }

/**
 * Count a shelf from a stack of photos. Codes are read on the device, the
 * office checks the result, and one confirmation books every count at once.
 */
export default function StockBulkCount({ state, articles, demo, onClose, onSaved }: {
  state: StockState;
  articles: StockArticle[];
  demo: boolean;
  onClose: () => void;
  onSaved: (state: StockState, saved: number) => void;
}) {
  const { t, english } = usePreviewLanguage();
  const dialog = useRef<HTMLDialogElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const abort = useRef<AbortController | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [tallies, setTallies] = useState<(PhotoTally | undefined)[]>([]);
  const [scanMs, setScanMs] = useState(0);
  const [phase, setPhase] = useState<'pick' | 'scanning' | 'review' | 'saving'>('pick');
  const [edits, setEdits] = useState<Record<string, LineEdit>>({});
  const [fallback, setFallback] = useState({ shelf: '', box: '' });
  const [notice, setNotice] = useState('');
  const [batchId, setBatchId] = useState('');
  const index = useMemo(() => articleIndex(articles), [articles]);
  const byId = useMemo(() => new Map(articles.map((article) => [article.id, article])), [articles]);
  const countedBefore = useMemo(() => new Set((state.batches ?? []).flatMap((batch) => batch.photos)), [state.batches]);
  const number = new Intl.NumberFormat(english ? 'en-GB' : 'nl-NL', { maximumFractionDigits: 1 });

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => { abort.current?.abort(); element?.close(); };
  }, []);

  const done = tallies.filter(Boolean).length;
  const result = useMemo(() => aggregate(tallies.filter((tally): tally is PhotoTally => Boolean(tally)), countedBefore), [tallies, countedBefore]);
  const problems = result.photos.filter((photo) => photo.status !== 'ok');
  const unknown = result.unknown;
  // Thumbnails only for the photos that need a look, and only once reading is done.
  const problemNames = useMemo(() => phase === 'review'
    ? result.photos.filter((photo) => photo.status !== 'ok').map((photo) => photo.name).join('\n') : '', [phase, result]);
  const thumbs = useMemo(() => {
    const urls: Record<string, string> = {};
    for (const name of problemNames ? problemNames.split('\n') : []) {
      const file = files.find((item) => item.name === name);
      if (file && !urls[name]) urls[name] = URL.createObjectURL(file);
    }
    return urls;
  }, [problemNames, files]);
  useEffect(() => () => Object.values(thumbs).forEach((url) => URL.revokeObjectURL(url)), [thumbs]);

  const lines = result.lines.map((line) => {
    const edit = edits[line.article] ?? {};
    const bins = state.bins.filter((bin) => bin.article === line.article);
    const chosen = edit.bin ?? (defaultBin(line.article, state.bins) ? binKey(defaultBin(line.article, state.bins)!.shelf, defaultBin(line.article, state.bins)!.box) : '');
    const bin = bins.find((item) => binKey(item.shelf, item.box) === chosen);
    const location = bins.length ? bin : (fallback.shelf && fallback.box ? { shelf: fallback.shelf, box: fallback.box, quantity: 0 } : undefined);
    const quantity = edit.quantity ?? line.seen;
    return { ...line, bins, chosen, location, quantity, system: bin?.quantity ?? null, include: edit.include ?? true };
  });
  const included = lines.filter((line) => line.include);
  const missingLocation = included.filter((line) => !line.location).length;

  async function start(selected: File[]) {
    const images = selected.filter((file) => file.type.startsWith('image/') && file.size <= MAX_BYTES).slice(0, MAX_PHOTOS);
    const skipped = selected.length - images.length;
    setNotice(skipped ? `${skipped} ${t('bestanden overgeslagen (geen foto, groter dan 30 MB of meer dan 200).')}` : '');
    if (!images.length) return;
    setFiles(images);
    setTallies(Array(images.length).fill(undefined));
    setEdits({});
    setBatchId(uuid());
    setPhase('scanning');
    const started = performance.now();
    const controller = new AbortController();
    abort.current = controller;
    try {
      const { scanPhotos } = await import('./bulkScanPool');
      await scanPhotos(images, {
        signal: controller.signal,
        onResult: (scan) => {
          const tally = tallyPhoto({ name: scan.file.name, hash: scan.hash, codes: scan.codes, error: scan.error, ms: scan.ms }, index);
          setTallies((current) => { const next = [...current]; next[scan.id] = tally; return next; });
        },
      });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Lezen is gestopt.');
    } finally {
      setScanMs(performance.now() - started);
      if (!controller.signal.aborted) setPhase('review');
    }
  }

  async function save() {
    if (!included.length || missingLocation) return;
    setPhase('saving');
    setNotice('');
    try {
      const response = await fetch(demo ? `${api}?demo=1` : api, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'bulkCount', batchId,
          photos: result.photos.filter((photo) => photo.status === 'ok').map((photo) => photo.hash),
          lines: included.map((line) => ({ article: line.article, shelf: line.location!.shelf, box: line.location!.box, quantity: line.quantity })),
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Opslaan is mislukt.');
      onSaved(body.state, included.length);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Opslaan is mislukt.');
      setPhase('review');
    }
  }

  const edit = (article: string, change: LineEdit) => setEdits((current) => ({ ...current, [article]: { ...current[article], ...change } }));
  const code = (value: string) => value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 24);

  return (
    <dialog ref={dialog} className={styles.bulk} aria-labelledby="bulk-title" onCancel={(event) => { event.preventDefault(); onClose(); }}>
      <div className={styles.listHead}>
        <h2 id="bulk-title">{t('Bulktelling met foto\'s')}</h2>
        <button type="button" className={styles.secondary} aria-label={t('Sluiten')} onClick={onClose}><X size={16} aria-hidden="true" /></button>
      </div>

      {phase === 'pick' && <div className={styles.bulkPick}>
        <p className={styles.muted}>{t('Kies tot 200 foto\'s van schappen of bakken. Elke foto mag meerdere etiketten bevatten. De foto\'s blijven op dit apparaat; alleen de getelde aantallen worden opgeslagen.')}</p>
        <p className={styles.muted}>{t('Elk etiket telt één keer, ook al staan QR en barcode er allebei op. Maak geen overlappende foto\'s van hetzelfde schap.')}</p>
        <input ref={picker} type="file" accept="image/*" multiple hidden onChange={(event) => void start([...(event.target.files ?? [])])} />
        <button type="button" className={styles.primary} onClick={() => picker.current?.click()}><Images size={16} aria-hidden="true" /> {t('Foto\'s kiezen')}</button>
      </div>}

      {phase === 'scanning' && <div className={styles.bulkProgress} role="status">
        <progress max={files.length} value={done} />
        <span>{done} / {files.length} {t('foto\'s gelezen')}</span>
        <button type="button" className={styles.secondary} onClick={() => { abort.current?.abort(); setPhase('review'); }}>{t('Stoppen')}</button>
      </div>}

      {notice && <p className={styles.notice} role="alert">{t(notice)}</p>}

      {(phase === 'review' || phase === 'saving') && <>
        <dl className={styles.reorderStats}>
          <div><dt>{t('Foto\'s gelezen')}</dt><dd>{done}</dd></div>
          <div><dt>{t('Etiketten geteld')}</dt><dd>{result.lines.reduce((sum, line) => sum + line.seen, 0)}</dd></div>
          <div><dt>{t('Artikelen')}</dt><dd>{result.lines.length}</dd></div>
          <div className={problems.length ? styles.statusSoon : ''}><dt>{t('Te controleren')}</dt><dd>{problems.length + unknown.length}</dd></div>
        </dl>
        <small className={styles.muted}>{number.format(scanMs / 1000)} s · {done ? number.format(scanMs / done / 1000) : '—'} s {t('per foto')}</small>

        {(problems.length > 0 || unknown.length > 0) && <details className={styles.fullRanking} open>
          <summary><TriangleAlert size={14} aria-hidden="true" /> {t('Controleer')} ({problems.length + unknown.length})</summary>
          <ul className={styles.bulkProblems}>
            {problems.map((photo) => <li key={`${photo.name}/${photo.status}`}>
              {thumbs[photo.name] && <img src={thumbs[photo.name]} alt="" />}
              <span><strong>{photo.name}</strong><small>{t(PROBLEM[photo.status])}{photo.error ? ` · ${photo.error}` : ''}</small></span>
            </li>)}
            {unknown.map((entry) => <li key={entry.code}><span><strong>{entry.code} · {entry.seen}×</strong><small>{t('Onbekende code: niet in de catalogus, niet geboekt')} · {entry.photos} {t(entry.photos === 1 ? 'foto' : 'foto\'s')}</small></span></li>)}
          </ul>
        </details>}

        {lines.some((line) => !line.bins.length) && <div className={styles.archiveControls}>
          <label>{t('Rallocatie voor nieuwe artikelen')}<input value={fallback.shelf} placeholder="A-03-02" onChange={(event) => setFallback({ ...fallback, shelf: code(event.target.value) })} /></label>
          <label>{t('Bakcode')}<input value={fallback.box} placeholder="B000145" onChange={(event) => setFallback({ ...fallback, box: code(event.target.value) })} /></label>
        </div>}

        {lines.length ? <div className={styles.bulkTableWrap}><table className={styles.bulkTable}>
          <thead><tr><th>{t('Artikel')}</th><th>{t('Gezien')}</th><th>{t('Geteld')}</th><th>{t('Locatie')}</th><th>{t('Systeem')}</th><th>{t('Verschil')}</th><th>{t('Boeken')}</th></tr></thead>
          <tbody>{lines.map((line) => {
            const article = byId.get(line.article);
            const difference = line.system === null ? null : line.quantity - line.system;
            return <tr key={line.article} className={line.include ? '' : styles.bulkExcluded}>
              <td><strong>{article?.name || line.article}</strong><small>{article?.sku || line.article}</small></td>
              <td>{line.seen}<small>{line.photos} {t(line.photos === 1 ? 'foto' : 'foto\'s')}</small></td>
              <td><input type="number" min={0} max={1_000_000} step={1} value={line.quantity} aria-label={`${t('Geteld')} ${article?.sku || line.article}`}
                onChange={(event) => { const value = Number(event.target.value); if (Number.isSafeInteger(value) && value >= 0) edit(line.article, { quantity: value }); }} /></td>
              <td>{line.bins.length > 1
                ? <select value={line.chosen} aria-label={`${t('Locatie')} ${article?.sku || line.article}`} onChange={(event) => edit(line.article, { bin: event.target.value })}>
                    <option value="">{t('Kies…')}</option>
                    {line.bins.map((bin) => <option key={binKey(bin.shelf, bin.box)} value={binKey(bin.shelf, bin.box)}>{bin.shelf} · {bin.box}</option>)}
                  </select>
                : line.location ? `${line.location.shelf} · ${line.location.box}` : <span className={styles.low}>{t('Locatie nodig')}</span>}</td>
              <td>{line.system ?? '—'}</td>
              <td className={difference ? (difference < 0 ? styles.bulkMinus : styles.bulkPlus) : ''}>{difference === null ? t('nieuw') : `${difference > 0 ? '+' : ''}${difference}`}</td>
              <td><input type="checkbox" checked={line.include} aria-label={`${t('Boeken')} ${article?.sku || line.article}`} onChange={(event) => edit(line.article, { include: event.target.checked })} /></td>
            </tr>;
          })}</tbody>
        </table></div> : <p className={styles.muted}>{t('Geen bekende etiketten gevonden.')}</p>}

        <div className={styles.bookingFooter}>
          {missingLocation > 0 && <span className={styles.low}>{missingLocation} {t('regels zonder locatie')}</span>}
          <button type="button" className={styles.secondary} onClick={() => { setPhase('pick'); setTallies([]); setFiles([]); }}>{t('Opnieuw')}</button>
          <button type="button" className={styles.primary} disabled={!included.length || missingLocation > 0 || phase === 'saving'} onClick={() => void save()}>
            <Save size={16} aria-hidden="true" /> {t('Telling opslaan')} ({included.length})
          </button>
        </div>
      </>}
    </dialog>
  );
}
