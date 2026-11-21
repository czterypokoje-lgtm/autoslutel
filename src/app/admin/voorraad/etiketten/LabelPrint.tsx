'use client';

import { useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { euro } from '@/lib/kfcReportColumns';
import { Code39 } from '../StockLabel';
import { usePreviewLanguage } from '../../PreviewLanguage';
import '../stockPrint.css';

export interface LabelArticle { code: string; name: string; sku: string; price: number | null; location: string }

const SIZES = {
  '62x29': { nl: '62 × 29 mm (Brother)', page: '62mm 29mm', w: '62mm', h: '29mm', sheet: false },
  '100x50': { nl: '100 × 50 mm (termisch)', page: '100mm 50mm', w: '100mm', h: '50mm', sheet: false },
  'a4-70x37': { nl: 'A4-vel 70 × 37 mm (24 per vel)', page: 'A4', w: '70mm', h: '37mm', sheet: true },
} as const;
type Size = keyof typeof SIZES;
const SIZE_KEY = 'kfc-shelf-label-size';
function subscribeSize(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(SIZE_KEY, callback);
  return () => { window.removeEventListener('storage', callback); window.removeEventListener(SIZE_KEY, callback); };
}
function readSize(): Size {
  try { const saved = localStorage.getItem(SIZE_KEY); return saved && saved in SIZES ? saved as Size : '62x29'; } catch { return '62x29'; }
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
export default function LabelPrint({ articles, showPrice }: { articles: LabelArticle[]; showPrice: boolean }) {
  const { english } = usePreviewLanguage();
  const size = useSyncExternalStore(subscribeSize, readSize, () => '62x29' as Size);
  const mounted = useSyncExternalStore(noSubscribe, () => true, () => false);
  const [copies, setCopies] = useState(1);
  const choose = (next: Size) => { try { localStorage.setItem(SIZE_KEY, next); } catch { /* private mode: this page only */ } window.dispatchEvent(new Event(SIZE_KEY)); };
  const spec = SIZES[size];
  const big = size === '100x50';
  const origin = mounted ? window.location.origin : "";
  const labels = articles.flatMap((a) => Array.from({ length: copies }, (_, i) => ({ ...a, key: `${a.code}-${i}` })));

  const sheet = (
    <div data-stock-print="" className="hidden print:block">
      <style>{`@media print { @page { size: ${spec.page}; margin: ${spec.sheet ? '8mm 0 0 0' : '0'}; } }`}</style>
      <div style={spec.sheet ? { display: 'grid', gridTemplateColumns: 'repeat(3, 70mm)' } : undefined}>
        {labels.map((label) => {
          const barcode = label.sku && code39Safe(label.sku.toUpperCase()) ? label.sku.toUpperCase() : label.code;
          return (
            <article key={label.key} style={{ width: spec.w, height: spec.h, boxSizing: 'border-box', padding: '2mm', overflow: 'hidden', breakAfter: spec.sheet ? 'auto' : 'page',
              display: 'grid', gridTemplateColumns: '1fr auto', gap: '1.5mm', fontFamily: 'system-ui, sans-serif', color: '#000', background: '#fff' }}>
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, gap: '0.8mm' }}>
                <strong style={{ fontSize: big ? '11pt' : '7.5pt', lineHeight: 1.1, maxHeight: '3.3em', overflow: 'hidden' }}>{label.name}</strong>
                <span style={{ fontSize: big ? '9pt' : '6.5pt' }}>{label.sku || label.code}{label.location ? ` · ${label.location}` : ''}</span>
                <Code39 code={barcode} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <QRCodeSVG value={`${origin}/admin/voorraad/artikel/${encodeURIComponent(label.code)}`} size={big ? 90 : 52} />
                {showPrice && label.price !== null && <strong style={{ fontSize: big ? '16pt' : '10pt' }}>{euro(label.price)}</strong>}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 print:hidden">
      <h1 className="text-2xl font-medium tracking-tight">{english ? 'Print labels' : 'Etiketten printen'}</h1>
      <div className="bg-card flex flex-wrap items-end gap-3 rounded-xl border p-3">
        <label className="grid gap-1 text-xs font-medium">{english ? 'Label size' : 'Formaat'}
          <select className="border-input bg-background h-9 rounded-md border px-2 text-sm" value={size} onChange={(e) => choose(e.target.value as Size)}>
            {Object.entries(SIZES).map(([id, s]) => <option key={id} value={id}>{s.nl}</option>)}
          </select></label>
        <label className="grid gap-1 text-xs font-medium">{english ? 'Copies each' : 'Aantal per artikel'}
          <input className="border-input bg-background h-9 w-20 rounded-md border px-2 text-sm" type="number" min={1} max={50} value={copies}
            onChange={(e) => setCopies(Math.min(50, Math.max(1, Number(e.target.value) || 1)))} /></label>
        <Button type="button" onClick={() => window.print()} disabled={!labels.length}><Printer aria-hidden="true" />{english ? `Print ${labels.length}` : `${labels.length} printen`}</Button>
      </div>
      {articles.length === 0 && <p className="text-muted-foreground text-sm">{english ? 'No items selected.' : 'Geen artikelen gekozen.'}</p>}
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
