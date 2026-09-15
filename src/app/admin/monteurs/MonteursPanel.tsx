'use client';

import { useEffect, useState } from 'react';
import { waLink } from '@/lib/whatsapp';
import { useRouter } from 'next/navigation';
import styles from '../jobs/jobs.module.css';
import { TECHNICIAN_COLOURS, technicianColour } from '@/lib/crmColours';

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

const COLOURS = TECHNICIAN_COLOURS;

export default function MonteursPanel({
  technicians,
}: {
  technicians: Technician[];
}) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [colour, setColour] = useState(COLOURS[0]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  /** Shown once after an invite, then gone — nothing stores it. */
  const [inviteLink, setInviteLink] = useState<string | null>(null);

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

    const response = await fetch('/api/admin/invite-technician', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, color: colour }),
    }).catch(() => null);

    if (!response || !response.ok) {
      const body = await response?.json().catch(() => null);
      setError(body?.error ?? 'Opslaan mislukt.');
      setSaving(false);
      return;
    }

    /*
     * The link is shown once and stored nowhere. Losing it means inviting
     * again, which is the correct trade: a one-time link that can be looked up
     * later is a password with extra steps.
     */
    const created = await response.json().catch(() => null);
    setInviteLink(created?.inviteLink ?? null);

    setName('');
    setEmail('');
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
                style={{ background: technicianColour(t.color) }}
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
              <span className={styles.suggestionActions}>
                {/*
                  Opens WhatsApp on the monteur's number. A link rather than an
                  integration: the Business Platform wants a verified Meta
                  business, a number that is not in the WhatsApp app, and a fee
                  per conversation. This works today and costs nothing.
                */}
                {waLink(t.phone, 'Hoi ') && (
                  <a
                    className={styles.control}
                    style={{ width: 'auto', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    href={waLink(t.phone, 'Hoi ')!}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`WhatsApp ${t.name}`}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    App
                  </a>
                )}
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
        <h2>Monteur uitnodigen</h2>

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
          <label className={styles.fieldLabel} htmlFor="em">E-mailadres</label>
          <input
            id="em"
            type="email"
            className={styles.control}
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            {saving ? 'Uitnodigen…' : 'Uitnodiging versturen'}
          </button>
          {error && <div className={styles.error}>{error}</div>}
        </div>

        {inviteLink && (
          <div className={styles.note} style={{ display: 'grid', gap: 8 }}>
            <strong>Uitnodiging klaar — stuur deze link naar de monteur.</strong>
            <input
              className={styles.control}
              readOnly
              value={inviteLink}
              onFocus={(event) => event.currentTarget.select()}
              style={{ width: '100%', fontFamily: 'ui-monospace, monospace', fontSize: 12 }}
            />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                className={styles.control}
                style={{ width: 'auto', cursor: 'pointer' }}
                onClick={() => navigator.clipboard?.writeText(inviteLink)}
              >
                Link kopiëren
              </button>
              <a
                className={styles.control}
                style={{ width: 'auto', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Welkom bij Autosleutel24. Stel hier je wachtwoord in en vul je gegevens aan: ${inviteLink}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Via WhatsApp sturen
              </a>
            </div>
            <span style={{ fontSize: 12, color: 'var(--crm-muted)' }}>
              De link is eenmalig en wordt nergens bewaard. Kwijt? Nodig opnieuw uit.
            </span>
          </div>
        )}

        <p className={styles.note}>
          De monteur stelt zelf een wachtwoord in via de link. Daarna doorlopen ze een
          wizard voor telefoonnummer, werkgebied en welke auto’s ze aankunnen — zonder
          dat laatste krijgen ze geen klussen aangeboden.
        </p>
      </form>
    </div>
  );
}
