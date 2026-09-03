'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../vandaag/vandaag.module.css';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

export interface Profile {
  name: string;
  phone: string;
  werkgebied: string[];
  color: string;
  photoUrl: string | null;
  online: boolean;
  onlineSince: string | null;
  active: boolean;
  employmentType: string;
  email: string;
}

const COLOURS = ['#2c4a63', '#c2410c', '#186b4b', '#6b21a8', '#8a5804', '#9d201c'];

export default function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();

  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [werkgebied, setWerkgebied] = useState(profile.werkgebied.join(', '));
  const [colour, setColour] = useState(profile.color);
  const [photo, setPhoto] = useState(profile.photoUrl);
  const [online, setOnline] = useState(profile.online);

  const [email, setEmail] = useState(profile.email);
  const [password, setPassword] = useState('');
  const [passwordAgain, setPasswordAgain] = useState('');

  const [saved, setSaved] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const photoInput = useRef<HTMLInputElement>(null);

  async function patch(body: Record<string, unknown>, done: string) {
    setBusy(true);
    setError('');
    setSaved('');

    const response = await fetch('/api/admin/profiel', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => null);

    if (!response || !response.ok) {
      const payload = await response?.json().catch(() => null);
      setError(payload?.error ?? 'Opslaan mislukt.');
      setBusy(false);
      return false;
    }

    setSaved(done);
    setBusy(false);
    router.refresh();
    return true;
  }

  /*
   * The duty switch saves on its own, without the Save button.
   *
   * Going off duty at the end of a shift is a single tap in a van; making it a
   * two-step form is how it ends up never being flipped, and then the planner
   * calls someone who has gone home.
   */
  async function toggleOnline() {
    const next = !online;
    setOnline(next);
    const ok = await patch({ online: next }, next ? 'Je staat op dienst.' : 'Je staat uit dienst.');
    if (!ok) setOnline(!next);
  }

  async function saveProfile() {
    await patch(
      { name, phone, werkgebied, color: colour },
      'Profiel opgeslagen.'
    );
  }

  async function uploadPhoto(file: File) {
    setBusy(true);
    setError('');

    const response = await fetch('/api/admin/profiel/foto', {
      method: 'POST',
      headers: { 'Content-Type': file.type },
      body: file,
    }).catch(() => null);

    if (!response || !response.ok) {
      const payload = await response?.json().catch(() => null);
      setError(payload?.error ?? 'Uploaden mislukt.');
      setBusy(false);
      return;
    }

    const payload = await response.json();
    setPhoto(payload.url);
    setSaved('Foto opgeslagen.');
    setBusy(false);
    router.refresh();
  }

  /*
   * E-mail and password are Supabase Auth, not the technicians table — they are
   * the login, not the profile. Both go through the browser client so the
   * change is made by the session that owns the account.
   */
  async function changeEmail() {
    setBusy(true);
    setError('');
    setSaved('');
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.updateUser({ email: email.trim() });
      if (authError) {
        setError(authError.message);
      } else {
        setSaved(
          'Er is een bevestigingsmail naar het nieuwe adres gestuurd. Het adres verandert pas als je die link opent.'
        );
      }
    } catch {
      setError('Inloggegevens wijzigen is op deze omgeving niet geconfigureerd.');
    }
    setBusy(false);
  }

  async function changePassword() {
    if (password.length < 6) {
      setError('Een wachtwoord is minstens 6 tekens.');
      return;
    }
    if (password !== passwordAgain) {
      setError('De twee wachtwoorden zijn niet gelijk.');
      return;
    }

    setBusy(true);
    setError('');
    setSaved('');
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.updateUser({ password });
      if (authError) setError(authError.message);
      else {
        setSaved('Wachtwoord gewijzigd.');
        setPassword('');
        setPasswordAgain('');
      }
    } catch {
      setError('Inloggegevens wijzigen is op deze omgeving niet geconfigureerd.');
    }
    setBusy(false);
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <h1 className={styles.title}>Mijn profiel</h1>
        <span className={styles.sub}>
          {profile.employmentType === 'zzp' ? 'zzp' : 'loondienst'}
          {!profile.active && ' · op non-actief gezet door kantoor'}
        </span>
      </div>

      {/* ---- Duty ---- */}
      <div className={styles.card}>
        <div className={styles.body}>
          <span className={styles.label}>Beschikbaarheid nu</span>
          <p className={styles.meta}>
            {online
              ? profile.onlineSince
                ? `Op dienst sinds ${profile.onlineSince.slice(11, 16)}.`
                : 'Je staat op dienst.'
              : 'Je staat uit dienst — kantoor plant je nu niet in voor spoed.'}
          </p>
          <button
            className={`${styles.tap} ${online ? styles.tapDone : styles.tapPrimary}`}
            style={{ gridColumn: 'auto', width: '100%' }}
            onClick={toggleOnline}
            disabled={busy}
          >
            {online ? 'Op dienst — zet uit' : 'Uit dienst — zet aan'}
          </button>
          <p className={styles.note}>
            Dit is voor vandaag, nu. Een hele dag vrij nemen doe je bij{' '}
            <strong>Mijn agenda</strong>.
          </p>
        </div>
      </div>

      {/* ---- Photo ---- */}
      <div className={styles.card}>
        <div className={styles.body}>
          <span className={styles.label}>Profielfoto</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8 }}>
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo}
                alt=""
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid var(--crm-rule2)',
                }}
              />
            ) : (
              <span
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: '50%',
                  background: colour,
                  color: '#fff',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 30,
                  fontWeight: 800,
                }}
              >
                {(name || '?').charAt(0).toUpperCase()}
              </span>
            )}
            <button
              className={styles.tap}
              style={{ flex: 1 }}
              onClick={() => photoInput.current?.click()}
              disabled={busy}
            >
              {photo ? 'Foto vervangen' : 'Foto toevoegen'}
            </button>
          </div>
          <input
            ref={photoInput}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) uploadPhoto(file);
            }}
          />
        </div>
      </div>

      {/* ---- Details ---- */}
      <div className={styles.card}>
        <div className={styles.body}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="pnaam">Naam</label>
            <input id="pnaam" className={styles.input} value={name}
              onChange={(e) => setName(e.target.value)} />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="ptel">Telefoon</label>
            <input id="ptel" className={styles.input} type="tel" value={phone}
              onChange={(e) => setPhone(e.target.value)} />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="pwg">Werkgebied</label>
            <input id="pwg" className={styles.input} value={werkgebied}
              placeholder="3500-3599, 1000-1099"
              onChange={(e) => setWerkgebied(e.target.value)} />
            <span className={styles.meta}>
              Postcodereeksen, gescheiden door komma&apos;s. De eerste vier
              cijfers bepalen de regio; hierop stelt kantoor jou voor bij nieuwe
              klussen.
            </span>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Kleur in de agenda</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {COLOURS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Kleur ${c}`}
                  onClick={() => setColour(c)}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: c,
                    border: colour === c ? '3px solid var(--crm-ink)' : '1px solid var(--crm-rule2)',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          </div>

          <button
            className={`${styles.tap} ${styles.tapPrimary}`}
            style={{ gridColumn: 'auto', width: '100%' }}
            onClick={saveProfile}
            disabled={busy}
          >
            {busy ? 'Opslaan…' : 'Opslaan'}
          </button>
        </div>
      </div>

      {/* ---- Login ---- */}
      <div className={styles.card}>
        <div className={styles.body}>
          <span className={styles.label}>Inloggegevens</span>

          <div className={styles.field} style={{ marginTop: 8 }}>
            <label className={styles.label} htmlFor="pmail">E-mailadres</label>
            <input id="pmail" className={styles.input} type="email" value={email}
              autoComplete="username" onChange={(e) => setEmail(e.target.value)} />
            <button className={styles.tap} onClick={changeEmail}
              disabled={busy || email.trim() === profile.email}>
              E-mailadres wijzigen
            </button>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="ppw">Nieuw wachtwoord</label>
            <input id="ppw" className={styles.input} type="password" value={password}
              autoComplete="new-password" onChange={(e) => setPassword(e.target.value)} />
            <input className={styles.input} type="password" value={passwordAgain}
              autoComplete="new-password" placeholder="Nog een keer"
              onChange={(e) => setPasswordAgain(e.target.value)} />
            <button className={styles.tap} onClick={changePassword}
              disabled={busy || password.length === 0}>
              Wachtwoord wijzigen
            </button>
          </div>

          <p className={styles.note}>
            Een nieuw e-mailadres gaat pas in nadat je de bevestigingsmail hebt
            geopend. Komt die niet aan, vraag kantoor dan om het adres te
            wijzigen — de mailserver van dit project verstuurt nog niet naar
            elk adres.
          </p>
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}
      {saved && <p className={styles.ok}>{saved}</p>}
    </div>
  );
}
