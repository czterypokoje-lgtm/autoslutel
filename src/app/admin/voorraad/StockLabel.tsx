import type { StockArticle, StockBin } from '@/lib/keyforcarsStock';
import { QRCodeSVG } from 'qrcode.react';
import styles from './keyforcars.module.css';
import { usePreviewLanguage } from '../PreviewLanguage';

// Full Code 39 set: 9 elements per character, a set bit is a wide bar or space.
const patterns: Record<string, number> = {
  '0': 0x034, '1': 0x121, '2': 0x061, '3': 0x160, '4': 0x031, '5': 0x130, '6': 0x070, '7': 0x025, '8': 0x124, '9': 0x064,
  A: 0x109, B: 0x049, C: 0x148, D: 0x019, E: 0x118, F: 0x058, G: 0x00d, H: 0x10c, I: 0x04c, J: 0x01c,
  K: 0x103, L: 0x043, M: 0x142, N: 0x013, O: 0x112, P: 0x052, Q: 0x007, R: 0x106, S: 0x046, T: 0x016,
  U: 0x181, V: 0x0c1, W: 0x1c0, X: 0x091, Y: 0x190, Z: 0x0d0, '-': 0x085, '.': 0x184, ' ': 0x0c4,
  '$': 0x0a8, '/': 0x0a2, '+': 0x08a, '%': 0x02a, '*': 0x094,
};

/**
 * What the label encodes: the product number (SKU) people already read on the
 * drawers, so a scan and the printed text agree. Only when two catalogue
 * cards share that SKU, or it has characters Code 39 cannot carry, the label
 * falls back to the internal article code, which is always unique.
 */
export function labelCode(article: StockArticle, unique: (sku: string) => boolean) {
  const sku = article.sku.trim().toUpperCase();
  return sku && unique(sku) && [...sku].every((symbol) => symbol in patterns && symbol !== '*') ? sku : article.id;
}

/** A Code 39 barcode as SVG: wide elements three times the narrow ones, ten-module quiet zones. */
export function Code39({ code, className }: { code: string; className?: string }) {
  let position = 14;
  const bars = [...`*${code}*`].flatMap((symbol) => {
    const pattern = patterns[symbol] ?? patterns['-'];
    const character = Array.from({ length: 9 }, (_, element) => {
      const width = pattern & (1 << (8 - element)) ? 3 : 1;
      const x = position;
      position += width;
      return element % 2 === 0 ? <rect key={x} x={x} width={width} height={36} /> : null;
    });
    position += 1;
    return character;
  });
  return (
    <svg className={className} viewBox={`0 0 ${position + 13} 36`} preserveAspectRatio="none" role="img" aria-label={`Code 39: ${code}`}>
      {bars}
    </svg>
  );
}

export default function StockLabel({ article, bin, code = article.id }: { article: StockArticle; bin?: StockBin; code?: string }) {
  const { t } = usePreviewLanguage();
  return (
    <article className={styles.label}>
      <div className={styles.labelDetails}>
        {article.image && <img src={article.image} alt="" referrerPolicy="no-referrer" />}
        <div>
          <span className={styles.labelSku}>{article.sku || article.id}</span>
          <strong>{article.name}</strong>
          <div>{t('Bak')} {bin?.box || '—'} · {t('Locatie')} {bin?.shelf || '—'}</div>
        </div>
      </div>
      <div className={styles.labelCodes}>
        <div>
          <Code39 code={code} className={styles.labelBarcode} />
          <code>{code}</code>
        </div>
        <QRCodeSVG value={code} size={76} marginSize={4} level="M" title={`QR-code: ${code}`} />
      </div>
    </article>
  );
}
