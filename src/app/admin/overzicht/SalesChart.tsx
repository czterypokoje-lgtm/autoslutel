import type { DayPoint } from './dashboardData';
import styles from './dashboard.module.css';

const EUR = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

/** A clean step for the money axis: 500, 1.000, 2.500, 5.000 … */
function niceMax(v: number): number {
  const steps = [500, 1000, 2000, 2500, 5000, 10000, 20000, 25000, 50000, 100000];
  return steps.find((s) => s >= v) ?? Math.ceil(v / 100000) * 100000;
}

/**
 * Sales per day: revenue as orange bars, gross profit as a navy line, and the
 * number of leads that came in that day printed under each bar. Plain SVG,
 * drawn on the server, so it costs nothing to load.
 */
export default function SalesChart({ data }: { data: DayPoint[] }) {
  const W = 960;
  const H = 280;
  const pad = { l: 60, r: 16, t: 16, b: 52 };
  const w = W - pad.l - pad.r;
  const h = H - pad.t - pad.b;

  const top = niceMax(Math.max(1, ...data.map((d) => Math.max(d.revenue, d.margin))));
  const slot = w / data.length;
  const barW = Math.min(36, slot * 0.62);
  const y = (v: number) => pad.t + h - (Math.max(0, v) / top) * h;
  const x = (i: number) => pad.l + slot * i + slot / 2;

  const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d.margin).toFixed(1)}`).join(' ');
  const totalRevenue = data.reduce((t, d) => t + d.revenue, 0);
  const totalMargin = data.reduce((t, d) => t + d.margin, 0);
  const totalLeads = data.reduce((t, d) => t + d.leads, 0);
  const label = (day: string) => {
    const date = new Date(`${day}T12:00:00Z`);
    return `${date.getUTCDate()}/${date.getUTCMonth() + 1}`;
  };
  const every = data.length > 16 ? 3 : 1;

  return (
    <div className={styles.chartWrap}>
      <div className={styles.chartLegend}>
        <span><i className={styles.legendBar} /> Omzet {EUR.format(totalRevenue)}</span>
        <span><i className={styles.legendLine} /> Brutowinst {EUR.format(totalMargin)}</span>
        <span className={styles.muted}>Getal onder de balk = leads die dag · totaal {totalLeads}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.chart} role="img" aria-label={`Omzet en winst per dag, laatste ${data.length} dagen`}>
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <g key={f}>
            <line x1={pad.l} x2={W - pad.r} y1={y(top * f)} y2={y(top * f)} stroke="#eef1f5" />
            <text x={pad.l - 8} y={y(top * f) + 4} textAnchor="end" fontSize="11" fill="#5b6880">
              {EUR.format(top * f)}
            </text>
          </g>
        ))}
        {data.map((d, i) => (
          <g key={d.day}>
            <rect
              x={x(i) - barW / 2}
              y={y(d.revenue)}
              width={barW}
              height={Math.max(0, pad.t + h - y(d.revenue))}
              rx="4"
              fill={i === data.length - 1 ? '#c2410c' : '#f0a77f'}
            >
              <title>{`${label(d.day)}: omzet ${EUR.format(d.revenue)}, winst ${EUR.format(d.margin)}, ${d.leads} leads`}</title>
            </rect>
            {i % every === 0 && (
              <text x={x(i)} y={H - pad.b + 18} textAnchor="middle" fontSize="11" fill="#5b6880">
                {label(d.day)}
              </text>
            )}
            <text x={x(i)} y={H - pad.b + 36} textAnchor="middle" fontSize="11" fontWeight="600" fill={d.leads ? '#24364f' : '#c5ccd8'}>
              {d.leads}
            </text>
          </g>
        ))}
        <path d={line} fill="none" stroke="#24364f" strokeWidth="2.5" strokeLinejoin="round" />
        {data.map((d, i) => (
          <circle key={d.day} cx={x(i)} cy={y(d.margin)} r="3.5" fill="#24364f" />
        ))}
      </svg>
    </div>
  );
}
