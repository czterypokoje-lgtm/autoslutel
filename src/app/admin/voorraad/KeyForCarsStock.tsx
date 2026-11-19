'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type FormEvent } from 'react';
import type { ProductProfileData } from '@/lib/productProfiles';
import ShelfLabel, { LABEL_SIZES, type LabelSize } from './ShelfLabel';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import { Barcode, Camera, ChevronLeft, ChevronRight, ClipboardList, Images, Package, Plus, Printer, Save, ScanLine, X } from 'lucide-react';
import { EMPTY_STOCK, STOCK_OPERATIONS, stockChange, type StockArticle, type StockBin, type StockMove } from '@/lib/keyforcarsStock';
import { labelCode } from './StockLabel';
import ProductFacts from './ProductFacts';
import { inventoryCategory } from './inventoryCategories';
import { inventoryHref, inventoryViews, type InventoryView } from './inventoryViews';
import { articleIndex, trustedUnknownCode } from '@/lib/stockBulkCount';
import { usePreviewLanguage } from '../PreviewLanguage';
import styles from './keyforcars.module.css';
import StockHelp from './StockHelp';
import './stockPrint.css';

const api = '/api/admin/voorraad-local';
const StockReports = dynamic(() => import('./StockReports'));
const StockReorder = dynamic(() => import('./StockReorder'));
const StockBulkCount = dynamic(() => import('./StockBulkCount'));
const StockCamera = dynamic(() => import('./StockCamera'));
const pageSize = 12;
type Operation = keyof typeof STOCK_OPERATIONS;

function stockCode(value: string) {
  // Labels printed before the Code 39 correction encoded HFC instead of KFC.
  return value.trim().toUpperCase().replace(/^H(?=FC-[123]-\d+$)/, 'K');
}

async function jpegAttachment(file: File) {
  const image = await createImageBitmap(file);
  const scale = Math.min(1, 650 / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext('2d')!;
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  image.close();
  return canvas.toDataURL('image/jpeg', .73).split(',')[1];
}

/** The label size is a per-printer choice, so it is remembered per browser. */
const LABEL_SIZE_KEY = 'keyforcars-label-size';
function subscribeLabelSize(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(LABEL_SIZE_KEY, callback);
  return () => { window.removeEventListener('storage', callback); window.removeEventListener(LABEL_SIZE_KEY, callback); };
}
function readLabelSize(): LabelSize {
  try {
    const value = localStorage.getItem(LABEL_SIZE_KEY);
    return value && value in LABEL_SIZES ? value as LabelSize : '100x50';
  } catch { return '100x50'; }
}
function saveLabelSize(size: LabelSize) {
  try { localStorage.setItem(LABEL_SIZE_KEY, size); } catch { /* private mode: the choice lasts this page only */ }
  window.dispatchEvent(new Event(LABEL_SIZE_KEY));
}

export default function KeyForCarsStock({ initialCatalog, demo, view, canLinkInvoice }: { initialCatalog: StockArticle[]; demo: boolean; view: InventoryView; canLinkInvoice: boolean }) {
  const { t, english } = usePreviewLanguage();
  const [state, setState] = useState(EMPTY_STOCK);
  /** Physical · unusable · reserved · available · incoming per article (ledger install only). */
  const [positions, setPositions] = useState<Record<string, { physical: number; unusable: number; reserved: number; available: number; incoming: number }>>({});
  const [stockReady, setStockReady] = useState(false);
  const [fullCatalog, setFullCatalog] = useState<StockArticle[]>();
  const [catalogFailed, setCatalogFailed] = useState(false);
  const [catalogAttempt, setCatalogAttempt] = useState(0);
  const catalog = fullCatalog ?? initialCatalog;
  const ready = stockReady && !!fullCatalog;
  const compactCatalog = view === 'journal' || view === 'reports';
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<StockArticle>(catalog[0]);
  const [marked, setMarked] = useState<string[]>([]);
  const [printLabels, setPrintLabels] = useState<{ article: StockArticle; bin?: StockBin }[]>([]);
  const [printJob, setPrintJob] = useState<{ labels: { article: StockArticle; bin?: StockBin }[]; profiles: Record<string, ProductProfileData | null> } | null>(null);
  const [loadedProfile, setLoadedProfile] = useState<{ sku: string; profile: ProductProfileData | null } | null>(null);
  const labelSize = useSyncExternalStore(subscribeLabelSize, readLabelSize, () => '100x50' as LabelSize);
  const [operation, setOperation] = useState<Operation>('count');
  const [location, setLocation] = useState<StockBin>();
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [movementPhoto, setMovementPhoto] = useState<File>();
  const [lastMovement, setLastMovement] = useState<{ move: StockMove; article: StockArticle; file?: File }>();
  const [scanStatus, setScanStatus] = useState('');
  const [scanReview, setScanReview] = useState(false);
  const search = useRef<HTMLInputElement>(null);
  const details = useRef<HTMLElement>(null);
  const movementForm = useRef<HTMLFormElement>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const [camera, setCamera] = useState<'scan' | 'evidence'>();
  const [bulk, setBulk] = useState(false);
  const pending = useRef<{ key: string; id: string } | null>(null);

  useEffect(() => {
    if (compactCatalog) return;
    const controller = new AbortController();
    fetch(`${api}?catalog=1`, { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error();
        return response.json() as Promise<StockArticle[]>;
      })
      .then(items => { if (!controller.signal.aborted) setFullCatalog(items); })
      .catch(() => { if (!controller.signal.aborted) setCatalogFailed(true); });
    return () => controller.abort();
  }, [catalogAttempt, compactCatalog]);

  useEffect(() => {
    if (submitting) return;
    const controller = new AbortController();
    let fetching = false;
    async function refresh() {
      if (fetching) return;
      fetching = true;
      try {
        const query = new URLSearchParams();
        if (demo) query.set('demo', '1');
        else query.set('positions', '1');
        if (compactCatalog) query.set('movementCatalog', '1');
        const response = await fetch(`${api}?${query}`, { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) throw new Error();
        const stock = await response.json();
        if (!controller.signal.aborted) {
          setState(stock.state ?? stock);
          if (Array.isArray(stock.positions)) {
            setPositions(Object.fromEntries(stock.positions.map((row: { article_code: string }) => [row.article_code, row])));
          }
          if (compactCatalog) {
            setFullCatalog(stock.catalog);
            setCatalogFailed(false);
          }
          setStockReady(true);
        }
      } catch {
        if (!controller.signal.aborted) {
          if (compactCatalog) setCatalogFailed(true);
          else setNotice('De lokale voorraad kon niet worden geladen.');
        }
      } finally { fetching = false; }
    }
    void refresh();
    const timer = demo ? window.setInterval(() => {
      if (!document.hidden) void refresh();
    }, 3000) : undefined;
    return () => { controller.abort(); window.clearInterval(timer); };
  }, [demo, submitting, compactCatalog, catalogAttempt]);

  // The selected article's profile feeds the label preview and the product facts.
  useEffect(() => {
    if (view !== 'products') return;
    const sku = selected.sku.trim().toUpperCase();
    if (!sku) return;
    const controller = new AbortController();
    fetch(`${api}?profile=${encodeURIComponent(sku)}${demo ? '&demo=1' : ''}`, { signal: controller.signal, cache: 'no-store' })
      .then((response) => (response.ok ? response.json() as Promise<ProductProfileData | null> : null))
      .then((profile) => setLoadedProfile({ sku, profile }))
      .catch(() => { if (!controller.signal.aborted) setLoadedProfile({ sku, profile: null }); });
    return () => controller.abort();
  }, [selected.sku, demo, view]);

  // Step 1 of a print run: load the profiles (photo, chip, blade, cars) for every label.
  useEffect(() => {
    if (!printLabels.length) return;
    let cancelled = false;
    const skus = [...new Set(printLabels.map(({ article }) => article.sku.trim().toUpperCase()).filter(Boolean))];
    const load = skus.length
      ? fetch(`${api}?profiles=${encodeURIComponent(skus.join(','))}${demo ? '&demo=1' : ''}`, { cache: 'no-store' })
        .then((response) => (response.ok ? response.json() as Promise<Record<string, ProductProfileData | null>> : {}))
        .catch(() => ({}))
      : Promise.resolve({});
    void load.then((profiles) => { if (!cancelled) setPrintJob({ labels: printLabels, profiles }); });
    return () => { cancelled = true; };
  }, [printLabels, demo]);

  // Step 2: once the labels are on the page and their photos decoded, print.
  useEffect(() => {
    if (!printJob) return;
    let cancelled = false;
    async function print() {
      // Wait until every label photo has really loaded (or failed), at most 6 seconds, so it is on the paper.
      await Promise.all(Array.from(document.querySelectorAll<HTMLImageElement>('[data-stock-print] img'), (image) => (
        image.complete && image.naturalWidth > 0 ? image.decode().catch(() => undefined) : new Promise<void>((resolve) => {
          image.addEventListener('load', () => resolve(), { once: true });
          image.addEventListener('error', () => resolve(), { once: true });
          window.setTimeout(resolve, 6000);
        }))));
      if (!cancelled) { window.print(); setPrintJob(null); setPrintLabels([]); }
    }
    void print();
    return () => { cancelled = true; };
  }, [printJob]);

  const { articles, byId, categories, categoryByArticle, codeIndex } = useMemo(() => {
    const articles = [...state.workshop, ...catalog].map(article => {
      const version = state.photos[article.id];
      return version ? { ...article, image: `${api}?foto=${article.id}&v=${version}` } : article;
    });
    const categories = new Map<string, { label: string; count: number }>();
    const categoryByArticle = new Map(articles.map(article => {
      const [id, label] = inventoryCategory(article);
      categories.set(id, { label, count: (categories.get(id)?.count ?? 0) + 1 });
      return [article.id, id];
    }));
    return { articles, categories, categoryByArticle, codeIndex: articleIndex(articles), byId: new Map(articles.map(article => [article.id, article])) };
  }, [catalog, state.photos, state.workshop]);
  // A SKU printed on a label must lead back to exactly one card, the same rule the counts use.
  const codeFor = (article: StockArticle) => labelCode(article, (sku) => codeIndex.get(sku) === article.id);
  const displayedArticle = byId.get(selected.id) ?? selected;
  const needle = query.trim().toLowerCase();
  const matchingBins = needle && new Set(state.bins
    .filter(bin => `${bin.shelf} ${bin.box}`.toLowerCase().includes(needle))
    .map(bin => bin.article));
  const filtered = articles.filter((article) => {
    const group = categoryByArticle.get(article.id)!;
    const categoryLabel = categories.get(group)!.label;
    return (!category || category === group) && (
      `${article.id} ${article.name} ${article.sku} ${article.category} ${categoryLabel} ${t(categoryLabel)}`.toLowerCase().includes(needle) ||
      (matchingBins && matchingBins.has(article.id))
    );
  });
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const bins = state.bins.filter((bin) => bin.article === selected.id);
  const locationRequired = bins.length > 0 || operation === 'count' || operation === 'transfer';
  const currentBin = bins.find((bin) => bin.shelf === location?.shelf && bin.box === location?.box);
  const selectedSku = selected.sku.trim().toUpperCase();
  // undefined while loading, null when the shops have no profile for this SKU.
  const selectedProfile = loadedProfile && loadedProfile.sku === selectedSku ? loadedProfile.profile : selectedSku ? undefined : null;
  const moves = state.moves.filter((move) => move.article === selected.id).slice(0, 30);

  function select(article: StockArticle, scroll = true) {
    setScanReview(false);
    setSelected(article);
    setLocation(state.bins.find((bin) => bin.article === article.id));
    setOperation('count');
    if (scroll) details.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  async function scanPhoto(file: File | undefined) {
    if (!file) return;
    setMovementPhoto(file);
    setScanReview(true);
    setScanStatus('Code lezen…');
    try {
      // Same on-device decoder as the bulk count: reads every code in a full-size phone photo.
      const { scanPhotos } = await import('./bulkScanPool');
      const matching = (code: string) => articles.filter((article) => [article.id, article.sku].some((value) => value.toUpperCase() === code));
      let codes: string[] = [];
      let failure = '';
      await scanPhotos([file], { onResult: (result) => {
        failure = result.error ?? '';
        // Catalogue codes are always kept; anything else only when it cannot be a misread (see stockBulkCount).
        codes = [...new Set(result.codes.map((item) => ({ item, code: stockCode(item.text) }))
          .filter(({ item, code }) => matching(code).length > 0 || trustedUnknownCode(item, code)).map(({ code }) => code))];
      } });
      if (failure) throw new Error(failure);
      if (!codes.length) throw new Error('no code');
      const code = codes.find((item) => matching(item).length === 1) ?? codes[0];
      const matches = matching(code);
      setCategory('');
      setQuery(code);
      setPage(0);
      if (matches.length === 1) {
        select(matches[0]);
        setScanStatus(`Gescand: ${matches[0].sku || matches[0].id}`);
      } else {
        const read = codes.length > 1 ? `${codes.length} codes gelezen: ${codes.join(', ')}` : `Code gelezen: ${code}`;
        setScanStatus(`${read}. Niet in de catalogus: zoek of kies het artikel voordat je boekt.`);
      }
    } catch (error) {
      const failure = error instanceof Error && error.message !== 'no code' ? `${error.message} ` : '';
      // A label with a wrong EAN check digit is refused by every reader; the product code printed above it still works.
      setScanStatus(`${failure}Geen leesbare code. Typ de productcode die op het etiket staat (bijv. KIRK24) in het zoekveld. Leest een etiket nooit? Druk een nieuw etiket af.`);
      search.current?.focus();
    }
  }

  function shareMovement({ move, article, file }: NonNullable<typeof lastMovement>) {
    const text = `KeyForCars · ${t(STOCK_OPERATIONS[move.operation as Operation])}\n${article.name} (${article.sku || article.id})\nAantal: ${Math.abs(move.delta)}${move.shelf ? `\nLocatie: ${move.shelf} / ${move.box}` : ''}${move.note ? `\n${move.note}` : ''}\nReferentie: ${move.id}`;
    if (file && navigator.canShare?.({ files: [file] })) {
      void navigator.share({ text, files: [file] }).catch((error) => {
        if (error.name !== 'AbortError') setNotice('Delen mislukt. Gebruik de WhatsApp-tekst en voeg de foto handmatig toe.');
      });
      return;
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  }

  async function uploadPhoto(file: File | undefined) {
    if (!file || !ready || submitting) return;
    setSubmitting(true);
    setNotice('');
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 500 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext('2d')!;
      context.fillStyle = '#fff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      const photo = canvas.toDataURL('image/jpeg', .75).split(',')[1];
      const response = await fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation: 'photo', article: selected.id, photo }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Foto opslaan is mislukt.');
      setState(result.state);
      setNotice('Etiketfoto opgeslagen.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Foto opslaan is mislukt.');
    } finally {
      if (photoInput.current) photoInput.current.value = '';
      setSubmitting(false);
    }
  }

  async function save(event: FormEvent<HTMLFormElement>, newArticle = false) {
    event.preventDefault();
    if (submitting || !ready || (!newArticle && scanReview)) return;
    const data = new FormData(event.currentTarget);
    const code = (name: string) => String(data.get(name) ?? '').trim().toUpperCase();
    const amount = String(data.get('amount') ?? '').trim();
    const [euros, cents = ''] = amount.split(/[.,]/);
    const amountCents = amount ? Number(euros) * 100 + Number(cents.padEnd(2, '0')) : undefined;
    const invoiceReference = String(data.get('invoice') ?? '').trim();
    const invoiceId = (invoiceReference.match(/\/admin\/facturen\/([a-f0-9-]+)\/?(?:[?#].*)?$/i)?.[1] ?? invoiceReference) || undefined;
    const file = movementPhoto;
    const input = newArticle
      ? { operation: 'new', name: data.get('name'), sku: data.get('sku') }
      : { operation, article: selected.id, shelf: code('shelf'), box: code('box'), quantity: Number(data.get('quantity')),
          minimum: Number(data.get('minimum') ?? 0), destinationShelf: code('destinationShelf'), destinationBox: code('destinationBox'), note: data.get('note'), amountCents, invoiceId };
    setSubmitting(true);
    setNotice('');
    try {
      let payload: object = input;
      if (!newArticle) {
        const photo = file ? await jpegAttachment(file) : undefined;
        const key = JSON.stringify({ ...input, photo });
        if (pending.current?.key !== key) {
          const hex = Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, '0')).join('');
          pending.current = { key, id: `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}` };
        }
        payload = { ...input, mutationId: pending.current.id, photo };
      }
      const response = await fetch(demo ? `${api}?demo=1` : api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Opslaan is mislukt.');
      setState(result.state);
      if (newArticle) {
        const article = result.state.workshop.find((item: StockArticle) => item.id === result.id);
        select(article, false);
        setCategory('');
        setQuery('');
        setPage(0);
        setShowNew(false);
      } else if ('shelf' in input) {
        pending.current = null;
        setLastMovement({ move: result.movement, article: selected, file });
        setMovementPhoto(undefined);
        setLocation(result.state.bins.find((bin: StockBin) =>
          bin.article === input.article && bin.shelf === input.shelf && bin.box === input.box));
        movementForm.current?.reset();
      }
      setNotice(newArticle ? 'Werkplaatsartikel toegevoegd.' : 'Voorraadbeweging opgeslagen.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Opslaan is mislukt.');
    } finally { setSubmitting(false); }
  }

  return (
    <div className={styles.workspace}>
      <header className={styles.heading}>
        <div><p>{t('Voorraad')}</p><h1>{t(inventoryViews[view])}</h1></div>
        <div className={styles.labelActions}>
          {view === 'products' && <>
          <button type="button" className={styles.primary} disabled={!fullCatalog} onClick={() => setCamera('scan')}><ScanLine size={16} /> Scan QR / barcode</button>
          <Link className={styles.secondary} href={`/admin/voorraad/p${demo ? '?demo=1' : ''}`}><Barcode size={16} /> {t('Productprofiel')}</Link>
          <button type="button" className={styles.secondary} disabled={!ready} onClick={() => setBulk(true)}><Images size={16} /> {t('Bulktelling')}</button>
          {!demo && <button type="button" className={styles.secondary} onClick={() => setShowNew(!showNew)}><Plus size={16} /> {t("Werkplaatsartikel")}</button>}
          </>}
          <Link className={styles.secondary} href={inventoryHref(view, !demo)}>{t(demo ? 'Naar lokale voorraad' : 'Voorbeeldgegevens')}</Link>
        </div>
      </header>
      <nav className={styles.inventoryNav} aria-label={t('Voorraad')}>
        {(Object.entries(inventoryViews) as [InventoryView, string][]).map(([id, label]) => (
          <Link key={id} href={inventoryHref(id, demo)} aria-current={view === id ? 'page' : undefined}>{t(label)}</Link>
        ))}
      </nav>
      {scanStatus && <p className={styles.muted} role="status">{scanStatus.startsWith('Gescand:') ? scanStatus.replace('Gescand', t('Gescand')) : t(scanStatus)}</p>}

      {showNew && <form className={`${styles.panel} ${styles.inline}`} onSubmit={(event) => save(event, true)}>
        <label>{t("Artikelnaam")}<input name="name" required maxLength={180} /></label>
        <label>{t("SKU (optioneel)")}<input name="sku" maxLength={80} /></label>
        <button className={styles.primary} disabled={!ready || submitting}>{t("Artikel toevoegen")}</button>
      </form>}
      <p className={styles.notice} role="status">{t(notice)}</p>
      {!fullCatalog && (catalogFailed ? (
        <p role="alert">{t('Voorraad kon niet geladen worden.')} <button type="button" className={styles.secondary} onClick={() => { setCatalogFailed(false); setCatalogAttempt(attempt => attempt + 1); }}>{t('Opnieuw')}</button></p>
      ) : <p className={styles.muted} role="status">{t('Laden…')}</p>)}
      {lastMovement && <section className={`${styles.panel} ${styles.inline}`} aria-label={t("Opgeslagen beweging")}>
        <strong>{t(STOCK_OPERATIONS[lastMovement.move.operation as Operation])} {t('opgeslagen')} · {lastMovement.article.sku || lastMovement.article.id}</strong>
        <button type="button" className={styles.secondary} onClick={() => shareMovement(lastMovement)}>{t("Delen via WhatsApp")}</button>
        {lastMovement.move.photo && <a href={`${api}?movement=${lastMovement.move.id}${demo ? '&demo=1' : ''}`} download={`keyforcars-${lastMovement.move.id}.jpg`}>{t("Foto downloaden")}</a>}
      </section>}
      {ready && view === 'reorder' && <StockReorder state={state} catalog={articles} incoming={Object.fromEntries(Object.entries(positions).map(([code, row]) => [code, row.incoming]))} />}
      {ready && (view === 'reports' || view === 'journal') && <StockReports key={view} state={state} catalog={articles} demo={demo} view={view} />}

      {view === 'products' && <div className={styles.columns}>
        <section className={styles.panel} aria-label={t("Artikelen")}>
          <form className={styles.search} onSubmit={(event) => {
            event.preventDefault();
            if (!fullCatalog) return;
            const code = stockCode(query);
            const exact = articles.filter((article) => [article.id, article.sku].some((value) => value.toUpperCase() === code));
            if (needle && exact.length === 1) { setCategory(''); setQuery(code); setPage(0); select(exact[0]); }
            else if (needle && filtered.length === 1) select(filtered[0]);
          }}>
            <label htmlFor="stock-search" className={styles.srOnly}>{t("Zoek of scan een artikel")}</label>
            <input id="stock-search" ref={search} value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} placeholder={t("Zoek op artikel, SKU of locatie")} />
            <button type="button" className={styles.secondary} disabled={!fullCatalog} onClick={() => setCamera('scan')}><ScanLine size={16} /> Scan QR / barcode</button>
          </form>
          <label className={styles.categoryFilter}>{t('Categorie')}
            <select value={category} onChange={(event) => {
              const next = event.target.value;
              setCategory(next);
              setPage(0);
              if (next && categoryByArticle.get(selected.id) !== next) {
                const first = articles.find((article) => categoryByArticle.get(article.id) === next);
                if (first) select(first, false);
              }
            }}>
              <option value="">{t('Alle categorieën')} ({articles.length})</option>
              {[...categories].sort(([, a], [, b]) => t(a.label).localeCompare(t(b.label), english ? 'en' : 'nl')).map(([id, { label, count }]) =>
                <option key={id} value={id}>{t(label)} ({count})</option>
              )}
            </select>
          </label>
          <div className={styles.listHead}><span>{filtered.length} {t('resultaten')}</span>
            <button type="button" className={styles.secondary} disabled={!ready || !marked.length} onClick={() => setPrintLabels(
              articles.filter((article) => marked.includes(article.id)).flatMap((article) => {
                const assigned = state.bins.filter((bin) => bin.article === article.id);
                return assigned.length ? assigned.map((bin) => ({ article, bin })) : [{ article }];
              }),
            )}><Printer size={15} /> {t('Etiketten')} ({marked.length})</button>
          </div>
          {fullCatalog && !filtered.length && <p className={styles.muted}>{t('Geen resultaten')}</p>}
          <ul className={styles.list}>
            {filtered.slice(page * pageSize, (page + 1) * pageSize).map((article) => (
              <li key={article.id} className={article.id === selected.id ? styles.selected : ''}>
                <input type="checkbox" aria-label={`${t('Etiket selecteren voor')} ${article.name}`} checked={marked.includes(article.id)} onChange={(event) => {
                  setMarked(event.target.checked ? [...marked, article.id] : marked.filter((id) => id !== article.id));
                }} />
                <button type="button" className={styles.article} onClick={() => select(article)} aria-pressed={article.id === selected.id}>
                  {article.image ? <img src={article.image} alt="" loading="lazy" referrerPolicy="no-referrer" /> : <Barcode size={22} />}
                  <span><strong>{article.name}</strong><small>{article.sku || article.id} · {t(inventoryCategory(article)[1])}</small>
                    {stockReady && <small className={styles.shelfHint}>{(() => {
                      const locations = state.bins.filter(bin => bin.article === article.id);
                      const first = locations[0];
                      return first ? `${t('Locatie')}: ${first.shelf} / ${first.box} · ${first.quantity} ${t('st.')}${locations.length > 1 ? ` (+${locations.length - 1})` : ''}` : t('Locatie niet opgegeven');
                    })()}</small>}
                    {stockReady && positions[article.id] && <small className={styles.shelfHint}>{(({ physical, unusable, reserved, available, incoming }) =>
                      `${t('Fysiek')} ${physical} · ${t('Onbruikbaar')} ${unusable} · ${t('Gereserveerd')} ${reserved} · ${t('Beschikbaar')} ${available} · ${t('Onderweg')} ${incoming}`)(positions[article.id])}</small>}
                  </span>
                </button>
                {article.sku && <Link prefetch={false} className={styles.profileShortcut} href={`/admin/voorraad/p?q=${encodeURIComponent(article.sku)}${demo ? '&demo=1' : ''}`}>{t('Productprofiel')}</Link>}
              </li>
            ))}
          </ul>
          <div className={styles.pagination}>
            <button type="button" className={styles.secondary} disabled={page === 0} aria-label={t("Vorige pagina")} onClick={() => setPage(page - 1)}><ChevronLeft size={18} /></button>
            <form className={styles.pageJump} onSubmit={(event) => {
              event.preventDefault();
              const target = Number(new FormData(event.currentTarget).get('page'));
              if (Number.isInteger(target) && target >= 1 && target <= pageCount) setPage(target - 1);
            }}>
              <label htmlFor="stock-page" className={styles.srOnly}>{t("Paginanummer")}</label>
              <input key={`${page}/${pageCount}`} id="stock-page" name="page" type="number" min={1} max={pageCount} step={1} defaultValue={page + 1} required />
              <span>/ {pageCount}</span>
            </form>
            <button type="button" className={styles.secondary} disabled={page + 1 >= pageCount} aria-label={t("Volgende pagina")} onClick={() => setPage(page + 1)}><ChevronRight size={18} /></button>
          </div>
        </section>

        <section className={styles.detail} ref={details} aria-label={t("Artikelvoorraad")}>
          <div className={styles.panel}>
            <div className={styles.listHead}><h2>{t("Bak- en locatie-etiket")}</h2>
              <div className={styles.labelActions}>
                <input ref={photoInput} type="file" accept="image/*" hidden onChange={(event) => void uploadPhoto(event.target.files?.[0])} />
                {!demo && <button type="button" className={styles.secondary} disabled={!ready || submitting} onClick={() => photoInput.current?.click()}><Camera size={15} /> {t("Foto")}</button>}
                <select className={styles.labelSize} aria-label={t('Etiketformaat')} value={labelSize} onChange={(event) => saveLabelSize(event.target.value as LabelSize)}>
                  {Object.entries(LABEL_SIZES).map(([key, { name }]) => <option key={key} value={key}>{t(name)}</option>)}
                </select>
                <button type="button" className={styles.secondary} disabled={!ready || !!printJob} onClick={() => setPrintLabels([{ article: displayedArticle, bin: currentBin }])}><Printer size={15} /> {t("Afdrukken")}</button>
              </div>
            </div>
            {/* What you see is what prints: the same label, at the chosen size. */}
            <div className={styles.labelPreview}>
              <ShelfLabel article={displayedArticle} bin={currentBin} code={codeFor(displayedArticle)} profile={selectedProfile ?? null} size={labelSize} />
            </div>
            {!!selected.sources.length && <div className={styles.sources}>{selected.sources.map((source) => (
              <a key={source.shop} href={source.url} target="_blank" rel="noreferrer">{source.shop} ↗</a>
            ))}</div>}
          </div>

          {selected.sku && <div className={styles.panel}>
            <h2>{t('Productinformatie')}</h2>
            {selectedProfile === undefined ? <p className={styles.muted}>{t('Laden…')}</p>
              : selectedProfile ? <ProductFacts key={selected.sku} profile={selectedProfile} demo={demo} compact />
              : <p className={styles.muted}>{t('Geen productprofiel voor deze SKU.')}</p>}
          </div>}

          <div className={styles.panel}>
            <h2>{t("Locaties")}</h2>
            {bins.length ? <ul className={styles.locations}>{bins.map((bin) => (
              <li key={`${bin.shelf}/${bin.box}`}>
                <button type="button" className={styles.secondary} aria-pressed={currentBin === bin} onClick={() => setLocation(bin)}>{bin.shelf} · {bin.box}</button>
                <strong>{bin.quantity} {t("st.")}</strong>
                {bin.quantity <= bin.minimum && <span className={styles.low}>{t("Lage voorraad")}</span>}
              </li>
            ))}</ul> : <p className={styles.muted}>{t("Nog niet geteld")}</p>}
            {!demo && !!bins.length && <button type="button" className={styles.secondary} onClick={() => { setLocation(undefined); setOperation('count'); }}>{t("Locatie tellen")}</button>}
          </div>

          <form key={`${selected.id}/${location?.shelf ?? ''}/${location?.box ?? ''}`} ref={movementForm} className={`${styles.panel} ${styles.booking}`} onSubmit={save}>
            <div className={styles.sectionHeading}><ClipboardList size={20} aria-hidden="true" /><h2>{t("Voorraad boeken")}</h2><StockHelp /></div>
            <div className={styles.bookingProduct}>
              {displayedArticle.image ? <img src={displayedArticle.image} alt="" referrerPolicy="no-referrer" /> : <Package size={24} aria-hidden="true" />}
              <div><strong>{selected.name}</strong><small>{selected.sku || selected.id}{demo && ` · ${t('Proefvoorraad')}`}</small></div>
            </div>
            <div className={styles.formGrid}>
              <label>{t("Beweging")}<select value={operation} onChange={(event) => setOperation(event.target.value as Operation)}>
                {Object.entries(STOCK_OPERATIONS).map(([key, title]) => <option key={key} value={key}>{t(title)}</option>)}
              </select></label>
              <label>{t(operation === 'count' ? 'Geteld aantal' : 'Aantal')}<input name="quantity" type="number" min={operation === 'count' ? 0 : 1} max={1_000_000} step="1" required /></label>
              {(operation === 'sale' || operation === 'receive') && <label>{t(operation === 'sale' ? 'Totaal verkoopbedrag (€)' : 'Totaal inkoopbedrag (€)')}
                <input name="amount" inputMode="decimal" pattern="[0-9]{1,7}([.,][0-9]{1,2})?" placeholder="0,00" />
              </label>}
              {canLinkInvoice && operation === 'sale' && <label>
                {english ? 'Invoice link or ID (optional)' : 'Factuurlink of ID (optioneel)'}
                <input name="invoice" maxLength={400} />
                <small>{english ? 'Copy the URL of the related invoice.' : 'Kopieer de URL van de bijbehorende factuur.'} <a href="/admin/facturen" target="_blank" rel="noreferrer">{t('Facturen')}</a></small>
              </label>}
              <label>{t("Rallocatie")}<input name="shelf" placeholder="A-03-02" required={locationRequired} maxLength={24} pattern="[A-Za-z0-9\-]+" defaultValue={currentBin?.shelf} /></label>
              <label>{t("Bakcode")}<input name="box" placeholder="B000145" required={locationRequired} maxLength={24} pattern="[A-Za-z0-9\-]+" defaultValue={currentBin?.box} /></label>
              {operation === 'count' && <label>{t("Minimumvoorraad")}<input name="minimum" type="number" min="0" max={1_000_000} step="1" required defaultValue={currentBin?.minimum ?? 0} /></label>}
              {operation === 'transfer' && <>
                <label>{t("Naar locatie")}<input name="destinationShelf" required maxLength={24} pattern="[A-Za-z0-9\-]+" /></label>
                <label>{t("Naar bak")}<input name="destinationBox" required maxLength={24} pattern="[A-Za-z0-9\-]+" /></label>
              </>}
            </div>
            <label>{t("Notitie")} <input name="note" maxLength={500} placeholder={t("Bijvoorbeeld: verkocht aan de balie")} /></label>
            <div className={styles.evidence}>
              <Camera size={20} aria-hidden="true" />
              {movementPhoto ? <><span>{movementPhoto.name}</span><button type="button" className={styles.secondary} aria-label={t("Verwijder foto")} onClick={() => setMovementPhoto(undefined)}><X size={16} aria-hidden="true" /></button></>
                : <button type="button" className={styles.secondary} onClick={() => setCamera('evidence')}>{t("Bewijsfoto maken")}</button>}
            </div>
            <div className={styles.bookingFooter}><button className={styles.primary} disabled={!ready || submitting || scanReview}><Save size={16} aria-hidden="true" /> {t("Beweging opslaan")}</button></div>
          </form>

          <div className={styles.panel}>
            <h2>{t("Voorraadhistorie")}</h2>
            {moves.length ? <ul className={styles.locations}>{moves.map((move, index) => (
              <li key={`${move.time}/${index}`}><span>{t(STOCK_OPERATIONS[move.operation as Operation])}{move.shelf && ` · ${move.shelf} / ${move.box}`}</span>
                <strong>{stockChange(move, english)}</strong>
                {move.photo && <a href={`${api}?movement=${move.id}${demo ? '&demo=1' : ''}`} target="_blank" rel="noreferrer">{t("Foto")}</a>}
                <time dateTime={move.time}>{new Date(move.time).toLocaleString('nl-NL')}</time></li>
            ))}</ul> : <p className={styles.muted}>{t("Geen bewegingen geboekt")}</p>}
          </div>
        </section>
      </div>}
      {/* Rendered straight under <body> so print can drop the rest of the page from layout. */}
      {printJob && createPortal(
        <div className={styles.printSheet} data-stock-print data-size={labelSize}>
          <style>{`@page { size: ${LABEL_SIZES[labelSize].page}; margin: 0; }`}</style>
          {printJob.labels.map(({ article, bin }) => <ShelfLabel key={`${article.id}/${bin?.shelf}/${bin?.box}`} article={article} bin={bin}
            code={codeFor(article)} profile={printJob.profiles[article.sku.trim().toUpperCase()] ?? null} size={labelSize} />)}
        </div>,
        document.body,
      )}
      {bulk && <StockBulkCount state={state} articles={articles} demo={demo} onClose={() => setBulk(false)} onSaved={(next, saved) => {
        setState(next);
        setBulk(false);
        setNotice(`${saved} tellingen opgeslagen.`);
      }} />}
      {camera && <StockCamera onClose={() => setCamera(undefined)} onPhoto={(file) => {
        setCamera(undefined);
        if (camera === 'scan') void scanPhoto(file);
        else setMovementPhoto(file);
      }} />}
    </div>
  );
}
