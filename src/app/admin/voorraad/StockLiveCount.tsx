'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Flashlight, Minus, Pause, Play, Plus, Save, Search, Trash2, X } from 'lucide-react';
import type { StockArticle, StockBin, StockState } from '@/lib/keyforcarsStock';
import { normaliseCode, trustedUnknownCode } from '@/lib/stockBulkCount';
import {
  LIVE_MAX_LINES, adjust, cleanBinCode, dismissUnknown, emptyTally, hasWork, isFull, linkUnknown, observeFrame,
  payloadLines, removeLine, reviewLines, setQuantity, sightingsFromCodes, totalCount, validBinCode,
  type LiveCode, type LiveTally,
} from '@/lib/stockLiveCount';
import { uuid } from '@/lib/sha256';
import { usePreviewLanguage } from '../PreviewLanguage';
import styles from './liveCount.module.css';

const api = '/api/admin/voorraad-local';
const BIN_STORAGE = 'kfc-live-count-bin';
/** Part of the video (width, height) inside the scan frame; only that part is decoded. */
const SCAN_W = 0.84;
const SCAN_H = 0.6;
const FRAME_MAX_SIDE = 1024;
const FRAME_PAUSE_MS = 60;

type Phase = 'bin' | 'scan' | 'review' | 'saving';
type Camera = 'off' | 'starting' | 'live' | 'paused';
type Picker = { mode: 'link'; code: string } | { mode: 'add' } | null;
type Scanner = { scan: (file: File) => Promise<{ codes: LiveCode[]; error?: string }>; close: () => void };
type Lock = { release: () => Promise<void> };

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));
/** Monotonic time for the tally; only called from the scan loop, never while rendering. */
const clock = () => performance.now();

interface CameraRefs {
  generation: { current: number };
  stream: { current: MediaStream | null };
  video: { current: HTMLVideoElement | null };
  wakeLock: { current: Lock | null };
}

/** Ends the scan loop (a new generation) and turns the camera and the wake lock off. */
function releaseCamera({ generation, stream, video, wakeLock }: CameraRefs) {
  generation.current++;
  stream.current?.getTracks().forEach((track) => track.stop());
  stream.current = null;
  if (video.current) video.current.srcObject = null;
  void wakeLock.current?.release().catch(() => undefined);
  wakeLock.current = null;
}

function storedBin() {
  try {
    const value = JSON.parse(window.localStorage.getItem(BIN_STORAGE) || '{}') as { shelf?: unknown; box?: unknown };
    return { shelf: cleanBinCode(String(value.shelf ?? '')), box: cleanBinCode(String(value.box ?? '')) };
  } catch {
    return { shelf: '', box: '' };
  }
}

/**
 * Continuous-scan count for one bin, built for a phone: choose the bin once,
 * then hold labels in front of the camera one after another. Every label that
 * comes into view adds one; saving replaces the quantity of each counted
 * article in that bin.
 */
export default function StockLiveCount({ resolve, byId, articles, bins, demo, onClose, onSaved, onLink }: {
  resolve: (code: string) => string | null;
  byId: Map<string, StockArticle>;
  articles: StockArticle[];
  bins: StockBin[];
  demo: boolean;
  onClose: () => void;
  onSaved: (state: StockState, saved: number) => void;
  onLink?: (barcode: string, articleId: string) => Promise<string | null>;
}) {
  const { t } = usePreviewLanguage();
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const scanner = useRef<Scanner | null>(null);
  const generation = useRef(0);
  const audio = useRef<AudioContext | null>(null);
  const wakeLock = useRef<Lock | null>(null);
  const resolveRef = useRef(resolve);
  const linked = useRef(new Map<string, string>());
  const tallyRef = useRef<LiveTally>(emptyTally());
  const saved = useRef(false);

  const [initialBin] = useState(storedBin);
  const [shelf, setShelf] = useState(initialBin.shelf);
  const [box, setBox] = useState(initialBin.box);
  const [phase, setPhase] = useState<Phase>('bin');
  const [camera, setCamera] = useState<Camera>('off');
  const [cameraError, setCameraError] = useState('');
  const [notice, setNotice] = useState('');
  const [tally, setTally] = useState<LiveTally>(emptyTally);
  const [torch, setTorch] = useState({ supported: false, on: false });
  const [picker, setPicker] = useState<Picker>(null);
  const [query, setQuery] = useState('');
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState('');
  const [pendingAdd, setPendingAdd] = useState<{ article: string; seen: number } | null>(null);
  const [saveError, setSaveError] = useState('');
  const [batchId] = useState(uuid);

  useEffect(() => { resolveRef.current = resolve; }, [resolve]);

  useEffect(() => {
    const element = dialog.current;
    const refs = { generation, stream, video, wakeLock };
    const decoder = scanner;
    const sound = audio;
    element?.showModal();
    return () => {
      releaseCamera(refs);
      decoder.current?.close();
      decoder.current = null;
      void sound.current?.close().catch(() => undefined);
      element?.close();
    };
  }, []);

  // A hidden page (home button, lock screen, app switch) stops the camera; the person resumes with one tap.
  useEffect(() => {
    if (camera !== 'live') return;
    const onVisibility = () => {
      if (!document.hidden) return;
      releaseCamera({ generation, stream, video, wakeLock });
      setTorch((current) => ({ ...current, on: false }));
      setCamera('paused');
      setNotice('Gepauzeerd omdat de app naar de achtergrond ging. Tik op Verder scannen.');
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [camera]);

  const binValid = validBinCode(shelf) && validBinCode(box);
  const binHere = useMemo(() => bins.filter((bin) => bin.shelf === shelf && bin.box === box), [bins, shelf, box]);
  const shelves = useMemo(() => [...new Set(bins.map((bin) => bin.shelf).filter(Boolean))].sort().slice(0, 300), [bins]);
  const boxes = useMemo(() => [...new Set(bins.filter((bin) => !shelf || bin.shelf === shelf).map((bin) => bin.box).filter(Boolean))].sort().slice(0, 300), [bins, shelf]);
  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    return articles.filter((article) => article.name.toLowerCase().includes(needle)
      || article.sku.toLowerCase().includes(needle) || article.id.toLowerCase().includes(needle)).slice(0, 30);
  }, [articles, query]);
  const review = useMemo(() => reviewLines(tally, bins, shelf, box), [tally, bins, shelf, box]);
  const total = totalCount(tally);
  const full = isFull(tally);
  const label = (id: string) => byId.get(id);

  function commit(next: LiveTally) {
    tallyRef.current = next;
    setTally(next);
  }

  function ensureAudio() {
    try {
      const Context = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Context) return;
      audio.current ??= new Context();
      void audio.current.resume().catch(() => undefined);
    } catch { /* no sound, vibration and the screen still confirm */ }
  }

  function beep(frequency: number) {
    const context = audio.current;
    if (!context) return;
    try {
      if (context.state !== 'running') void context.resume().catch(() => undefined);
      const start = context.currentTime;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.3, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.09);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.1);
    } catch { /* best effort */ }
  }

  async function keepAwake() {
    try {
      const lock = (navigator as unknown as { wakeLock?: { request: (type: 'screen') => Promise<Lock> } }).wakeLock;
      if (lock) wakeLock.current = await lock.request('screen');
    } catch { /* not available or refused: the screen may dim, counting still works */ }
  }

  function stopCamera() {
    releaseCamera({ generation, stream, video, wakeLock });
    setTorch((current) => ({ ...current, on: false }));
  }

  async function startCamera() {
    ensureAudio(); // inside the tap: iOS only allows sound that was started by a gesture
    const run = ++generation.current;
    setCamera('starting');
    setCameraError('');
    setNotice('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Livecamera vereist HTTPS. Open de app via https:// en probeer opnieuw.');
      setCamera('off');
      return;
    }
    let opened: MediaStream | undefined;
    try {
      opened = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false,
      });
      if (run !== generation.current || !video.current) {
        opened.getTracks().forEach((track) => track.stop());
        return;
      }
      stream.current = opened;
      video.current.srcObject = opened;
      await video.current.play();
      const track = opened.getVideoTracks()[0];
      const capabilities = typeof track?.getCapabilities === 'function' ? track.getCapabilities() as MediaTrackCapabilities & { torch?: boolean } : undefined;
      setTorch({ supported: Boolean(capabilities?.torch), on: false });
      setCamera('live');
      void keepAwake();
      void loop(run);
    } catch (error) {
      opened?.getTracks().forEach((track) => track.stop());
      if (stream.current === opened) stream.current = null;
      if (run !== generation.current) return;
      setCamera('off');
      setCameraError(error instanceof DOMException && error.name === 'NotAllowedError'
        ? 'Sta cameratoegang toe in je browser (Instellingen › Safari › Camera) en probeer opnieuw.'
        : 'De camera is niet beschikbaar. Sluit andere apps die de camera gebruiken en probeer opnieuw.');
    }
  }

  function pause() {
    stopCamera();
    setCamera('paused');
  }

  /** The part of the frame inside the scan area, scaled down, as a JPEG. */
  function grabFrame(): Promise<File | null> {
    const element = video.current;
    if (!element || !element.videoWidth || !element.videoHeight || element.readyState < 2) return Promise.resolve(null);
    const videoWidth = element.videoWidth;
    const videoHeight = element.videoHeight;
    const shownWidth = element.clientWidth || videoWidth;
    const shownHeight = element.clientHeight || videoHeight;
    // object-fit: cover: the element shows the centre of the frame at this scale.
    const scale = Math.max(shownWidth / videoWidth, shownHeight / videoHeight);
    const cropWidth = Math.min(videoWidth, (shownWidth / scale) * SCAN_W);
    const cropHeight = Math.min(videoHeight, (shownHeight / scale) * SCAN_H);
    const out = Math.min(1, FRAME_MAX_SIDE / Math.max(cropWidth, cropHeight));
    const target = canvas.current ??= document.createElement('canvas');
    target.width = Math.max(1, Math.round(cropWidth * out));
    target.height = Math.max(1, Math.round(cropHeight * out));
    const context = target.getContext('2d');
    if (!context) return Promise.resolve(null);
    context.drawImage(element, (videoWidth - cropWidth) / 2, (videoHeight - cropHeight) / 2, cropWidth, cropHeight, 0, 0, target.width, target.height);
    return new Promise((done) => target.toBlob((blob) => done(blob ? new File([blob], 'frame.jpg', { type: 'image/jpeg' }) : null), 'image/jpeg', 0.85));
  }

  /** One frame at a time: grab, decode, count, then the next frame. Stops when `run` is no longer current. */
  async function loop(run: number) {
    if (!scanner.current) {
      const { liveScanner } = await import('./bulkScanPool');
      scanner.current ??= liveScanner();
    }
    let failures = 0;
    while (run === generation.current) {
      const file = await grabFrame();
      if (run !== generation.current) break;
      if (!file) { await wait(200); continue; }
      const result = await scanner.current!.scan(file);
      if (run !== generation.current) break;
      if (result.error) {
        failures++;
        if (failures === 3) setNotice(`Codes lezen lukt niet: ${result.error}`);
        await wait(300);
        continue;
      }
      if (failures) { failures = 0; setNotice(''); }
      count(result.codes);
      await wait(FRAME_PAUSE_MS);
    }
  }

  function count(codes: LiveCode[]) {
    const sightings = sightingsFromCodes(codes, {
      normalise: normaliseCode,
      resolve: (code) => linked.current.get(code) ?? resolveRef.current(code),
      trusted: trustedUnknownCode,
    });
    const result = observeFrame(tallyRef.current, sightings, clock());
    commit(result.tally);
    if (result.counted.length) {
      beep(1760);
      navigator.vibrate?.(40);
    } else if (result.unknownSeen.length || result.refused.length) {
      beep(440);
    }
  }

  function requestClose() {
    if (phase === 'saving') return;
    const current = tallyRef.current;
    if (!saved.current && hasWork(current)
      && !window.confirm(`${t('Deze telling is nog niet opgeslagen')} (${totalCount(current)} ${t('stuks')}). ${t('Sluiten en alles weggooien?')}`)) return;
    onClose();
  }

  function begin() {
    if (!binValid) return;
    try { window.localStorage.setItem(BIN_STORAGE, JSON.stringify({ shelf, box })); } catch { /* private mode */ }
    setPhase('scan');
    void startCamera();
  }

  function toReview() {
    stopCamera();
    setCamera('paused');
    setPicker(null);
    setSaveError('');
    setPhase('review');
  }

  async function toggleTorch() {
    const track = stream.current?.getVideoTracks()[0];
    if (!track) return;
    const on = !torch.on;
    try {
      await track.applyConstraints({ advanced: [{ torch: on } as MediaTrackConstraintSet] });
      setTorch({ supported: true, on });
    } catch {
      setTorch({ supported: false, on: false });
    }
  }

  async function choose(article: StockArticle) {
    if (!picker) return;
    if (picker.mode === 'add') {
      commit(adjust(tallyRef.current, article.id, 1));
      setPicker(null);
      setQuery('');
      return;
    }
    if (!onLink) return;
    const code = picker.code;
    setLinking(true);
    setLinkError('');
    let error: string | null;
    try {
      error = await onLink(code, article.id);
    } catch {
      error = 'Koppelen is mislukt. Probeer het opnieuw.';
    }
    setLinking(false);
    if (error) { setLinkError(error); return; }
    linked.current.set(code, article.id);
    const result = linkUnknown(tallyRef.current, code, article.id);
    commit(result.tally);
    setPicker(null);
    setQuery('');
    if (result.seen > 0) setPendingAdd({ article: article.id, seen: result.seen });
  }

  async function save() {
    let lines;
    try {
      lines = payloadLines(tallyRef.current, shelf, box);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Ongeldige bak.');
      return;
    }
    if (!lines.length) return;
    setPhase('saving');
    setSaveError('');
    try {
      const response = await fetch(demo ? `${api}?demo=1` : api, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation: 'bulkCount', batchId, photos: [], lines }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.state) throw new Error(body.error || 'Opslaan is mislukt.');
      saved.current = true;
      onSaved(body.state as StockState, lines.length);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Opslaan is mislukt.');
      setPhase('review');
    }
  }

  const status = camera === 'starting' ? 'Camera openen…'
    : camera === 'live' ? 'Scannen: houd één etiket tegelijk in het kader.'
      : camera === 'paused' ? 'Gepauzeerd.' : '';
  const last = tally.last ? label(tally.last.article) : undefined;
  const binText = `${shelf} / ${box}`;

  return (
    <dialog ref={dialog} className={styles.dialog} aria-labelledby="live-count-title" onCancel={(event) => { event.preventDefault(); requestClose(); }}>
      <header className={styles.head}>
        <h2 id="live-count-title">{phase === 'bin' ? t('Doorlopend scannen') : <>{t('Bak')} <strong>{binText}</strong></>}</h2>
        <button type="button" className={styles.iconButton} aria-label={t('Sluiten')} onClick={requestClose} disabled={phase === 'saving'}><X size={22} aria-hidden="true" /></button>
      </header>

      {phase === 'bin' && <form className={styles.binStep} onSubmit={(event) => { event.preventDefault(); begin(); }}>
        <p>{t('Kies eerst de bak die je gaat tellen. Houd daarna de etiketten één voor één voor de camera; elk etiket telt +1.')}</p>
        <label>{t('Rallocatie')}
          <input value={shelf} list="live-count-shelves" placeholder="A-01" autoCapitalize="characters" autoComplete="off" autoCorrect="off" spellCheck={false}
            pattern="[A-Z0-9\-]{1,24}" required onChange={(event) => setShelf(cleanBinCode(event.target.value))} />
        </label>
        <label>{t('Bakcode')}
          <input value={box} list="live-count-boxes" placeholder="B01" autoCapitalize="characters" autoComplete="off" autoCorrect="off" spellCheck={false}
            pattern="[A-Z0-9\-]{1,24}" required enterKeyHint="go" onChange={(event) => setBox(cleanBinCode(event.target.value))} />
        </label>
        <datalist id="live-count-shelves">{shelves.map((value) => <option key={value} value={value} />)}</datalist>
        <datalist id="live-count-boxes">{boxes.map((value) => <option key={value} value={value} />)}</datalist>
        {binValid && <p className={styles.hint}>{binHere.length
          ? `${t('Volgens het systeem liggen in deze bak')} ${binHere.length} ${t(binHere.length === 1 ? 'artikel' : 'artikelen')} (${binHere.reduce((sum, bin) => sum + bin.quantity, 0)} ${t('stuks')}).`
          : t('Deze bak heeft nog geen voorraad in het systeem.')}</p>}
        <p className={styles.warning}>{t('Let op: opslaan vervangt het aantal van elk gescand artikel in deze bak. Het wordt niet opgeteld. Artikelen die je niet scant, blijven ongewijzigd.')}</p>
        <button type="submit" className={styles.primaryBig} disabled={!binValid}><Play size={22} aria-hidden="true" /> {t('Start scannen')}</button>
      </form>}

      <section className={styles.scan} hidden={phase !== 'scan'} aria-label={t('Scannen')}>
        <div className={styles.stage}>
          <video ref={video} muted playsInline autoPlay aria-label={t('Camerabeeld')} />
          <div className={styles.frame} style={{ width: `${SCAN_W * 100}%`, height: `${SCAN_H * 100}%` }} aria-hidden="true" />
          <div className={styles.total} aria-hidden="true"><strong>{total}</strong><span>{t('stuks')} · {tally.lines.length} {t('art.')}</span></div>
          {camera !== 'live' && <div className={styles.stageCover}>
            {camera === 'starting' && <span>{t('Camera openen…')}</span>}
            {camera === 'paused' && <button type="button" className={styles.primaryBig} onClick={() => void startCamera()}><Play size={22} aria-hidden="true" /> {t('Verder scannen')}</button>}
            {camera === 'off' && cameraError && <button type="button" className={styles.primaryBig} onClick={() => void startCamera()}>{t('Opnieuw proberen')}</button>}
          </div>}
        </div>

        <div className={styles.lastScan}>
          {tally.last
            ? <div key={tally.last.at} className={styles.lastPop}>
                <strong>{last?.name || tally.last.article}</strong>
                <span>{last?.sku || tally.last.article} · {t('nu')} <b>{tally.lines.find((line) => line.article === tally.last?.article)?.quantity ?? tally.last.quantity}</b></span>
              </div>
            : <span className={styles.hint}>{t('Nog niets gescand.')}</span>}
        </div>

        <p className={styles.status} role="status" aria-live="polite">
          {t(status)}{last ? ` ${t('Laatste')}: ${last.name}.` : ''}
        </p>
        {cameraError && <p className={styles.alert} role="alert">{t(cameraError)}</p>}
        {notice && <p className={styles.alert} role="alert">{t(notice)}</p>}
        {full && <p className={styles.alert} role="alert">{t(`Maximaal ${LIVE_MAX_LINES} artikelen per telling bereikt. Nieuwe artikelen worden niet meer geteld: sla deze telling op en begin een nieuwe.`)}</p>}

        <div className={styles.controls}>
          {camera === 'live'
            ? <button type="button" className={styles.secondary} onClick={pause}><Pause size={20} aria-hidden="true" /> {t('Pauze')}</button>
            : <button type="button" className={styles.secondary} onClick={() => void startCamera()} disabled={camera === 'starting'}><Play size={20} aria-hidden="true" /> {t('Verder')}</button>}
          {torch.supported && camera === 'live' && <button type="button" className={styles.secondary} aria-pressed={torch.on} onClick={() => void toggleTorch()}><Flashlight size={20} aria-hidden="true" /> {t('Zaklamp')}</button>}
          <button type="button" className={styles.secondary} onClick={() => { setPicker({ mode: 'add' }); setQuery(''); setLinkError(''); }}><Search size={20} aria-hidden="true" /> {t('Artikel zoeken')}</button>
          {!hasWork(tally) && <button type="button" className={styles.secondary} onClick={() => { stopCamera(); setCamera('off'); setPhase('bin'); }}>{t('Andere bak')}</button>}
        </div>

        {pendingAdd && <div className={styles.card}>
          <p>{t('Code gekoppeld aan')} <strong>{label(pendingAdd.article)?.name || pendingAdd.article}</strong>. {t('Telt vanaf nu mee.')} {pendingAdd.seen} {t('eerdere scans ook optellen?')}</p>
          <div className={styles.cardActions}>
            <button type="button" className={styles.primary} onClick={() => { commit(adjust(tallyRef.current, pendingAdd.article, pendingAdd.seen)); setPendingAdd(null); }}>{t('Optellen')} (+{pendingAdd.seen})</button>
            <button type="button" className={styles.secondary} onClick={() => setPendingAdd(null)}>{t('Niet optellen')}</button>
          </div>
        </div>}

        {tally.unknown.map((entry) => <div key={entry.code} className={styles.card}>
          <p><strong>{t('Onbekende code')} {entry.code}</strong> ({entry.seen}× {t('gezien')})</p>
          {onLink
            ? <p className={styles.hint}>{t('Wordt niet geteld tot je hem koppelt.')}</p>
            : <p className={styles.hint}>{t('Deze code staat niet in de catalogus en wordt niet geteld.')}</p>}
          <div className={styles.cardActions}>
            {onLink && <button type="button" className={styles.primary} onClick={() => { setPicker({ mode: 'link', code: entry.code }); setQuery(''); setLinkError(''); }}>{t('Koppel aan artikel')}</button>}
            <button type="button" className={styles.secondary} onClick={() => commit(dismissUnknown(tallyRef.current, entry.code))}>{t('Negeren')}</button>
          </div>
        </div>)}

        {picker && <div className={styles.picker} role="group" aria-label={picker.mode === 'link' ? t('Koppel aan artikel') : t('Artikel zoeken')}>
          <p>{picker.mode === 'link' ? <>{t('Koppel')} <strong>{picker.code}</strong> {t('aan:')}</> : t('Artikel handmatig +1:')}</p>
          <input type="search" value={query} placeholder={t('Naam, SKU of code')} autoComplete="off" autoCorrect="off" spellCheck={false} enterKeyHint="search"
            aria-label={t('Zoek artikel')} onChange={(event) => setQuery(event.target.value)} />
          {linkError && <p className={styles.alert} role="alert">{t(linkError)}</p>}
          <ul>
            {matches.map((article) => <li key={article.id}>
              <button type="button" disabled={linking} onClick={() => void choose(article)}>
                <strong>{article.name}</strong><small>{article.sku || article.id}</small>
              </button>
            </li>)}
          </ul>
          {query.trim() && !matches.length && <p className={styles.hint}>{t('Geen artikel gevonden.')}</p>}
          <button type="button" className={styles.secondary} onClick={() => { setPicker(null); setLinkError(''); }}>{t('Annuleren')}</button>
        </div>}

        <ul className={styles.lines} aria-label={t('Getelde artikelen')}>
          {tally.lines.map((line) => {
            const article = label(line.article);
            const name = article?.sku || line.article;
            return <li key={line.article}>
              {tally.last?.article === line.article && line.scannedAt === tally.last.at && <span key={line.scannedAt} className={styles.flash} aria-hidden="true" />}
              <span className={styles.lineName}><strong>{article?.name || line.article}</strong><small>{article?.sku || line.article}</small></span>
              <span className={styles.stepper}>
                <button type="button" aria-label={`${t('Eén minder')} ${name}`} onClick={() => commit(adjust(tallyRef.current, line.article, -1))} disabled={line.quantity <= 0}><Minus size={22} aria-hidden="true" /></button>
                <input type="text" inputMode="numeric" pattern="[0-9]*" value={String(line.quantity)} aria-label={`${t('Aantal')} ${name}`}
                  onFocus={(event) => event.target.select()}
                  onChange={(event) => commit(setQuantity(tallyRef.current, line.article, Number(event.target.value.replace(/\D/g, '').slice(0, 7) || 0)))} />
                <button type="button" aria-label={`${t('Eén meer')} ${name}`} onClick={() => commit(adjust(tallyRef.current, line.article, 1))}><Plus size={22} aria-hidden="true" /></button>
                <button type="button" className={styles.remove} aria-label={`${t('Verwijderen')} ${name}`} onClick={() => commit(removeLine(tallyRef.current, line.article))}><Trash2 size={20} aria-hidden="true" /></button>
              </span>
            </li>;
          })}
        </ul>

        <footer className={styles.footer}>
          <button type="button" className={styles.primaryBig} disabled={!tally.lines.length} onClick={toReview}>
            <Save size={22} aria-hidden="true" /> {t('Opslaan')} ({tally.lines.length} {t(tally.lines.length === 1 ? 'artikel' : 'artikelen')})
          </button>
        </footer>
      </section>

      {(phase === 'review' || phase === 'saving') && <section className={styles.review} aria-label={t('Controleren')}>
        <p className={styles.warning}>{t('Deze telling vervangt het aantal in bak')} <strong>{binText}</strong>. {t('Het wordt niet opgeteld. Artikelen die je niet hebt gescand, blijven ongewijzigd.')}</p>
        {tally.unknown.length > 0 && <p className={styles.hint}>{tally.unknown.length} {t('onbekende code(s) worden niet opgeslagen.')}</p>}
        <ul className={styles.reviewLines}>
          {review.map((line) => {
            const article = label(line.article);
            const changed = line.system !== null && line.system !== line.counted;
            return <li key={line.article}>
              <span className={styles.lineName}><strong>{article?.name || line.article}</strong><small>{article?.sku || line.article}</small></span>
              <span className={changed || line.counted === 0 ? styles.changed : ''}>
                {line.system === null ? `${t('Nieuw in deze bak')} → ${t('Geteld')}: ${line.counted}` : `${t('Systeem')}: ${line.system} → ${t('Geteld')}: ${line.counted}`}
              </span>
            </li>;
          })}
        </ul>
        {saveError && <p className={styles.alert} role="alert">{t(saveError)}</p>}
        <footer className={styles.footer}>
          <button type="button" className={styles.secondary} disabled={phase === 'saving'} onClick={() => setPhase('scan')}>{t('Terug')}</button>
          <button type="button" className={styles.primaryBig} disabled={phase === 'saving' || !review.length} onClick={() => void save()}>
            <Save size={22} aria-hidden="true" /> {phase === 'saving' ? t('Opslaan…') : `${t('Bevestigen en opslaan')} (${review.length})`}
          </button>
        </footer>
      </section>}
    </dialog>
  );
}
