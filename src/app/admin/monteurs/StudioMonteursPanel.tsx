'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { waLink } from '@/lib/whatsapp';
import { TECHNICIAN_COLOURS, technicianColour } from '@/lib/crmColours';
import { PreviewText } from '../PreviewLanguage';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Technician } from './MonteursPanel';

/**
 * Studio restyle of MonteursPanel: same state, same fetch calls to the same
 * routes, same confirm()/alert() guards — only the markup changes, onto
 * shadcn Card/Badge/Button/Input/Select.
 */

interface CrmUser {
  id: string;
  email: string;
}

const COLOURS = TECHNICIAN_COLOURS;
const NO_LOGIN = '__none__';

export default function StudioMonteursPanel({ technicians }: { technicians: Technician[] }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [colour, setColour] = useState(COLOURS[0]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [passwordConfirmed, setPasswordConfirmed] = useState<string | null>(null);

  const [resetId, setResetId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetSaving, setResetSaving] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetDone, setResetDone] = useState<{ id: string; password: string } | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editWerkgebied, setEditWerkgebied] = useState('');
  const [editColour, setEditColour] = useState(COLOURS[0]);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {technicians.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            <PreviewText>
              Nog geen monteurs. Zonder monteurs heeft de dagweergave geen kolommen en kan een klus alleen ongepland blijven staan.
            </PreviewText>
          </p>
        ) : (
          technicians.map((t) =>
            editingId === t.id ? (
              <Card key={t.id}>
                <CardContent className="flex flex-col gap-3 pt-6">
                  <div className="grid gap-1.5">
                    <Label htmlFor={`name-${t.id}`}><PreviewText>Naam</PreviewText></Label>
                    <Input id={`name-${t.id}`} value={editName} onChange={(e) => setEditName(e.target.value)} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor={`phone-${t.id}`}><PreviewText>Telefoon</PreviewText></Label>
                    <Input id={`phone-${t.id}`} value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor={`area-${t.id}`}><PreviewText>Werkgebied (postcodes, komma-gescheiden)</PreviewText></Label>
                    <Input
                      id={`area-${t.id}`}
                      placeholder="1000, 1010-1099, 3500"
                      value={editWerkgebied}
                      onChange={(e) => setEditWerkgebied(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label><PreviewText>Kleur</PreviewText></Label>
                    <div className="flex flex-wrap gap-2">
                      {COLOURS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          aria-label={`Kleur ${c}`}
                          aria-pressed={editColour === c}
                          onClick={() => setEditColour(c)}
                          className={`size-7 rounded-full ${editColour === c ? 'ring-2 ring-ring ring-offset-2 ring-offset-background' : ''}`}
                          style={{ background: c }}
                        />
                      ))}
                    </div>
                  </div>
                  {editError && <p className="text-destructive text-sm"><PreviewText>{editError}</PreviewText></p>}
                  <div className="flex gap-2">
                    <Button size="sm" disabled={editSaving} onClick={() => saveEdit(t.id)}>
                      <PreviewText>{editSaving ? 'Opslaan…' : 'Opslaan'}</PreviewText>
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                      <PreviewText>Annuleren</PreviewText>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card key={t.id} className={!t.active ? 'opacity-60' : undefined}>
                <CardHeader className="flex flex-row items-center gap-3">
                  <Avatar size="lg">
                    {t.photo_url && <AvatarImage src={t.photo_url} alt="" />}
                    <AvatarFallback style={{ background: technicianColour(t.color) }} className="text-white">
                      {t.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <a href={`/admin/monteurs/${t.id}`} className="truncate font-medium underline-offset-4 hover:underline">
                      {t.name}
                    </a>
                    <span className="text-muted-foreground text-xs">{t.phone ?? <PreviewText>geen telefoon</PreviewText>}</span>
                  </div>
                  <span
                    className="size-3 shrink-0 rounded-full"
                    style={{ background: technicianColour(t.color) }}
                    title="Kleur in de agenda"
                  />
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-1.5">
                    {!t.active && <Badge variant="outline"><PreviewText>Non-actief</PreviewText></Badge>}
                    {t.active && t.online && <Badge><PreviewText>Op dienst</PreviewText></Badge>}
                    {t.employment_type && <Badge variant="secondary">{t.employment_type === 'zzp' ? 'ZZP' : <PreviewText>Loondienst</PreviewText>}</Badge>}
                    <Badge variant={t.user_id ? 'secondary' : 'destructive'}>
                      <PreviewText>{t.user_id ? 'Kan inloggen' : 'Geen login'}</PreviewText>
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {t.werkgebied && t.werkgebied.length > 0 ? (
                      <>
                        {t.werkgebied.slice(0, 6).map((w) => (
                          <Badge key={w} variant="outline">{w}</Badge>
                        ))}
                        {t.werkgebied.length > 6 && <Badge variant="outline">+{t.werkgebied.length - 6}</Badge>}
                      </>
                    ) : (
                      <span className="text-muted-foreground text-xs"><PreviewText>Geen werkgebied: krijgt geen aanbod</PreviewText></span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm" asChild>
                      <a href={`/admin/monteurs/${t.id}`}><PreviewText>Open</PreviewText></a>
                    </Button>
                    {waLink(t.phone, 'Hoi ') && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={waLink(t.phone, 'Hoi ')!} target="_blank" rel="noopener noreferrer"><PreviewText>App</PreviewText></a>
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => startEdit(t)}>
                      <PreviewText>Bewerken</PreviewText>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setResetId(resetId === t.id ? null : t.id);
                        setResetPassword('');
                        setResetError('');
                        setResetDone(null);
                      }}
                    >
                      <PreviewText>Meer</PreviewText>
                    </Button>
                  </div>

                  {resetId === t.id && (
                    <div className="flex flex-col gap-2 rounded-lg border p-3">
                      <div className="grid gap-1.5">
                        <Label><PreviewText>Login</PreviewText></Label>
                        <Select value={t.user_id ?? NO_LOGIN} onValueChange={(value) => link(t.id, value === NO_LOGIN ? '' : value)}>
                          <SelectTrigger aria-label={`Login koppelen aan ${t.name}`} className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NO_LOGIN}><PreviewText>Geen login</PreviewText></SelectItem>
                            {users.map((u) => (
                              <SelectItem key={u.id} value={u.id}>{u.email}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {t.user_id && (
                        <div className="grid gap-1.5">
                          <Label htmlFor={`pw-${t.id}`}><PreviewText>{`Nieuw wachtwoord voor ${t.name}`}</PreviewText></Label>
                          <Input
                            id={`pw-${t.id}`}
                            placeholder="Minimaal 8 tekens"
                            value={resetPassword}
                            onChange={(e) => setResetPassword(e.target.value)}
                          />
                          {resetError && <p className="text-destructive text-sm"><PreviewText>{resetError}</PreviewText></p>}
                          <Button size="sm" disabled={resetSaving} onClick={() => setTechnicianPassword(t.id)}>
                            <PreviewText>{resetSaving ? 'Opslaan…' : 'Wachtwoord instellen'}</PreviewText>
                          </Button>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => toggle(t)}>
                          <PreviewText>{t.active ? 'Op non-actief zetten' : 'Weer activeren'}</PreviewText>
                        </Button>
                        <Button size="sm" variant="destructive" disabled={deletingId === t.id} onClick={() => remove(t)}>
                          <PreviewText>{deletingId === t.id ? 'Verwijderen…' : 'Verwijderen'}</PreviewText>
                        </Button>
                      </div>
                    </div>
                  )}

                  {resetDone?.id === t.id && (
                    <div className="flex flex-col gap-2 rounded-lg border border-dashed p-3">
                      <strong className="text-sm"><PreviewText>{`Nieuw wachtwoord: geef dit door aan ${t.name}.`}</PreviewText></strong>
                      <Input readOnly value={resetDone.password} onFocus={(event) => event.currentTarget.select()} />
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          )
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle><PreviewText>Monteur uitnodigen</PreviewText></CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={add}>
            <div className="grid gap-1.5">
              <Label htmlFor="nm"><PreviewText>Naam</PreviewText></Label>
              <Input id="nm" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="em"><PreviewText>E-mailadres</PreviewText></Label>
              <Input id="em" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="pw"><PreviewText>Wachtwoord (optioneel — leeg voor een link per e-mail/WhatsApp)</PreviewText></Label>
              <Input id="pw" placeholder="Minimaal 8 tekens" value={password} onChange={(e) => setPassword(e.target.value)} />
              <span className="text-muted-foreground text-xs">
                <PreviewText>
                  Ingevuld? Dan wordt de link overgeslagen en kan de monteur direct inloggen met dit wachtwoord — handig als de
                  link-e-mail niet aankomt.
                </PreviewText>
              </span>
            </div>

            <div className="grid gap-1.5">
              <Label><PreviewText>Kleur in de agenda</PreviewText></Label>
              <div className="flex flex-wrap gap-2">
                {COLOURS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Kleur ${c}`}
                    aria-pressed={colour === c}
                    onClick={() => setColour(c)}
                    className={`size-7 rounded-full ${colour === c ? 'ring-2 ring-ring ring-offset-2 ring-offset-background' : ''}`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={saving}>
                <PreviewText>{saving ? 'Uitnodigen…' : 'Uitnodiging versturen'}</PreviewText>
              </Button>
              {error && <p className="text-destructive text-sm"><PreviewText>{error}</PreviewText></p>}
            </div>

            {passwordConfirmed && (
              <div className="flex flex-col gap-2 rounded-lg border border-dashed p-3">
                <strong className="text-sm"><PreviewText>Account aangemaakt — geef dit wachtwoord door aan de monteur.</PreviewText></strong>
                <Input readOnly value={passwordConfirmed} onFocus={(event) => event.currentTarget.select()} />
                <span className="text-muted-foreground text-xs">
                  <PreviewText>Ook dit wordt nergens bewaard — na deze melding is het weg.</PreviewText>
                </span>
              </div>
            )}

            {inviteLink && (
              <div className="flex flex-col gap-2 rounded-lg border border-dashed p-3">
                <strong className="text-sm"><PreviewText>Uitnodiging klaar — stuur deze link naar de monteur.</PreviewText></strong>
                <Input readOnly value={inviteLink} onFocus={(event) => event.currentTarget.select()} />
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => navigator.clipboard?.writeText(inviteLink)}>
                    <PreviewText>Link kopiëren</PreviewText>
                  </Button>
                  <Button type="button" size="sm" variant="outline" asChild>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`Welkom bij Autosleutel24. Stel hier je wachtwoord in en vul je gegevens aan: ${inviteLink}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <PreviewText>Via WhatsApp sturen</PreviewText>
                    </a>
                  </Button>
                </div>
                <span className="text-muted-foreground text-xs">
                  <PreviewText>De link is eenmalig en wordt nergens bewaard. Kwijt? Nodig opnieuw uit.</PreviewText>
                </span>
              </div>
            )}

            <p className="text-muted-foreground text-sm">
              <PreviewText>
                De monteur stelt zelf een wachtwoord in via de link. Daarna doorlopen ze een wizard voor telefoonnummer,
                werkgebied en welke auto&rsquo;s ze aankunnen — zonder dat laatste krijgen ze geen klussen aangeboden.
              </PreviewText>
            </p>
          </form>
        </CardContent>
      </Card>

      {users.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle><PreviewText>Logins</PreviewText></CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-muted-foreground text-sm">
              <PreviewText>
                Elke monteur-login, gekoppeld of niet. Een e-mailadres kan pas opnieuw gebruikt worden voor een uitnodiging
                nadat de oude login hier is verwijderd — Supabase staat geen dubbel e-mailadres toe.
              </PreviewText>
            </p>
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between gap-3 border-t pt-3 first:border-t-0 first:pt-0">
                <span className="text-sm">{u.email}</span>
                <Button size="sm" variant="outline" disabled={deletingUserId === u.id} onClick={() => removeLogin(u)}>
                  <PreviewText>{deletingUserId === u.id ? 'Verwijderen…' : 'Verwijderen'}</PreviewText>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
