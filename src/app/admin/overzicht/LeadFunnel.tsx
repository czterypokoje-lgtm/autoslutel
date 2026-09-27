import styles from './dashboard.module.css';

/**
 * Where leads stop.
 *
 * Four stages, each showing what is left of the original intake. The bar
 * heights carry the drop-off before any percentage is read — which is the
 * point: the number that matters here is not how many were won, it is where
 * the fall happens.
 *
 * Mapped from the six statuses the table actually holds:
 *   new                     → Binnen
 *   contacted, qualified    → In behandeling
 *   sold                    → Gewonnen
 *   rejected, duplicate     → Verloren
 *
 * Percentages are of total intake, not of the previous stage, so the four
 * numbers can be compared to each other directly.
 */

export interface FunnelCounts {
  new: number;
  working: number;
  lost: number;
  won: number;
}

export function countFunnel(statuses: (string | null)[]): FunnelCounts {
  const counts = { new: 0, working: 0, lost: 0, won: 0 };
  for (const status of statuses) {
    if (status === 'new') counts.new += 1;
    else if (status === 'contacted' || status === 'qualified') counts.working += 1;
    else if (status === 'sold') counts.won += 1;
    else if (status === 'rejected' || status === 'duplicate') counts.lost += 1;
  }
  return counts;
}

export default function LeadFunnel({ counts }: { counts: FunnelCounts }) {
  const total = counts.new + counts.working + counts.lost + counts.won;

  const stages = [
    { label: 'Binnen', value: total, tone: 'var(--crm-steel)' },
    { label: 'In behandeling', value: counts.working, tone: 'var(--crm-steel)' },
    { label: 'Verloren', value: counts.lost, tone: 'var(--crm-stop)' },
    { label: 'Gewonnen', value: counts.won, tone: 'var(--crm-ok)' },
  ];

  return (
    <div className={styles.funnel}>
      {stages.map((stage) => {
        const share = total > 0 ? stage.value / total : 0;
        return (
          <div key={stage.label} className={styles.funnelStage}>
            <div className={styles.funnelCount}>{stage.value}</div>
            <div className={styles.funnelPct}>{Math.round(share * 100)}%</div>
            <div className={styles.funnelBar}>
              <div
                className={styles.funnelFill}
                style={{ height: `${Math.max(share * 100, 2)}%`, background: stage.tone }}
              />
            </div>
            <div className={styles.funnelLabel}>{stage.label}</div>
          </div>
        );
      })}
    </div>
  );
}
