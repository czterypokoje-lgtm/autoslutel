import type { ReactNode } from 'react';
import styles from './charts.module.css';

/**
 * The charts, hand-authored as SVG.
 *
 * No charting library. Four shapes are needed here — a line, a bar row, a
 * ring, a mini bar — and a library would ship 150 kB to a technician on a
 * phone in a van to draw them, along with a default palette that fights the
 * one this CRM already has.
 *
 * Every one of these renders nothing rather than something when it has no
 * data. A chart that draws a flat line through zero looks like a measurement;
 * an empty state says what is true, which is that there is nothing yet.
 */

const PALETTE = [
  'var(--crm-data-1)',
  'var(--crm-data-2)',
  'var(--crm-data-3)',
  'var(--crm-data-4)',
  'var(--crm-data-5)',
  'var(--crm-data-6)',
];

/* ── the highlight card ─────────────────────────────────────────────── */

export function HighlightCard({
  label,
  value,
  delta,
  tint,
}: {
  label: string;
  value: ReactNode;
  /** Percentage against the previous period, or null when there is none. */
  delta: number | null;
  /** Alternating tint, as in the reference: accented, quiet, accented, quiet. */
  tint?: boolean;
}) {
  return (
    <div className={`${styles.highlight} ${tint ? styles.highlightTint : ''}`}>
      <span className={styles.highlightLabel}>{label}</span>
      <div className={styles.highlightRow}>
        <span className={styles.highlightValue}>{value}</span>
        {delta !== null && (
          <span className={styles.highlightDelta}>
            {delta >= 0 ? '+' : ''}
            {delta.toFixed(2)}%
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {delta >= 0 ? (
                <><path d="M3 17 9 11l4 4 8-8" /><path d="M17 7h4v4" /></>
              ) : (
                <><path d="M3 7 9 13l4-4 8 8" /><path d="M17 17h4v-4" /></>
              )}
            </svg>
          </span>
        )}
      </div>
    </div>
  );
}

/* ── line chart ─────────────────────────────────────────────────────── */

export interface Series {
  label: string;
  points: number[];
  /** Drawn dashed, for the comparison period. */
  dashed?: boolean;
}

/** A smooth path through the points, in the 0..1 space of the plot area. */
function smoothPath(points: number[], max: number, width: number, height: number): string {
  if (points.length < 2) return '';
  const step = width / (points.length - 1);
  const y = (value: number) => height - (max > 0 ? value / max : 0) * height;

  let path = `M 0 ${y(points[0]).toFixed(2)}`;
  for (let i = 1; i < points.length; i++) {
    const x0 = (i - 1) * step;
    const x1 = i * step;
    // A Catmull-Rom-ish control pair: enough curve to read as a trend, not so
    // much that a flat month looks like a dip.
    const cx = x0 + step / 2;
    path += ` C ${cx.toFixed(2)} ${y(points[i - 1]).toFixed(2)}, ${cx.toFixed(2)} ${y(points[i]).toFixed(2)}, ${x1.toFixed(2)} ${y(points[i]).toFixed(2)}`;
  }
  return path;
}

export function LineChart({
  series,
  labels,
  format = (v) => String(Math.round(v)),
}: {
  series: Series[];
  labels: string[];
  format?: (value: number) => string;
}) {
  const all = series.flatMap((s) => s.points);
  const peak = Math.max(...all, 0);
  if (!all.length || peak <= 0) {
    return <div className={styles.chartEmpty}>Nog niets te tonen.</div>;
  }

  /* Round the axis up to something a person would say out loud. */
  const magnitude = 10 ** Math.floor(Math.log10(peak));
  const max = Math.ceil(peak / magnitude) * magnitude;

  const W = 720;
  const H = 260;

  return (
    <div className={styles.chartWrap}>
      <svg
        viewBox={`0 0 ${W + 56} ${H + 34}`}
        className={styles.chart}
        role="img"
        aria-label={`${series.map((s) => s.label).join(' en ')} per maand`}
      >
        {/* the axis, three lines and their values */}
        {[1, 0.5, 0].map((fraction) => {
          const y = H - fraction * H;
          return (
            <g key={fraction}>
              <line x1="56" y1={y} x2={W + 56} y2={y} className={styles.grid} />
              <text x="46" y={y + 4} className={styles.axis} textAnchor="end">
                {format(max * fraction)}
              </text>
            </g>
          );
        })}

        <g transform="translate(56, 0)">
          {series.map((one, index) => (
            <path
              key={one.label}
              d={smoothPath(one.points, max, W, H)}
              className={one.dashed ? styles.lineDashed : styles.line}
              style={{ stroke: index === 0 ? 'var(--crm-data-4)' : 'var(--crm-muted)' }}
            />
          ))}
        </g>

        {labels.map((label, index) => (
          <text
            key={label}
            x={56 + (index * W) / Math.max(1, labels.length - 1)}
            y={H + 24}
            className={styles.axis}
            textAnchor="middle"
          >
            {label}
          </text>
        ))}
      </svg>
    </div>
  );
}

export function Legend({ items }: { items: { label: string; dashed?: boolean }[] }) {
  return (
    <div className={styles.legend}>
      {items.map((item, index) => (
        <span key={item.label} className={styles.legendItem}>
          <span
            className={styles.legendDot}
            style={{ background: index === 0 ? 'var(--crm-data-4)' : 'var(--crm-muted)' }}
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}

/* ── bars ───────────────────────────────────────────────────────────── */

export function BarChart({
  bars,
  format = (v) => String(Math.round(v)),
}: {
  bars: { label: string; value: number }[];
  format?: (value: number) => string;
}) {
  const peak = Math.max(...bars.map((b) => b.value), 0);
  if (!bars.length || peak <= 0) return <div className={styles.chartEmpty}>Nog niets te tonen.</div>;

  const magnitude = 10 ** Math.floor(Math.log10(peak));
  const max = Math.ceil(peak / magnitude) * magnitude;

  return (
    <div className={styles.bars}>
      <div className={styles.barAxis}>
        {[1, 0.5, 0].map((fraction) => (
          <span key={fraction}>{format(max * fraction)}</span>
        ))}
      </div>
      <div className={styles.barPlot}>
        {bars.map((bar, index) => (
          <div key={bar.label} className={styles.barCol} title={`${bar.label}: ${format(bar.value)}`}>
            <div
              className={styles.bar}
              style={{
                height: `${(bar.value / max) * 100}%`,
                background: PALETTE[index % PALETTE.length],
              }}
            />
            <span className={styles.barLabel}>{bar.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** The label-plus-mini-bar list, for a ranking that fits beside a chart. */
export function RankedBars({
  rows,
  format,
}: {
  rows: { label: string; value: number }[];
  format: (value: number) => string;
}) {
  const peak = Math.max(...rows.map((r) => r.value), 0);
  if (!rows.length || peak <= 0) return <div className={styles.chartEmpty}>Nog geen gegevens.</div>;

  return (
    <div className={styles.ranked}>
      {rows.map((row) => (
        <div key={row.label} className={styles.rankedRow}>
          <span className={styles.rankedLabel}>{row.label}</span>
          <span className={styles.rankedTrack}>
            <span className={styles.rankedFill} style={{ width: `${(row.value / peak) * 100}%` }} />
          </span>
          <span className={styles.rankedValue}>{format(row.value)}</span>
        </div>
      ))}
    </div>
  );
}

/* ── ring ───────────────────────────────────────────────────────────── */

export function Donut({
  slices,
  format,
}: {
  slices: { label: string; value: number }[];
  format: (value: number) => string;
}) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  if (!slices.length || total <= 0) return <div className={styles.chartEmpty}>Nog geen gegevens.</div>;

  const R = 60;
  const STROKE = 22;
  const circumference = 2 * Math.PI * R;
  let offset = 0;

  return (
    <div className={styles.donutWrap}>
      <svg viewBox="0 0 160 160" className={styles.donut} role="img" aria-label="Verdeling">
        <g transform="translate(80,80) rotate(-90)">
          {slices.map((slice, index) => {
            const fraction = slice.value / total;
            const dash = fraction * circumference;
            const element = (
              <circle
                key={slice.label}
                r={R}
                fill="none"
                strokeWidth={STROKE}
                stroke={PALETTE[index % PALETTE.length]}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
            offset += dash;
            return element;
          })}
        </g>
      </svg>

      <div className={styles.donutKey}>
        {slices.map((slice, index) => (
          <div key={slice.label} className={styles.donutKeyRow}>
            <span className={styles.legendDot} style={{ background: PALETTE[index % PALETTE.length] }} />
            <span className={styles.donutKeyLabel}>{slice.label}</span>
            <span className={styles.donutKeyValue}>
              {((slice.value / total) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const chart = styles;
