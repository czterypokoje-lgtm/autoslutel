'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BadgeCheck, Bell, Building2, CalendarClock, KeyRound, User } from 'lucide-react';
import pf from './profiel.module.css';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { TECHNICIAN_COLOURS } from '@/lib/crmColours';
import { toWebp } from '@/lib/toWebp';

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
  telegramConnected: boolean;
  /** null when TELEGRAM_BOT_USERNAME isn't configured on this deployment yet. */
  telegramConnectUrl: string | null;
  /** null until migration 0062 has run on this database. */
  business: Business | null;
}

export interface Business {
  company_name: string;
  kvk_nummer: string;
  btw_nummer: string;
  iban: string;
  business_street: string;
  business_postcode: string;
  business_city: string;
  contact_email: string;
  insurance_company: string;
  insurance_policy: string;
  insurance_valid_until: string;
  base_city: string;
  certifications: string[];
  gbp_url: string;
}

type Tab = 'profiel' | 'bedrijf' | 'beschikbaar' | 'meldingen' | 'inloggen';
const TABS: { id: Tab; label: string; icon: typeof User }[] = [
  { id: 'profiel', label: 'Profiel', icon: User },
  { id: 'bedrijf', label: 'Bedrijf', icon: Building2 },
  { id: 'beschikbaar', label: 'Beschikbaarheid', icon: CalendarClock },
  { id: 'meldingen', label: 'Meldingen', icon: Bell },
  { id: 'inloggen', label: 'Inloggen', icon: KeyRound },
];

const COLOURS = TECHNICIAN_COLOURS;

/** A labelled field with an optional hint underneath. */
function Field({ id, label, children, hint }: { id: string; label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className={pf.field}>
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && <small>{hint}</small>}
    </div>
  );
}

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
  const [tab, setTab] = useState<Tab>('profiel');
  const [unlinking, setUnlinking] = useState(false);

  async function disconnectTelegram() {
    if (!window.confirm('Telegram ontkoppelen? Meldingen stoppen tot er opnieuw gekoppeld is.')) {
      return;
    }
    setUnlinking(true);
    const response = await fetch('/api/admin/profiel/telegram', { method: 'DELETE' }).catch(() => null);
    setUnlinking(false);
    if (!response?.ok) {
      window.alert((await response?.json().catch(() => null))?.error ?? 'Ontkoppelen mislukt.');
      return;
    }
    /* Reload rather than flip a flag: the page has to mint a fresh connect
       code, and that happens on the server. */
    router.refresh();
  }

  const [biz, setBiz] = useState<Business | null>(profile.business);
  const [certText, setCertText] = useState((profile.business?.certifications ?? []).join(', '));
  const setB = (key: keyof Business, value: string) => setBiz((b) => (b ? { ...b, [key]: value } : b));

  async function saveBusiness() {
    if (!biz) return;
    setBusy(true);
    setError('');
    setSaved('');
    const response = await fetch('/api/admin/profiel/bedrijf', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...biz,
        certifications: certText.split(',').map((c) => c.trim()).filter(Boolean),
      }),
    }).catch(() => null);
    if (!response || !response.ok) {
      const payload = await response?.json().catch(() => null);
      setError(payload?.error ?? 'Opslaan mislukt.');
      setBusy(false);
      return;
    }
    setSaved('Bedrijfsgegevens opgeslagen.');
    setBusy(false);
    router.refresh();
  }

  /** How complete the profile is, so it is obvious what is still missing. */
  const checks = [
    Boolean(name),
    Boolean(phone),
    Boolean(photo),
    Boolean(werkgebied.trim()),
    Boolean(biz?.kvk_nummer),
    Boolean(biz?.iban),
    Boolean(biz?.insurance_company),
    profile.telegramConnected,
  ];
  const completeness = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  const insuranceExpired =
    Boolean(biz?.insurance_valid_until) && new Date(`${biz!.insurance_valid_until}T23:59:59`) < new Date();

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

  async function uploadPhoto(rawFile: File) {
    setBusy(true);
    setError('');

    const file = await toWebp(rawFile).catch(() => rawFile);
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
    <div className={pf.page}>
      <header className={pf.head}>
        <div className={pf.who}>
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" className={pf.avatar} />
          ) : (
            <span className={pf.avatarInitial} style={{ background: colour }}>
              {(name || '?').charAt(0).toUpperCase()}
            </span>
          )}
          <div>
            <h1 className={pf.title}>Mijn profiel</h1>
            <p className={pf.sub}>
              {name || 'Monteur'} · {profile.employmentType === 'zzp' ? 'zzp' : 'loondienst'}
              {!profile.active && ' · op non-actief gezet door kantoor'}
            </p>
          </div>
        </div>
        <div className={pf.complete} aria-label={`Profiel ${completeness}% compleet`}>
          <span>Profiel {completeness}% compleet</span>
          <span className={pf.completeBar}>
            <span style={{ width: `${completeness}%` }} />
          </span>
        </div>
      </header>

      <nav className={pf.tabs} role="tablist" aria-label="Onderdelen">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={tab === t.id ? pf.tabOn : pf.tab}
              onClick={() => {
                setTab(t.id);
                setSaved('');
                setError('');
              }}
            >
              <Icon size={16} aria-hidden="true" />
              {t.label}
            </button>
          );
        })}
      </nav>

      {(saved || error) && <p className={error ? pf.msgBad : pf.msgOk}>{error || saved}</p>}

      {tab === 'profiel' && (
        <section className={pf.card}>
          <h2 className={pf.h2}>Jouw gegevens</h2>
          <div className={pf.photoRow}>
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="" className={pf.photo} />
            ) : (
              <span className={pf.initial} style={{ background: colour }}>
                {(name || '?').charAt(0).toUpperCase()}
              </span>
            )}
            <div className={pf.photoText}>
              <b>Profielfoto</b>
              <span>Klanten zien deze foto als je onderweg bent. Een duidelijke foto van je gezicht werkt het best.</span>
              <button type="button" className={pf.ghostBtn} onClick={() => photoInput.current?.click()} disabled={busy}>
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

          <div className={pf.grid}>
            <Field id="pnaam" label="Naam">
              <input id="pnaam" value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field id="ptel" label="Telefoon">
              <input id="ptel" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
          </div>

          <div className={pf.field}>
            <span className={pf.fakeLabel}>Kleur in de agenda</span>
            <div className={pf.swatches}>
              {COLOURS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Kleur ${c}`}
                  aria-pressed={colour === c}
                  onClick={() => setColour(c)}
                  className={colour === c ? pf.swatchOn : pf.swatch}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          <div className={pf.actions}>
            <button type="button" className={pf.primary} onClick={saveProfile} disabled={busy}>
              {busy ? 'Opslaan…' : 'Profiel opslaan'}
            </button>
          </div>
        </section>
      )}

      {tab === 'bedrijf' && (
        <section className={pf.card}>
          <h2 className={pf.h2}>Bedrijfsgegevens</h2>
          {!biz ? (
            <p className={pf.note}>
              Bedrijfsgegevens zijn nog niet geactiveerd. Kantoor moet eerst de database-update (0062) uitvoeren.
            </p>
          ) : (
            <>
              <p className={pf.note}>Deze gegevens komen op je facturen en zijn alleen zichtbaar voor jou en kantoor.</p>
              <div className={pf.grid}>
                <Field id="bnaam" label="Bedrijfsnaam">
                  <input id="bnaam" value={biz.company_name} onChange={(e) => setB('company_name', e.target.value)} placeholder="Bijv. Garage NRD" />
                </Field>
                <Field id="bmail" label="Zakelijk e-mailadres" hint="Voor facturen en post van kantoor. Je login-adres verander je bij Inloggen.">
                  <input id="bmail" type="email" value={biz.contact_email} onChange={(e) => setB('contact_email', e.target.value)} />
                </Field>
                <Field id="bkvk" label="KVK-nummer" hint="8 cijfers">
                  <input id="bkvk" inputMode="numeric" value={biz.kvk_nummer} onChange={(e) => setB('kvk_nummer', e.target.value)} />
                </Field>
                <Field id="bbtw" label="BTW-nummer">
                  <input id="bbtw" value={biz.btw_nummer} onChange={(e) => setB('btw_nummer', e.target.value)} placeholder="NL123456789B01" />
                </Field>
                <Field id="biban" label="IBAN" hint="Hierop betaalt kantoor je saldo uit.">
                  <input id="biban" value={biz.iban} onChange={(e) => setB('iban', e.target.value)} placeholder="NL91 ABNA 0417 1643 00" />
                </Field>
                <Field id="bbase" label="Vestigingsplaats" hint="De plaats waar je vandaan rijdt.">
                  <input id="bbase" value={biz.base_city} onChange={(e) => setB('base_city', e.target.value)} />
                </Field>
                <Field id="bstraat" label="Straat en huisnummer">
                  <input id="bstraat" value={biz.business_street} onChange={(e) => setB('business_street', e.target.value)} />
                </Field>
                <div className={pf.pair}>
                  <Field id="bpc" label="Postcode">
                    <input id="bpc" value={biz.business_postcode} onChange={(e) => setB('business_postcode', e.target.value)} />
                  </Field>
                  <Field id="bplaats" label="Plaats">
                    <input id="bplaats" value={biz.business_city} onChange={(e) => setB('business_city', e.target.value)} />
                  </Field>
                </div>
              </div>

              <h3 className={pf.h3}>Verzekering</h3>
              {insuranceExpired && <p className={pf.msgBad}>Je verzekering is verlopen. Werk de gegevens bij.</p>}
              <div className={pf.grid3}>
                <Field id="vmij" label="Verzekeraar">
                  <input id="vmij" value={biz.insurance_company} onChange={(e) => setB('insurance_company', e.target.value)} placeholder="Bijv. Centraal Beheer" />
                </Field>
                <Field id="vpol" label="Polisnummer">
                  <input id="vpol" value={biz.insurance_policy} onChange={(e) => setB('insurance_policy', e.target.value)} />
                </Field>
                <Field id="vtot" label="Geldig tot">
                  <input id="vtot" type="date" value={biz.insurance_valid_until} onChange={(e) => setB('insurance_valid_until', e.target.value)} />
                </Field>
              </div>

              <h3 className={pf.h3}>Vakmanschap</h3>
              <div className={pf.grid}>
                <Field id="bcert" label="Certificaten" hint="Gescheiden door komma's, bijv. Autel IM608, AVDI Abrites">
                  <input id="bcert" value={certText} onChange={(e) => setCertText(e.target.value)} />
                </Field>
                <Field id="bgbp" label="Google-bedrijfsprofiel" hint="Link naar je eigen Google-profiel (https://…)">
                  <input id="bgbp" type="url" value={biz.gbp_url} onChange={(e) => setB('gbp_url', e.target.value)} />
                </Field>
              </div>

              <div className={pf.actions}>
                <button type="button" className={pf.primary} onClick={saveBusiness} disabled={busy}>
                  {busy ? 'Opslaan…' : 'Bedrijfsgegevens opslaan'}
                </button>
              </div>
            </>
          )}
        </section>
      )}

      {tab === 'beschikbaar' && (
        <section className={pf.card}>
          <h2 className={pf.h2}>Beschikbaarheid</h2>
          <div className={online ? pf.dutyOn : pf.duty}>
            <div>
              <b>{online ? 'Je staat op dienst' : 'Je staat uit dienst'}</b>
              <span>
                {online
                  ? profile.onlineSince
                    ? `Sinds ${profile.onlineSince.slice(11, 16)}. Kantoor kan je inplannen voor spoed.`
                    : 'Kantoor kan je inplannen voor spoed.'
                  : 'Kantoor plant je nu niet in voor spoed.'}
              </span>
            </div>
            <button type="button" className={online ? pf.ghostBtn : pf.primary} onClick={toggleOnline} disabled={busy}>
              {online ? 'Uit dienst gaan' : 'Op dienst gaan'}
            </button>
          </div>

          <Field
            id="pwg"
            label="Werkgebied (postcodes)"
            hint="Postcodereeksen gescheiden door komma's, bijv. 3500-3599, 1000-1099. Hierop krijg je klussen aangeboden."
          >
            <input id="pwg" value={werkgebied} placeholder="3500-3599, 1000-1099" onChange={(e) => setWerkgebied(e.target.value)} />
          </Field>
          <p className={pf.note}>
            Een hele dag vrij nemen doe je bij <a href="/admin/mijn-agenda">Mijn agenda</a>. Welke auto&apos;s je doet zet je bij{' '}
            <a href="/admin/mijn-vak">Mijn vak</a>.
          </p>
          <div className={pf.actions}>
            <button type="button" className={pf.primary} onClick={saveProfile} disabled={busy}>
              {busy ? 'Opslaan…' : 'Werkgebied opslaan'}
            </button>
          </div>
        </section>
      )}

      {tab === 'meldingen' && (
        <section className={pf.card}>
          <h2 className={pf.h2}>Meldingen via Telegram</h2>
          {profile.telegramConnected ? (
            <>
              <p className={pf.okLine}>
                <BadgeCheck size={18} aria-hidden="true" /> Gekoppeld. Nieuwe klussen, aanbod, voorraad en berichten komen hier binnen.
              </p>
              {/*
                * Needed more often than it sounds: a new phone, or the wrong
                * account connected while testing. Without it the link is
                * permanent, because the connect button hides itself once this
                * says "gekoppeld".
                */}
              <button
                type="button"
                className={pf.ghostBtn}
                onClick={disconnectTelegram}
                disabled={unlinking}
              >
                {unlinking ? 'Bezig…' : 'Telegram ontkoppelen'}
              </button>
              <p className={pf.note}>
                Daarna kan er een nieuwe telefoon gekoppeld worden. Meldingen stoppen tot dat
                gebeurd is.
              </p>
            </>
          ) : profile.telegramConnectUrl ? (
            <>
              <p className={pf.note}>
                Nog niet gekoppeld. Zonder Telegram mis je nieuw aanbod als je niet in het CRM kijkt.
              </p>
              <a className={pf.primary} href={profile.telegramConnectUrl} target="_blank" rel="noreferrer">
                Open Telegram en druk op Start
              </a>
              <p className={pf.note}>De Autosleutel24-bot opent in Telegram. Druk daar op Start, dan komen meldingen vanzelf binnen.</p>
            </>
          ) : (
            <p className={pf.note}>Nog niet beschikbaar op deze omgeving.</p>
          )}
        </section>
      )}

      {tab === 'inloggen' && (
        <section className={pf.card}>
          <h2 className={pf.h2}>Inloggegevens</h2>
          <div className={pf.grid}>
            <div className={pf.field}>
              <label htmlFor="pmail">E-mailadres om in te loggen</label>
              <input id="pmail" type="email" value={email} autoComplete="username" onChange={(e) => setEmail(e.target.value)} />
              <button type="button" className={pf.ghostBtn} onClick={changeEmail} disabled={busy || email.trim() === profile.email}>
                E-mailadres wijzigen
              </button>
            </div>
            <div className={pf.field}>
              <label htmlFor="ppw">Nieuw wachtwoord</label>
              <input id="ppw" type="password" value={password} autoComplete="new-password" onChange={(e) => setPassword(e.target.value)} />
              <input
                aria-label="Nieuw wachtwoord nog een keer"
                type="password"
                value={passwordAgain}
                autoComplete="new-password"
                placeholder="Nog een keer"
                onChange={(e) => setPasswordAgain(e.target.value)}
              />
              <button type="button" className={pf.ghostBtn} onClick={changePassword} disabled={busy || password.length === 0}>
                Wachtwoord wijzigen
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
