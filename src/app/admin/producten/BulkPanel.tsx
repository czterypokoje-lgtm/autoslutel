'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../klanten/klanten.module.css';
import jobStyles from '../jobs/jobs.module.css';

export interface CategoryStat {
  category: string;
  total: number;
  hidden: number;
  akey: number;
  akeyHidden: number;
}

/**
 * Which categories are actually car keys.
 *
 * Everything else in this feed is professional equipment — programmers, lockout
 * tools, cylinders — sold to the trade, not to someone standing next to a car
 * that will not start.
 */
const KEY_CATEGORIES = new Set([
  'afstandsbedieningen',
  'smart-keys',
  'sleutelbaarden',
  'behuizingen',
  'transponders',
  'batterijen',
]);

export default function BulkPanel({ stats }: { stats: CategoryStat[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function toggle(category: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  function selectNonKeys() {
    setSelected(new Set(stats.filter((s) => !KEY_CATEGORIES.has(s.category)).map((s) => s.category)));
  }

  async function send(payload: Record<string, unknown>, verb: string) {
    setBusy(true);
    setError('');
    setMessage('');

    const response = await fetch('/api/admin/products/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => null);

    if (!response || !response.ok) {
      const body = await response?.json().catch(() => null);
      setError(body?.error ?? 'Mislukt.');
      setBusy(false);
      return;
    }

    const body = await response.json();
    setMessage(`${body.updated} producten ${verb}.`);
    setSelected(new Set());
    setBusy(false);
    router.refresh();
  }

  /*
   * The action that matters: only the current supplier in the shop.
   *
   * A category selection cannot express this — hiding "afstandsbedieningen"
   * hides A-Key keys along with the old feed's, and showing it brings both
   * back. That is how the shop ended up listing Dutch and English versions of
   * the same kind of product side by side.
   */

  function apply(published: boolean) {
    if (selected.size === 0) return;
    // Scoped to A-Key: a category button must never reach the old feed again.
    return send(
      { categories: [...selected], published },
      published ? 'weer zichtbaar' : 'verborgen'
    );
  }

  const nonKeyHidden = stats
    .filter((s) => !KEY_CATEGORIES.has(s.category))
    .every((s) => s.hidden === s.total);

  return (
    <div className={styles.panel} style={{ marginBottom: 16 }}>
      <h2>Categorieën in- en uitschakelen</h2>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {stats.map((s) => {
          const isKey = KEY_CATEGORIES.has(s.category);
          const allHidden = s.akeyHidden === s.akey && s.akey > 0;
          return (
            <label
              key={s.category}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '7px 11px',
                borderRadius: 8,
                border: `1px solid ${
                  selected.has(s.category) ? 'var(--crm-accent)' : 'var(--crm-rule2)'
                }`,
                background: allHidden ? 'var(--crm-sunk)' : 'var(--crm-bg)',
                fontSize: 13,
                cursor: 'pointer',
                opacity: allHidden ? 0.65 : 1,
              }}
            >
              <input
                type="checkbox"
                checked={selected.has(s.category)}
                onChange={() => toggle(s.category)}
              />
              <span className={styles.strong}>{s.category}</span>
              <span className={styles.sub} style={{ display: 'inline' }}>
                {s.akey} A-Key
                {s.akeyHidden > 0 && ` · ${s.akeyHidden} verborgen`}
              </span>
              {isKey && <span className={`${styles.badge} ${styles.ok}`}>sleutel</span>}
            </label>
          );
        })}
      </div>


      <div className={jobStyles.actions} style={{ marginTop: 0 }}>
        <button className={jobStyles.secondary} onClick={selectNonKeys} disabled={busy}>
          Selecteer alles wat geen sleutel is
        </button>
        <button
          className={jobStyles.primary}
          onClick={() => apply(false)}
          disabled={busy || selected.size === 0}
        >
          {busy ? 'Bezig…' : `Verberg (${selected.size})`}
        </button>
        <button
          className={jobStyles.secondary}
          onClick={() => apply(true)}
          disabled={busy || selected.size === 0}
        >
          Weer tonen ({selected.size})
        </button>
        {message && <span className={styles.note}>{message}</span>}
        {error && <div className={jobStyles.error}>{error}</div>}
      </div>

      <p className={styles.note}>
        Verbergen verwijdert niets. Het product verdwijnt uit de winkel, uit de
        catalogus en uit het afrekenen — ook uit een winkelwagen die iemand nog
        open had staan — maar de regel blijft hier staan en is met één klik
        terug. De leveranciersfeed wordt nooit aangeraakt, want die wordt bij de
        volgende import toch opnieuw opgebouwd.
      </p>
      {nonKeyHidden && (
        <p className={styles.note}>
          Op dit moment staan alleen sleutelproducten in de winkel. Gereedschap,
          sloten en toebehoren zijn verborgen.
        </p>
      )}
    </div>
  );
}
