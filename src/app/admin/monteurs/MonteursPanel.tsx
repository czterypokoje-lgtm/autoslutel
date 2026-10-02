'use client';

import { useEffect, useState } from 'react';
import { waLink } from '@/lib/whatsapp';
import { useRouter } from 'next/navigation';
import styles from '../jobs/jobs.module.css';
import m from './monteurs.module.css';
import { TECHNICIAN_COLOURS, technicianColour } from '@/lib/crmColours';

export interface Technician {
  id: string;
  name: string;
  phone: string | null;
  active: boolean;
  werkgebied: string[] | null;
  color: string | null;
  user_id: string | null;
  photo_url?: string | null;
  online?: boolean | null;
  employment_type?: string | null;
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
    <div className={m.layout}>
      <div className={m.team}>
        {technicians.length === 0 ? (
          <p className={styles.note}>
            Nog geen monteurs. Zonder monteurs heeft de dagweergave geen kolommen
            en kan een klus alleen ongepland blijven staan.
          </p>
        ) : (
          technicians.map((t) =>
            editingId === t.id ? (
              <div key={t.id} className={`${m.card} ${m.editCard}`}>
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
                  <div className={m.swatches}>
                    {COLOURS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        aria-label={`Kleur ${c}`}
                        aria-pressed={editColour === c}
                        onClick={() => setEditColour(c)}
                        className={editColour === c ? m.swatchOn : m.swatch}
                        style={{ background: c }}
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
              <div key={t.id} className={t.active ? m.card : `${m.card} ${m.cardOff}`}>
                <div className={m.cardTop}>
                  {t.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.photo_url} alt="" className={m.avatar} />
                  ) : (
                    <span className={m.avatarInitial} style={{ background: technicianColour(t.color) }}>
                      {t.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className={m.name}>
                    <a href={`/admin/monteurs/${t.id}`}>{t.name}</a>
                    <span>{t.phone ?? 'geen telefoon'}</span>
                  </div>
                  <span className={m.colourDot} style={{ background: technicianColour(t.color) }} title="Kleur in de agenda" />
                </div>

                <div className={m.badges}>
                  {!t.active && <span className={`${m.badge} ${m.badgeOff}`}>Non-actief</span>}
                  {t.active && t.online && <span className={`${m.badge} ${m.badgeOn}`}>Op dienst</span>}
                  {t.employment_type && <span className={m.badge}>{t.employment_type === 'zzp' ? 'ZZP' : 'Loondienst'}</span>}
                  <span className={t.user_id ? m.badge : `${m.badge} ${m.badgeWarn}`}>{t.user_id ? 'Kan inloggen' : 'Geen login'}</span>
                </div>

                <div className={m.areas}>
                  {t.werkgebied && t.werkgebied.length > 0 ? (
                    t.werkgebied.slice(0, 6).map((w) => (
                      <span key={w} className={m.area}>
                        {w}
                      </span>
                    ))
                  ) : (
                    <span className={m.noArea}>Geen werkgebied: krijgt geen aanbod</span>
                  )}
                  {t.werkgebied && t.werkgebied.length > 6 && <span className={m.area}>+{t.werkgebied.length - 6}</span>}
                </div>

                <div className={m.actions}>
                  <a className={m.btnPrimary} href={`/admin/monteurs/${t.id}`}>
                    Open
                  </a>
                  {/*
                    WhatsApp on the monteur's number: a link, not an integration.
                    The Business Platform wants a verified Meta business and a
                    fee per conversation; this works today and costs nothing.
                  */}
                  {waLink(t.phone, 'Hoi ') && (
                    <a className={m.btn} href={waLink(t.phone, 'Hoi ')!} target="_blank" rel="noopener noreferrer">
                      App
                    </a>
                  )}
                  <button type="button" className={m.btn} onClick={() => startEdit(t)}>
                    Bewerken
                  </button>
                  <details className={m.more}>
                    <summary>Meer</summary>
                    <div className={m.menu}>
                      <label className={m.menuField}>
                        <span>Login</span>
                        <select value={t.user_id ?? ''} onChange={(e) => link(t.id, e.target.value)} aria-label={`Login koppelen aan ${t.name}`}>
                          <option value="">Geen login</option>
                          {users.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.email}
                            </option>
                          ))}
                        </select>
                      </label>
                      {t.user_id && (
                        <button
                          type="button"
                          onClick={() => {
                            setResetId(t.id);
                            setResetPassword('');
                            setResetError('');
                            setResetDone(null);
                          }}
                        >
                          Nieuw wachtwoord instellen
                        </button>
                      )}
                      <button type="button" onClick={() => toggle(t)}>
                        {t.active ? 'Op non-actief zetten' : 'Weer activeren'}
                      </button>
                      <button type="button" className={m.danger} disabled={deletingId === t.id} onClick={() => remove(t)}>
                        {deletingId === t.id ? 'Verwijderen…' : 'Verwijderen'}
                      </button>
                    </div>
                  </details>
                </div>

                {resetId === t.id && (
                  <div className={m.inlineForm}>
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
                    <div className={styles.actions}>
                      <button type="button" className={styles.primary} disabled={resetSaving} onClick={() => setTechnicianPassword(t.id)}>
                        {resetSaving ? 'Opslaan…' : 'Wachtwoord instellen'}
                      </button>
                      <button type="button" className={styles.secondary} onClick={() => setResetId(null)}>
                        Annuleren
                      </button>
                    </div>
                  </div>
                )}
                {resetDone?.id === t.id && (
                  <div className={m.secret}>
                    <strong>Nieuw wachtwoord: geef dit door aan {t.name}.</strong>
                    <input readOnly value={resetDone.password} onFocus={(event) => event.currentTarget.select()} />
                  </div>
                )}
              </div>
            )
          )
        )}
      </div>

      <form className={`${styles.panel} ${m.invite}`} onSubmit={add}>
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

        <div className={`${styles.field} ${m.mt}`}>
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

        <div className={`${styles.field} ${m.mt}`}>
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
          <span className={m.hint}>
            Ingevuld? Dan wordt de link overgeslagen en kan de monteur direct
            inloggen met dit wachtwoord — handig als de link-e-mail niet aankomt.
          </span>
        </div>

        <div className={`${styles.field} ${m.mt}`}>
          <span className={styles.fieldLabel}>Kleur in de agenda</span>
          <div className={m.swatches}>
            {COLOURS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Kleur ${c}`}
                aria-pressed={colour === c}
                onClick={() => setColour(c)}
                className={colour === c ? m.swatchOn : m.swatch}
                style={{ background: c }}
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
          <div className={m.secret}>
            <strong>Account aangemaakt — geef dit wachtwoord door aan de monteur.</strong>
            <input
              className={styles.control}
              readOnly
              value={passwordConfirmed}
              onFocus={(event) => event.currentTarget.select()}
            />
            <span className={m.hint}>
              Ook dit wordt nergens bewaard — na deze melding is het weg.
            </span>
          </div>
        )}

        {inviteLink && (
          <div className={m.secret}>
            <strong>Uitnodiging klaar — stuur deze link naar de monteur.</strong>
            <input
              className={styles.control}
              readOnly
              value={inviteLink}
              onFocus={(event) => event.currentTarget.select()}
            />
            <div className={m.rowWrap}>
              <button
                type="button"
                className={m.btn}
                onClick={() => navigator.clipboard?.writeText(inviteLink)}
              >
                Link kopiëren
              </button>
              <a
                className={m.btn}
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Welkom bij Autosleutel24. Stel hier je wachtwoord in en vul je gegevens aan: ${inviteLink}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Via WhatsApp sturen
              </a>
            </div>
            <span className={m.hint}>
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
        <div className={`${styles.panel} ${m.logins}`}>
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
