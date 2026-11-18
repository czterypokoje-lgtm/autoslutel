import { QRCodeSVG } from 'qrcode.react';
import type { StockArticle, StockBin } from '@/lib/keyforcarsStock';
import type { ProductProfileData, VehicleFit } from '@/lib/productProfiles';
import { Code39 } from './StockLabel';
import styles from './keyforcars.module.css';

/** `rows`: how many model lines fit; make headings count as a line. */
export const LABEL_SIZES = {
  '62x100': { name: '62 × 100 mm (Brother)', page: '62mm 100mm', rows: 6 },
  '100x50': { name: '100 × 50 mm (termisch)', page: '100mm 50mm', rows: 9 },
  'a4-70x37': { name: 'A4-vel 70 × 37 mm (24 per vel)', page: 'A4', rows: 7 },
} as const;
export type LabelSize = keyof typeof LABEL_SIZES;

const TWO_WORD_MAKE = /^(Alfa Romeo|Land Rover|Aston Martin|Rolls[- ]Royce|Mercedes[- ]Benz)\b/i;

export interface ModelRow { make?: string; model?: string; years?: string }

/**
 * The vehicle list as lines a person reads at the shelf: a make heading, then
 * one model per line with full years ("Brera  2005–2010"). Cut to the rows the
 * label has; the rest is counted and is one QR scan away on the profile.
 */
export function modelRows(fits: VehicleFit[], rows: number) {
  const byMake = new Map<string, { model: string; years: string }[]>();
  for (const fit of fits) {
    if (fit.from === null) continue;
    const make = fit.vehicle.match(TWO_WORD_MAKE)?.[1] ?? fit.vehicle.split(' ')[0];
    const model = fit.vehicle.slice(make.length).trim() || make;
    const years = `${fit.from}–${fit.to ?? ''}`;
    const list = byMake.get(make) ?? [];
    if (!list.some((entry) => entry.model === model && entry.years === years)) list.push({ model, years });
    byMake.set(make, list);
  }
  const total = [...byMake.values()].reduce((sum, list) => sum + list.length, 0);
  const lines: ModelRow[] = [];
  let shown = 0;
  const headings = byMake.size > 1;
  for (const [make, list] of byMake) {
    if (headings) {
      if (lines.length + 2 > rows) break;
      lines.push({ make });
    }
    for (const entry of list) {
      if (lines.length >= rows) break;
      lines.push(headings ? entry : { model: `${make} ${entry.model}`.trim(), years: entry.years });
      shown += 1;
    }
    if (lines.length >= rows) break;
  }
  return { lines, more: total - shown };
}

/**
 * The label that goes on the shelf or drawer. What decides a pick comes
 * first and largest: product number, key blade, then the models with years.
 * Chip, frequency and buttons follow in one line; photo to compare with the
 * part; barcode + QR carry the product number for the scanner.
 */
export default function ShelfLabel({ article, bin, code, profile, size }: {
  article: StockArticle;
  bin?: StockBin;
  code: string;
  profile: ProductProfileData | null;
  size: LabelSize;
}) {
  const facts = profile?.facts;
  const housing = facts?.kind === 'Behuizing';
  // Always printed, with "—" when unknown, so nobody mistakes a gap for "no chip".
  const specs: [string, string][] = [
    [housing ? 'Chip (past)' : 'Chip', facts?.chips.length ? facts.chips.slice(0, 2).join(' / ') : '—'],
    ['Frequentie', facts?.frequency.length ? facts.frequency.slice(0, 2).join(' / ') : '—'],
    ['Knoppen', facts?.buttons ? facts.buttons.replace(/\s*(?:buttons?|knoppen|knops)\s*/i, '') : '—'],
  ];
  const models = profile ? modelRows(profile.fits, LABEL_SIZES[size].rows) : { lines: [], more: 0 };
  const image = profile?.image || article.image;
  const location = [bin?.shelf, bin?.box].filter(Boolean).join(' · ');

  // Every part is a direct child so each size can place it on its own grid.
  return (
    <article className={styles.shelfLabel} data-size={size}>
      {image ? <img className={styles.shelfPhoto} src={image} alt="" referrerPolicy="no-referrer" loading="eager" decoding="sync" /> : <span className={styles.shelfPhoto} />}
      <header className={styles.shelfTitle}>
        <strong className={styles.shelfSku}>{article.sku || article.id}</strong>
        <span className={styles.shelfName}>{profile?.nameNl || article.name}</span>
      </header>

      <div className={styles.shelfBlade}>
        <span>{housing ? 'Sleutelbaard (past)' : 'Sleutelbaard'}</span>
        <strong>{facts?.blade.length ? facts.blade.slice(0, 2).join(' / ') : '—'}</strong>
      </div>
      <dl className={styles.shelfFacts}>
        {specs.map(([name, value]) => <div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}
      </dl>

      <ul className={styles.shelfModels}>
        {models.lines.map((row, index) => row.make
          ? <li key={index} className={styles.shelfMake}>{row.make}</li>
          : <li key={index}><span>{row.model}</span><b>{row.years}</b></li>)}
        {!models.lines.length && <li><span>Modellen: scan QR</span></li>}
        {models.more > 0 && <li className={styles.shelfMore}>+{models.more} meer · scan QR</li>}
      </ul>

      <footer className={styles.shelfCodes}>
        <Code39 code={code} className={styles.shelfBarcode} />
        <span className={styles.shelfMeta}>{code}{location ? ` · ${location}` : ''}</span>
      </footer>
      <QRCodeSVG className={styles.shelfQr} value={code} size={64} marginSize={2} level="M" />
    </article>
  );
}
