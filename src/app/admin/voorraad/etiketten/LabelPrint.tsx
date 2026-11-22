'use client';

import { useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { euro } from '@/lib/kfcReportColumns';
import { LabelBarcode } from '../StockLabel';
import ShelfLabel, { LABEL_SIZES, type LabelSize } from '../ShelfLabel';
import type { ProductProfileData } from '@/lib/productProfiles';
import shelfStyles from '../keyforcars.module.css';
import { usePreviewLanguage } from '../../PreviewLanguage';
import '../stockPrint.css';

export interface LabelArticle { code: string; name: string; sku: string; price: number | null; location: string; photo?: string | null; number?: string | null; profile?: ProductProfileData | null; sources?: { shop: string; url: string }[] }

const SIZES = {
  '62x29': { nl: '62 × 29 mm (Brother)', page: '62mm 29mm', w: '62mm', h: '29mm', sheet: false, perPage: 1 },
  '100x50': { nl: '100 × 50 mm (termisch)', page: '100mm 50mm', w: '100mm', h: '50mm', sheet: false, perPage: 1 },
  '100x50-4': { nl: '100 × 50 mm, 4 onder elkaar (Brother 102 mm rol, pagina 100 × 200 mm)', page: '100mm 200mm', w: '100mm', h: '50mm', sheet: false, perPage: 4 },
  'a4-70x37': { nl: 'A4-vel 70 × 37 mm (24 per vel)', page: 'A4', w: '70mm', h: '37mm', sheet: true, perPage: 1 },
} as const;
type Size = keyof typeof SIZES;
/** The drawer label (photo, models, key blade, chip: ShelfLabel) at a LABEL_SIZES size, or the plain price label (`price:` + SIZES). */
const CHOICE_KEY = 'kfc-label-choice';
type Choice = LabelSize | `price:${Size}`;
const DEFAULT_CHOICE: Choice = '100x50-4';
const validChoice = (value: string | null): value is Choice => !!value && (value in LABEL_SIZES || (value.startsWith('price:') && value.slice(6) in SIZES));
function subscribeChoice(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(CHOICE_KEY, callback);
  return () => { window.removeEventListener('storage', callback); window.removeEventListener(CHOICE_KEY, callback); };
}
function readChoice(): Choice {
  try { const saved = localStorage.getItem(CHOICE_KEY); return validChoice(saved) ? saved : DEFAULT_CHOICE; } catch { return DEFAULT_CHOICE; }
}
const noSubscribe = () => () => {};
const code39Safe = (value: string) => /^[A-Z0-9 .$/+%-]+$/.test(value);

/**
 * Shelf and price labels for selected articles: Code 39 of the SKU (the code
 * people read on the drawer; the article code when the SKU cannot be encoded),
 * a QR code to the article 360° page, the shelf location and, for office
 * roles, the shelf price. Printed from a sheet rendered straight under <body>
 * (stockPrint.css hides everything else while it is there).
 */
export default function LabelPrint({ articles, missing = [], showPrice }: { articles: LabelArticle[]; missing?: string[]; showPrice: boolean }) {
  const { english } = usePreviewLanguage();
  const choice = useSyncExternalStore(subscribeChoice, readChoice, () => DEFAULT_CHOICE);
  const drawer = !choice.startsWith('price:');
  const size: Size = drawer ? '62x29' : choice.slice(6) as Size;
  const mounted = useSyncExternalStore(noSubscribe, () => true, () => false);
  const [copies, setCopies] = useState(1);
  const choose = (next: Choice) => { try { localStorage.setItem(CHOICE_KEY, next); } catch { /* private mode: this page only */ } window.dispatchEvent(new Event(CHOICE_KEY)); };
  const spec = SIZES[size];
  const big = size.startsWith('100x50');
  const origin = mounted ? window.location.origin : "";
  const labels = articles.flatMap((a) => Array.from({ length: copies }, (_, i) => ({ ...a, key: `${a.code}-${i}` })));

  const view = (label: (typeof labels)[number], index: number) => {
    const barcode = label.sku && code39Safe(label.sku.toUpperCase()) ? label.sku.toUpperCase() : label.code;
    const qr = <QRCodeSVG value={`${origin}/admin/voorraad/artikel/${encodeURIComponent(label.code)}`} size={big ? 80 : 52} />;
    const price = showPrice && label.price !== null ? euro(label.price) : null;
    // Several labels on one page: a page break after the last of each group, a dashed cut line between them.
    const lastOnPage = (index + 1) % spec.perPage === 0;
    const breakAfter = spec.perPage > 1 ? (lastOnPage ? 'page' : 'auto') : spec.sheet ? 'auto' : 'page';
    const base = { width: spec.w, height: spec.h, boxSizing: 'border-box', overflow: 'hidden', breakAfter, breakInside: 'avoid',
      fontFamily: 'system-ui, sans-serif', color: '#000', background: '#fff',
      borderBottom: spec.perPage > 1 && !lastOnPage ? '0.2mm dashed #999' : undefined } as const;
    // Photos sit in a fixed box: a percentage height let Safari grow the row to the picture and push the label off the page.
    if (big) return (
      <article key={label.key} style={{ ...base, padding: '3mm', display: 'grid', gap: '3mm',
        gridTemplateColumns: label.photo ? '30mm minmax(0, 1fr) 21mm' : 'minmax(0, 1fr) 21mm', gridTemplateRows: 'minmax(0, 1fr)' }}>
        {label.photo && (
          // eslint-disable-next-line @next/next/no-img-element -- print sheet: a plain image, sized in mm
          <img src={label.photo} alt="" style={{ width: '30mm', height: '44mm', objectFit: 'contain', alignSelf: 'center' }} />
        )}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
          <strong style={{ fontSize: '9.5pt', lineHeight: 1.15, maxHeight: '3.45em', overflow: 'hidden' }}>{label.name}</strong>
          <div>
            <div style={{ fontSize: '17pt', fontWeight: 800, letterSpacing: '0.02em', lineHeight: 1.1 }}>{label.sku || label.code}</div>
            {label.location && <div style={{ fontSize: '8.5pt' }}>{label.location}</div>}
          </div>
          <LabelBarcode number={label.number} code={barcode} className="block h-[11mm] w-full" />
          {label.number && <div style={{ fontSize: '8pt', textAlign: 'center', letterSpacing: '0.08em' }}>{label.number}</div>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between' }}>
          {qr}
          {price && <strong style={{ fontSize: '14pt' }}>{price}</strong>}
        </div>
      </article>
    );
    return (
      <article key={label.key} style={{ ...base, padding: '2mm', display: 'grid', gap: '1.5mm',
        gridTemplateColumns: label.photo ? 'auto minmax(0, 1fr) auto' : '1fr auto', gridTemplateRows: 'minmax(0, 1fr)' }}>
        {label.photo && (
          // eslint-disable-next-line @next/next/no-img-element -- print sheet: a plain image, sized in mm
          <img src={label.photo} alt="" style={{ width: '16mm', height: `calc(${spec.h} - 4mm)`, objectFit: 'contain', alignSelf: 'center' }} />
        )}
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, gap: '0.8mm' }}>
          <strong style={{ fontSize: '7.5pt', lineHeight: 1.1, maxHeight: '3.3em', overflow: 'hidden' }}>{label.name}</strong>
          <span style={{ fontSize: '6.5pt' }}>{label.sku || label.code}{label.location ? ` · ${label.location}` : ''}</span>
          <LabelBarcode number={label.number} code={barcode} />
          {label.number && <span style={{ fontSize: '6pt', textAlign: 'center' }}>{label.number}</span>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          {qr}
          {price && <strong style={{ fontSize: '10pt' }}>{price}</strong>}
        </div>
      </article>
    );
  };

  const drawerSize = drawer ? choice as LabelSize : '100x50';
  const shelfLabel = (label: (typeof labels)[number]) => {
    const [shelf = '', box = ''] = label.location.split('/');
    const article = { id: label.code, name: label.name, sku: label.sku, image: label.photo ?? '', category: '', sources: label.sources ?? [] };
    return <ShelfLabel key={label.key} article={article} bin={label.location ? { article: label.code, shelf, box, quantity: 0, minimum: 0 } : undefined}
      code={label.sku && code39Safe(label.sku.toUpperCase()) ? label.sku.toUpperCase() : label.code} number={label.number} profile={label.profile ?? null} size={drawerSize} />;
  };
  const sheet = drawer ? (
    <div className={shelfStyles.printSheet} data-stock-print="" data-size={drawerSize}>
      <style>{`@page { size: ${LABEL_SIZES[drawerSize].page}; margin: 0; }`}</style>
      {labels.map(shelfLabel)}
    </div>
  ) : (
    <div data-stock-print="" className="hidden print:block">
      <style>{`@media print { @page { size: ${spec.page}; margin: ${spec.sheet ? '8mm 0 0 0' : '0'}; } }`}</style>
      <div style={spec.sheet ? { display: 'grid', gridTemplateColumns: 'repeat(3, 70mm)' } : undefined}>
        {labels.map(view)}
      </div>
    </div>
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 print:hidden">
      <h1 className="text-2xl font-medium tracking-tight">{english ? 'Print labels' : 'Etiketten printen'}</h1>
      <div className="bg-card flex flex-wrap items-end gap-3 rounded-xl border p-3">
        <label className="grid gap-1 text-xs font-medium">{english ? 'Label size' : 'Formaat'}
          <select className="border-input bg-background h-9 rounded-md border px-2 text-sm" value={choice} onChange={(e) => choose(e.target.value as Choice)}>
            <optgroup label={english ? 'Drawer label (models, key blade)' : 'Ladelabel (modellen, sleutelbaard)'}>
              {Object.entries(LABEL_SIZES).map(([id, s]) => <option key={id} value={id}>{s.name}</option>)}
            </optgroup>
            <optgroup label={english ? 'Price label' : 'Prijsetiket'}>
              {Object.entries(SIZES).map(([id, s]) => <option key={id} value={`price:${id}`}>{s.nl}</option>)}
            </optgroup>
          </select></label>
        <label className="grid gap-1 text-xs font-medium">{english ? 'Copies each' : 'Aantal per artikel'}
          <input className="border-input bg-background h-9 w-20 rounded-md border px-2 text-sm" type="number" min={1} max={50} value={copies}
            onChange={(e) => setCopies(Math.min(50, Math.max(1, Number(e.target.value) || 1)))} /></label>
        <Button type="button" onClick={() => window.print()} disabled={!labels.length}><Printer aria-hidden="true" />{english ? `Print ${labels.length}` : `${labels.length} printen`}</Button>
      </div>
      {missing.length > 0 && (
        <p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          {english ? `Not found, no label (${missing.length}): ` : `Niet gevonden, geen etiket (${missing.length}): `}<span className="font-mono">{missing.join(', ')}</span>
        </p>
      )}
      {articles.length === 0 && <p className="text-muted-foreground text-sm">{english ? 'No items selected.' : 'Geen artikelen gekozen.'}</p>}
      {labels.length > 0 && (
        <section aria-label={english ? 'Preview' : 'Voorbeeld'} className="grid gap-2">
          <p className="text-muted-foreground text-xs">{english ? 'Preview, real size' : 'Voorbeeld, ware grootte'}{(drawer ? drawerSize === '100x50-4' : spec.perPage > 1) ? (english ? ' · 4 per page' : ' · 4 per pagina') : ''}</p>
          <div className="flex flex-col items-start gap-2 overflow-x-auto rounded-xl border bg-white p-3">
            {drawer ? labels.slice(0, drawerSize === '100x50-4' ? 4 : 2).map(shelfLabel) : labels.slice(0, spec.perPage > 1 ? spec.perPage : 2).map(view)}
          </div>
        </section>
      )}
      <ul className="divide-y rounded-xl border">
        {articles.map((a) => (
          <li key={a.code} className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 text-sm">
            <span><span className="font-mono text-xs">{a.code}</span> · {a.name}</span>
            <span className="text-muted-foreground">{a.sku}{a.location ? ` · ${a.location}` : ''}{showPrice && a.price !== null ? ` · ${euro(a.price, english)}` : ''}</span>
          </li>
        ))}
      </ul>
      {mounted && createPortal(sheet, document.body)}
    </div>
  );
}
