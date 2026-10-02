import styles from './overzicht.module.css';

const EUR = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

/**
 * The monthly investment, as one quiet line: what this month's jobs have
 * earned against the €500 put in for the month. Starts again on the 1st.
 */
export default function InvestmentBar({
  investment,
  earned,
  jobs,
  monthName,
}: {
  investment: number;
  earned: number;
  jobs: number;
  monthName: string;
}) {
  const pct = Math.min(100, Math.round((earned / investment) * 100));
  const beyond = earned - investment;
  return (
    <section className={styles.invest} aria-label={`Investering ${monthName}`}>
      <div className={styles.investRow}>
        <span className={styles.investTitle}>
          Investering {monthName} <b>{EUR.format(investment)}</b>
        </span>
        <span className={beyond >= 0 ? styles.investWin : styles.investTodo}>
          {beyond >= 0 ? `+ ${EUR.format(beyond)} winst` : `nog ${EUR.format(-beyond)}`}
        </span>
      </div>
      <div className={styles.investBar} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <span style={{ width: `${pct}%` }} className={beyond >= 0 ? styles.investBarDone : undefined} />
      </div>
      <span className={styles.investFoot}>
        {EUR.format(earned)} verdiend in {jobs} {jobs === 1 ? 'klus' : 'klussen'} deze maand · {pct}% terugverdiend
      </span>
    </section>
  );
}
