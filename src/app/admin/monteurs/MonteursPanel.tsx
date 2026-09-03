'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../jobs/jobs.module.css';

export interface Technician {
  id: string;
  name: string;
  phone: string | null;
  active: boolean;
  werkgebied: string[] | null;
  color: string | null;
  user_id: string | null;
}

interface CrmUser {
  id: string;
  email: string;
}

const COLOURS = ['#2c4a63', '#c2410c', '#186b4b', '#6b21a8', '#8a5804', '#9d201c'];

export default function MonteursPanel({
  technicians,
}: {
  technicians: Technician[];
}) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [werkgebied, setWerkgebied] = useState('');
  const [colour, setColour] = useState(COLOURS[0]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  /*
   * Accounts with the monteur role that can be linked to a record here.
   * Without the link the van screen has no way to tell whose jobs are whose,
   * so this list is what makes fase 3 usable at all.
   */
  const [users, setUsers] = useState<CrmUser[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/crm-users')
      .then((r) => (r.ok ? r.json() : { users: [] }))
      .then((body) => {
        if (!cancelled) setUsers(body.users ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  async function link(technicianId: string, userId: string) {
    await fetch(`/api/admin/technicians/${technicianId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId || null }),
    }).catch(() => null);
    router.refresh();
  }

  async function add(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');

    const response = await fetch('/api/admin/technicians', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, werkgebied, color: colour }),
    }).catch(() => null);

    if (!response || !response.ok) {
      const body = await response?.json().catch(() => null);
      setError(body?.error ?? 'Opslaan mislukt.');
      setSaving(false);
      return;
    }

    setName('');
    setPhone('');
    setWerkgebied('');
    setSaving(false);
    router.refresh();
  }

  async function toggle(technician: Technician) {
    await fetch(`/api/admin/technicians/${technician.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !technician.active }),
    }).catch(() => null);
    router.refresh();
  }

  return (
    <div className={styles.planWrap}>
      <div className={styles.panel}>
        <h2>Team</h2>
        {technicians.length === 0 ? (
          <p className={styles.note}>
            Nog geen monteurs. Zonder monteurs heeft de dagweergave geen kolommen
            en kan een klus alleen ongepland blijven staan.
          </p>
        ) : (
          technicians.map((t) => (
            <div key={t.id} className={styles.suggestion}>
              <span
                className={styles.dot}
                style={{ background: t.color ?? '#2c4a63' }}
              />
              <span>
                <span className={styles.suggestionName}>{t.name}</span>
                <span className={styles.suggestionWhy}>
                  {t.phone ?? 'geen telefoon'} ·{' '}
                  {t.werkgebied && t.werkgebied.length > 0
                    ? t.werkgebied.join(', ')
                    : 'geen werkgebied'}
                </span>
              </span>
              <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                <select
                  className={styles.control}
                  style={{ width: 'auto', minWidth: 150 }}
                  value={t.user_id ?? ''}
                  onChange={(e) => link(t.id, e.target.value)}
                  aria-label={`Login koppelen aan ${t.name}`}
                >
                  <option value="">Geen login</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.email}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className={styles.secondary}
                  onClick={() => toggle(t)}
                >
                  {t.active ? 'Non-actief' : 'Activeren'}
                </button>
              </span>
            </div>
          ))
        )}
      </div>

      <form className={styles.panel} onSubmit={add}>
        <h2>Monteur toevoegen</h2>

        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="nm">Naam</label>
          <input
            id="nm"
            className={styles.control}
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className={styles.field} style={{ marginTop: 10 }}>
          <label className={styles.fieldLabel} htmlFor="ph">Telefoon</label>
          <input
            id="ph"
            className={styles.control}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className={styles.field} style={{ marginTop: 10 }}>
          <label className={styles.fieldLabel} htmlFor="wg">
            Werkgebied (postcodereeksen)
          </label>
          <input
            id="wg"
            className={styles.control}
            placeholder="3500-3599, 1000-1099"
            value={werkgebied}
            onChange={(e) => setWerkgebied(e.target.value)}
          />
        </div>

        <div className={styles.field} style={{ marginTop: 10 }}>
          <span className={styles.fieldLabel}>Kleur in de agenda</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {COLOURS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Kleur ${c}`}
                onClick={() => setColour(c)}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 6,
                  background: c,
                  border:
                    colour === c ? '2px solid var(--crm-ink)' : '1px solid var(--crm-rule2)',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.primary} type="submit" disabled={saving}>
            {saving ? 'Opslaan…' : 'Toevoegen'}
          </button>
          {error && <div className={styles.error}>{error}</div>}
        </div>

        <p className={styles.note}>
          Het werkgebied stuurt het monteurvoorstel bij het inplannen: de eerste
          vier cijfers van de postcode bepalen de regio. Laat het leeg en de
          monteur wordt nog steeds voorgesteld, alleen lager.
        </p>
        <p className={styles.note}>
          De keuzelijst naast elke monteur koppelt een login aan de persoon.
          Alleen accounts met de rol <code>monteur</code> staan erin — maak die
          eerst aan met{' '}
          <code>node scripts/crm-user.mjs naam@… monteur</code>. Zonder koppeling
          blijft het scherm &ldquo;Vandaag&rdquo; leeg voor die monteur.
        </p>
      </form>
    </div>
  );
}
