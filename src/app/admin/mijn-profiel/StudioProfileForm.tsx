'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BadgeCheck, Bell, Building2, CalendarClock, KeyRound, User } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { TECHNICIAN_COLOURS } from '@/lib/crmColours';
import { toWebp } from '@/lib/toWebp';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from 'cn';
import type { Profile, Business } from './ProfileForm';

export type { Profile, Business };

type Tab = 'profiel' | 'bedrijf' | 'beschikbaar' | 'meldingen' | 'inloggen';
const TABS: { id: Tab; label: string; icon: typeof User }[] = [
  { id: 'profiel', label: 'Profiel', icon: User },
  { id: 'bedrijf', label: 'Bedrijf', icon: Building2 },
  { id: 'beschikbaar', label: 'Beschikbaarheid', icon: CalendarClock },
  { id: 'meldingen', label: 'Meldingen', icon: Bell },
  { id: 'inloggen', label: 'Inloggen', icon: KeyRound },
];

const COLOURS = TECHNICIAN_COLOURS;

function Field({ id, label, children, hint }: { id: string; label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium" htmlFor={id}>
        {label}
      </label>
      {children}
      {hint && <small className="text-muted-foreground text-xs">{hint}</small>}
    </div>
  );
}

export default function StudioProfileForm({ profile }: { profile: Profile }) {
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

  async function toggleOnline() {
    const next = !online;
    setOnline(next);
    const ok = await patch({ online: next }, next ? 'Je staat op dienst.' : 'Je staat uit dienst.');
    if (!ok) setOnline(!next);
  }

  async function saveProfile() {
    await patch({ name, phone, werkgebied, color: colour }, 'Profiel opgeslagen.');
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
        setSaved('Er is een bevestigingsmail naar het nieuwe adres gestuurd. Het adres verandert pas als je die link opent.');
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
    <div className="kfc-neutral flex flex-col gap-4 md:gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" className="size-14 shrink-0 rounded-full object-cover" />
          ) : (
            <span
              className="grid size-14 shrink-0 place-items-center rounded-full text-lg font-semibold text-white"
              style={{ background: colour }}
            >
              {(name || '?').charAt(0).toUpperCase()}
            </span>
          )}
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl leading-none font-medium tracking-tight">Mijn profiel</h1>
            <p className="text-muted-foreground text-sm">
              {name || 'Monteur'} · {profile.employmentType === 'zzp' ? 'zzp' : 'loondienst'}
              {!profile.active && ' · op non-actief gezet door kantoor'}
            </p>
          </div>
        </div>
        <div className="flex w-full flex-col gap-1 sm:w-48" aria-label={`Profiel ${completeness}% compleet`}>
          <span className="text-muted-foreground text-xs">Profiel {completeness}% compleet</span>
          <Progress value={completeness} />
        </div>
      </div>

      {(saved || error) && <p className={error ? 'text-sm text-destructive' : 'text-sm text-green-600 dark:text-green-400'}>{error || saved}</p>}

      <Tabs value={tab} onValueChange={(v) => { setTab(v as Tab); setSaved(''); setError(''); }}>
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <TabsTrigger
                key={t.id}
                value={t.id}
                className="h-10 flex-none gap-1.5 rounded-lg border bg-background px-3 data-active:bg-muted"
              >
                <Icon size={16} aria-hidden="true" />
                {t.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="profiel">
          <Card>
            <CardContent className="flex flex-col gap-4">
              <h2 className="text-lg font-medium">Jouw gegevens</h2>
              <div className="flex items-center gap-4">
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo} alt="" className="size-16 shrink-0 rounded-full object-cover" />
                ) : (
                  <span
                    className="grid size-16 shrink-0 place-items-center rounded-full text-xl font-semibold text-white"
                    style={{ background: colour }}
                  >
                    {(name || '?').charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="flex flex-col gap-1">
                  <b className="text-sm">Profielfoto</b>
                  <span className="text-muted-foreground text-sm">
                    Klanten zien deze foto als je onderweg bent. Een duidelijke foto van je gezicht werkt het best.
                  </span>
                  <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => photoInput.current?.click()} disabled={busy}>
                    {photo ? 'Foto vervangen' : 'Foto toevoegen'}
                  </Button>
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

              <div className="grid gap-3 sm:grid-cols-2">
                <Field id="pnaam" label="Naam">
                  <Input id="pnaam" className="h-11" value={name} onChange={(e) => setName(e.target.value)} />
                </Field>
                <Field id="ptel" label="Telefoon">
                  <Input id="ptel" className="h-11" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </Field>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">Kleur in de agenda</span>
                <div className="flex flex-wrap gap-2">
                  {COLOURS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label={`Kleur ${c}`}
                      aria-pressed={colour === c}
                      onClick={() => setColour(c)}
                      className={cn('size-8 rounded-full ring-offset-2 ring-offset-background', colour === c && 'ring-2 ring-foreground')}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>

              <Button type="button" size="lg" className="h-11 w-fit text-base" onClick={saveProfile} disabled={busy}>
                {busy ? 'Opslaan…' : 'Profiel opslaan'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bedrijf">
          <Card>
            <CardContent className="flex flex-col gap-4">
              <h2 className="text-lg font-medium">Bedrijfsgegevens</h2>
              {!biz ? (
                <p className="text-muted-foreground text-sm">
                  Bedrijfsgegevens zijn nog niet geactiveerd. Kantoor moet eerst de database-update (0062) uitvoeren.
                </p>
              ) : (
                <>
                  <p className="text-muted-foreground text-sm">Deze gegevens komen op je facturen en zijn alleen zichtbaar voor jou en kantoor.</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field id="bnaam" label="Bedrijfsnaam">
                      <Input id="bnaam" className="h-11" value={biz.company_name} onChange={(e) => setB('company_name', e.target.value)} placeholder="Bijv. Garage NRD" />
                    </Field>
                    <Field id="bmail" label="Zakelijk e-mailadres" hint="Voor facturen en post van kantoor. Je login-adres verander je bij Inloggen.">
                      <Input id="bmail" className="h-11" type="email" value={biz.contact_email} onChange={(e) => setB('contact_email', e.target.value)} />
                    </Field>
                    <Field id="bkvk" label="KVK-nummer" hint="8 cijfers">
                      <Input id="bkvk" className="h-11" inputMode="numeric" value={biz.kvk_nummer} onChange={(e) => setB('kvk_nummer', e.target.value)} />
                    </Field>
                    <Field id="bbtw" label="BTW-nummer">
                      <Input id="bbtw" className="h-11" value={biz.btw_nummer} onChange={(e) => setB('btw_nummer', e.target.value)} placeholder="NL123456789B01" />
                    </Field>
                    <Field id="biban" label="IBAN" hint="Hierop betaalt kantoor je saldo uit.">
                      <Input id="biban" className="h-11" value={biz.iban} onChange={(e) => setB('iban', e.target.value)} placeholder="NL91 ABNA 0417 1643 00" />
                    </Field>
                    <Field id="bbase" label="Vestigingsplaats" hint="De plaats waar je vandaan rijdt.">
                      <Input id="bbase" className="h-11" value={biz.base_city} onChange={(e) => setB('base_city', e.target.value)} />
                    </Field>
                    <Field id="bstraat" label="Straat en huisnummer">
                      <Input id="bstraat" className="h-11" value={biz.business_street} onChange={(e) => setB('business_street', e.target.value)} />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field id="bpc" label="Postcode">
                        <Input id="bpc" className="h-11" value={biz.business_postcode} onChange={(e) => setB('business_postcode', e.target.value)} />
                      </Field>
                      <Field id="bplaats" label="Plaats">
                        <Input id="bplaats" className="h-11" value={biz.business_city} onChange={(e) => setB('business_city', e.target.value)} />
                      </Field>
                    </div>
                  </div>

                  <h3 className="text-base font-medium">Verzekering</h3>
                  {insuranceExpired && <p className="text-sm text-destructive">Je verzekering is verlopen. Werk de gegevens bij.</p>}
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field id="vmij" label="Verzekeraar">
                      <Input id="vmij" className="h-11" value={biz.insurance_company} onChange={(e) => setB('insurance_company', e.target.value)} placeholder="Bijv. Centraal Beheer" />
                    </Field>
                    <Field id="vpol" label="Polisnummer">
                      <Input id="vpol" className="h-11" value={biz.insurance_policy} onChange={(e) => setB('insurance_policy', e.target.value)} />
                    </Field>
                    <Field id="vtot" label="Geldig tot">
                      <Input id="vtot" className="h-11" type="date" value={biz.insurance_valid_until} onChange={(e) => setB('insurance_valid_until', e.target.value)} />
                    </Field>
                  </div>

                  <h3 className="text-base font-medium">Vakmanschap</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field id="bcert" label="Certificaten" hint="Gescheiden door komma's, bijv. Autel IM608, AVDI Abrites">
                      <Input id="bcert" className="h-11" value={certText} onChange={(e) => setCertText(e.target.value)} />
                    </Field>
                    <Field id="bgbp" label="Google-bedrijfsprofiel" hint="Link naar je eigen Google-profiel (https://…)">
                      <Input id="bgbp" className="h-11" type="url" value={biz.gbp_url} onChange={(e) => setB('gbp_url', e.target.value)} />
                    </Field>
                  </div>

                  <Button type="button" size="lg" className="h-11 w-fit text-base" onClick={saveBusiness} disabled={busy}>
                    {busy ? 'Opslaan…' : 'Bedrijfsgegevens opslaan'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="beschikbaar">
          <Card>
            <CardContent className="flex flex-col gap-4">
              <h2 className="text-lg font-medium">Beschikbaarheid</h2>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                <div>
                  <b className="text-sm">{online ? 'Je staat op dienst' : 'Je staat uit dienst'}</b>
                  <p className="text-muted-foreground text-sm">
                    {online
                      ? profile.onlineSince
                        ? `Sinds ${profile.onlineSince.slice(11, 16)}. Kantoor kan je inplannen voor spoed.`
                        : 'Kantoor kan je inplannen voor spoed.'
                      : 'Kantoor plant je nu niet in voor spoed.'}
                  </p>
                </div>
                <Button type="button" variant={online ? 'outline' : 'default'} size="lg" className="h-11 text-base" onClick={toggleOnline} disabled={busy}>
                  {online ? 'Uit dienst gaan' : 'Op dienst gaan'}
                </Button>
              </div>

              <Field
                id="pwg"
                label="Werkgebied (postcodes)"
                hint="Postcodereeksen gescheiden door komma's, bijv. 3500-3599, 1000-1099. Hierop krijg je klussen aangeboden."
              >
                <Input id="pwg" className="h-11" value={werkgebied} placeholder="3500-3599, 1000-1099" onChange={(e) => setWerkgebied(e.target.value)} />
              </Field>
              <p className="text-muted-foreground text-sm">
                Een hele dag vrij nemen doe je bij <a className="underline" href="/admin/mijn-agenda">Mijn agenda</a>. Welke auto&apos;s je
                doet zet je bij <a className="underline" href="/admin/mijn-vak">Mijn vak</a>.
              </p>
              <Button type="button" size="lg" className="h-11 w-fit text-base" onClick={saveProfile} disabled={busy}>
                {busy ? 'Opslaan…' : 'Werkgebied opslaan'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="meldingen">
          <Card>
            <CardContent className="flex flex-col gap-3">
              <h2 className="text-lg font-medium">Meldingen via Telegram</h2>
              {profile.telegramConnected ? (
                <>
                  <p className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <BadgeCheck size={18} aria-hidden="true" /> Gekoppeld. Nieuwe klussen, aanbod, voorraad en berichten komen hier binnen.
                  </p>
                  <Button type="button" variant="outline" size="sm" className="w-fit" onClick={disconnectTelegram} disabled={unlinking}>
                    {unlinking ? 'Bezig…' : 'Telegram ontkoppelen'}
                  </Button>
                  <p className="text-muted-foreground text-sm">Daarna kan er een nieuwe telefoon gekoppeld worden. Meldingen stoppen tot dat gebeurd is.</p>
                </>
              ) : profile.telegramConnectUrl ? (
                <>
                  <p className="text-muted-foreground text-sm">Nog niet gekoppeld. Zonder Telegram mis je nieuw aanbod als je niet in het CRM kijkt.</p>
                  <Button size="lg" className="h-11 w-fit text-base" asChild>
                    <a href={profile.telegramConnectUrl} target="_blank" rel="noreferrer">
                      Open Telegram en druk op Start
                    </a>
                  </Button>
                  <p className="text-muted-foreground text-sm">De Autosleutel24-bot opent in Telegram. Druk daar op Start, dan komen meldingen vanzelf binnen.</p>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">Nog niet beschikbaar op deze omgeving.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inloggen">
          <Card>
            <CardContent className="flex flex-col gap-4">
              <h2 className="text-lg font-medium">Inloggegevens</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium" htmlFor="pmail">E-mailadres om in te loggen</label>
                  <Input id="pmail" className="h-11" type="email" value={email} autoComplete="username" onChange={(e) => setEmail(e.target.value)} />
                  <Button type="button" variant="outline" size="sm" className="w-fit" onClick={changeEmail} disabled={busy || email.trim() === profile.email}>
                    E-mailadres wijzigen
                  </Button>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium" htmlFor="ppw">Nieuw wachtwoord</label>
                  <Input id="ppw" className="h-11" type="password" value={password} autoComplete="new-password" onChange={(e) => setPassword(e.target.value)} />
                  <Input
                    aria-label="Nieuw wachtwoord nog een keer"
                    className="h-11"
                    type="password"
                    value={passwordAgain}
                    autoComplete="new-password"
                    placeholder="Nog een keer"
                    onChange={(e) => setPasswordAgain(e.target.value)}
                  />
                  <Button type="button" variant="outline" size="sm" className="w-fit" onClick={changePassword} disabled={busy || password.length === 0}>
                    Wachtwoord wijzigen
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
