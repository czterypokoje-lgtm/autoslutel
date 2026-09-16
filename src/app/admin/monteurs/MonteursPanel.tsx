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
  const [password, setPassword] = useState('');
  const [colour, setColour] = useState(COLOURS[0]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  /** Shown once after an invite, then gone — nothing stores it. */
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  /** Set when a password was typed directly instead of using a link. */
  const [passwordConfirmed, setPasswordConfirmed] = useState<string | null>(null);

  /* Per-technician "set password directly" for an already-existing login. */
  const [resetId, setResetId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetSaving, setResetSaving] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetDone, setResetDone] = useState<{ id: string; password: string } | null>(null);

  /* Inline edit — which technician's row is open, and its draft fields. */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editWerkgebied, setEditWerkgebied] = useState('');
  const [editColour, setEditColour] = useState(COLOURS[0]);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  /*
   * Accounts with the monteur role that can be linked to a record here.
   * Without the link the van screen has no way to tell whose jobs are whose,
   * so this list is what makes fase 3 usable at all.
   */
  const [users, setUsers] = useState<CrmUser[]>([]);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

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
      body: JSON.stringify({ name, email, color: colour, password: password || undefined }),
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
    if (created?.passwordSet) {
      setPasswordConfirmed(password);
      setInviteLink(null);
    } else {
      setInviteLink(created?.inviteLink ?? null);
      setPasswordConfirmed(null);
    }

    setName('');
    setEmail('');
    setPassword('');
    setSaving(false);
    router.refresh();
  }

  async function setTechnicianPassword(technicianId: string) {
    setResetError('');
    if (resetPassword.length < 8) {
      setResetError('Wachtwoord moet minimaal 8 tekens zijn.');
      return;
    }
    setResetSaving(true);

    const response = await fetch(`/api/admin/technicians/${technicianId}/set-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: resetPassword }),
    }).catch(() => null);

    setResetSaving(false);
    if (!response || !response.ok) {
      const body = await response?.json().catch(() => null);
      setResetError(body?.error ?? 'Opslaan mislukt.');
      return;
    }

    setResetDone({ id: technicianId, password: resetPassword });
    setResetId(null);
    setResetPassword('');
  }

  async function toggle(technician: Technician) {
    await fetch(`/api/admin/technicians/${technician.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !technician.active }),
    }).catch(() => null);
    router.refresh();
  }

  function startEdit(technician: Technician) {
    setEditingId(technician.id);
    setEditName(technician.name);
    setEditPhone(technician.phone ?? '');
    setEditWerkgebied((technician.werkgebied ?? []).join(', '));
    setEditColour(technician.color ?? COLOURS[0]);
    setEditError('');
  }

  async function saveEdit(id: string) {
    setEditSaving(true);
    setEditError('');

    const response = await fetch(`/api/admin/technicians/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editName,
        phone: editPhone || null,
        werkgebied: editWerkgebied,
        color: editColour,
      }),
    }).catch(() => null);

    if (!response || !response.ok) {
      const body = await response?.json().catch(() => null);
      setEditError(body?.error ?? 'Opslaan mislukt.');
      setEditSaving(false);
      return;
    }

    setEditSaving(false);
    setEditingId(null);
    router.refresh();
  }

  async function remove(technician: Technician) {
    if (
      !window.confirm(
        `${technician.name} definitief verwijderen? Klussen blijven bestaan, maar worden ongepland — dit kan niet ongedaan worden gemaakt.`
      )
    ) {
      return;
    }

    setDeletingId(technician.id);
    const response = await fetch(`/api/admin/technicians/${technician.id}`, {
      method: 'DELETE',
    }).catch(() => null);

    setDeletingId(null);
    if (!response || !response.ok) {
      const body = await response?.json().catch(() => null);
      window.alert(body?.error ?? 'Verwijderen mislukt.');
      return;
    }
    router.refresh();
  }

  async function removeLogin(user: CrmUser) {
    if (
      !window.confirm(
        `Login ${user.email} definitief verwijderen? Elke monteur die hiermee gekoppeld is verliest zijn login. Het e-mailadres komt daarna weer vrij voor een nieuwe uitnodiging.`
      )
    ) {
      return;
    }

    setDeletingUserId(user.id);
    const response = await fetch(`/api/admin/crm-users/${user.id}`, {
      method: 'DELETE',
    }).catch(() => null);

    setDeletingUserId(null);
    if (!response || !response.ok) {
      const body = await response?.json().catch(() => null);
      window.alert(body?.error ?? 'Verwijderen mislukt.');
      return;
    }
    setUsers((current) => current.filter((u) => u.id !== user.id));
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
          technicians.map((t) =>
            editingId === t.id ? (
              <div key={t.id} className={styles.suggestion} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Naam</label>
                  <input
                    className={styles.control}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Telefoon</label>
                  <input
                    className={styles.control}
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Werkgebied (postcodes, komma-gescheiden)</label>
                  <input
                    className={styles.control}
                    placeholder="1000, 1010-1099, 3500"
                    value={editWerkgebied}
                    onChange={(e) => setEditWerkgebied(e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>Kleur</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {COLOURS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        aria-label={`Kleur ${c}`}
                        onClick={() => setEditColour(c)}
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 6,
                          background: c,
                          border: editColour === c ? '2px solid var(--crm-ink)' : '1px solid var(--crm-rule2)',
                          cursor: 'pointer',
                        }}
                      />
                    ))}
                  </div>
                </div>
                {editError && <div className={styles.error}>{editError}</div>}
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.primary}
                    disabled={editSaving}
                    onClick={() => saveEdit(t.id)}
                  >
                    {editSaving ? 'Opslaan…' : 'Opslaan'}
                  </button>
                  <button
                    type="button"
                    className={styles.secondary}
                    onClick={() => setEditingId(null)}
                  >
                    Annuleren
                  </button>
                </div>
              </div>
            ) : (
              <div key={t.id} className={styles.suggestion}>
                <span
                  className={styles.dot}
                  style={{ background: technicianColour(t.color) }}
                />
                <span>
                  <a className={styles.suggestionName} href={`/admin/monteurs/${t.id}`}>
                    {t.name}
                  </a>
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
                  <button
                    type="button"
                    className={styles.secondary}
                    onClick={() => startEdit(t)}
                  >
                    Bewerken
                  </button>
                  {t.user_id && (
                    <button
                      type="button"
                      className={styles.secondary}
                      onClick={() => {
                        setResetId(t.id);
                        setResetPassword('');
                        setResetError('');
                        setResetDone(null);
                      }}
                    >
                      Wachtwoord
                    </button>
                  )}
                  <button
                    type="button"
                    className={styles.secondary}
                    disabled={deletingId === t.id}
                    onClick={() => remove(t)}
                  >
                    {deletingId === t.id ? 'Verwijderen…' : 'Verwijderen'}
                  </button>
                </span>
                {resetId === t.id && (
                  <div className={styles.field} style={{ flexBasis: '100%', marginTop: 8 }}>
                    <label className={styles.fieldLabel}>Nieuw wachtwoord voor {t.name}</label>
                    <input
                      type="text"
                      className={styles.control}
                      placeholder="Minimaal 8 tekens"
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      autoFocus
                    />
                    {resetError && <div className={styles.error}>{resetError}</div>}
                    <div className={styles.actions} style={{ marginTop: 6 }}>
                      <button
                        type="button"
                        className={styles.primary}
                        disabled={resetSaving}
                        onClick={() => setTechnicianPassword(t.id)}
                      >
                        {resetSaving ? 'Opslaan…' : 'Wachtwoord instellen'}
                      </button>
                      <button
                        type="button"
                        className={styles.secondary}
                        onClick={() => setResetId(null)}
                      >
                        Annuleren
                      </button>
                    </div>
                  </div>
                )}
                {resetDone?.id === t.id && (
                  <div className={styles.note} style={{ flexBasis: '100%', marginTop: 8, display: 'grid', gap: 6 }}>
                    <strong>Nieuw wachtwoord — geef dit door aan {t.name}.</strong>
                    <input
                      className={styles.control}
                      readOnly
                      value={resetDone.password}
                      onFocus={(event) => event.currentTarget.select()}
                      style={{ width: '100%', fontFamily: 'ui-monospace, monospace', fontSize: 12 }}
                    />
                  </div>
                )}
              </div>
            )
          )
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
          <label className={styles.fieldLabel} htmlFor="pw">
            Wachtwoord (optioneel — leeg voor een link per e-mail/WhatsApp)
          </label>
          <input
            id="pw"
            type="text"
            className={styles.control}
            placeholder="Minimaal 8 tekens"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span style={{ fontSize: 12, color: 'var(--crm-muted)' }}>
            Ingevuld? Dan wordt de link overgeslagen en kan de monteur direct
            inloggen met dit wachtwoord — handig als de link-e-mail niet aankomt.
          </span>
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

        {passwordConfirmed && (
          <div className={styles.note} style={{ display: 'grid', gap: 8 }}>
            <strong>Account aangemaakt — geef dit wachtwoord door aan de monteur.</strong>
            <input
              className={styles.control}
              readOnly
              value={passwordConfirmed}
              onFocus={(event) => event.currentTarget.select()}
              style={{ width: '100%', fontFamily: 'ui-monospace, monospace', fontSize: 12 }}
            />
            <span style={{ fontSize: 12, color: 'var(--crm-muted)' }}>
              Ook dit wordt nergens bewaard — na deze melding is het weg.
            </span>
          </div>
        )}

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

      {users.length > 0 && (
        <div className={styles.panel}>
          <h2>Logins</h2>
          <p className={styles.note}>
            Elke monteur-login, gekoppeld of niet. Een e-mailadres kan pas opnieuw
            gebruikt worden voor een uitnodiging nadat de oude login hier is
            verwijderd — Supabase staat geen dubbel e-mailadres toe.
          </p>
          {users.map((u) => (
            <div key={u.id} className={styles.suggestion}>
              <span>{u.email}</span>
              <span className={styles.suggestionActions}>
                <button
                  type="button"
                  className={styles.secondary}
                  disabled={deletingUserId === u.id}
                  onClick={() => removeLogin(u)}
                >
                  {deletingUserId === u.id ? 'Verwijderen…' : 'Verwijderen'}
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
