'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, UserPlus } from 'lucide-react';
import { PreviewText, usePreviewLanguage } from '@/app/admin/PreviewLanguage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { CrmRole } from '@/lib/crmSession';
import type { StaffMember } from '@/lib/kfcStaff';
import { inviteStaffAction, resendInviteAction, setDisabledAction, setPricesAction, setRoleAction, type StaffResult } from './actions';

type RoleOption = { role: CrmRole; label: string; does: string };
const SELECT = 'border-input bg-background h-8 rounded-md border px-2 text-sm';
const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString('nl-NL', { dateStyle: 'medium', timeStyle: 'short' }) : '—');

export default function StaffManager({ staff, me, canManage, roles, monteurNote }: {
  staff: StaffMember[]; me: string; canManage: boolean; roles: RoleOption[]; monteurNote: boolean;
}) {
  const { t } = usePreviewLanguage();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [link, setLink] = useState<{ email: string; url: string } | null>(null);
  const [role, setRole] = useState<CrmRole>('magazijn');
  const labelOf = (r: CrmRole | null) => (r ? t(roles.find((o) => o.role === r)?.label ?? r) : t('geen rol'));

  function act<T>(work: () => Promise<StaffResult<T>>, done: (data: T | undefined) => string) {
    setMessage(null);
    start(async () => {
      const result = await work();
      if (!result.ok) { setMessage({ tone: 'error', text: result.error }); return; }
      setMessage({ tone: 'ok', text: done(result.data) });
      router.refresh();
    });
  }

  function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const email = String(data.get('email') ?? '');
    act(() => inviteStaffAction({
      email, role, password: String(data.get('password') ?? '') || undefined, prices: data.get('prices') === 'on',
    }), (result) => {
      form.reset();
      if (result?.link) { setLink({ email, url: result.link }); return t('Uitgenodigd. Stuur de link hieronder naar de medewerker.'); }
      setLink(null);
      return t('Account aangemaakt met het opgegeven wachtwoord.');
    });
  }

  return (
    <div className="grid gap-4">
      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle><PreviewText>Medewerker uitnodigen</PreviewText></CardTitle>
            <CardDescription><PreviewText>Je krijgt een eenmalige link om zelf te versturen (bijvoorbeeld via WhatsApp). Of vul een wachtwoord in om het account direct klaar te zetten.</PreviewText></CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={invite} className="grid gap-3 md:grid-cols-[2fr_1fr_1.5fr_auto] md:items-end">
              <div className="grid gap-1.5"><Label htmlFor="staff-email"><PreviewText>E-mailadres</PreviewText></Label><Input id="staff-email" name="email" type="email" required autoComplete="off" /></div>
              <div className="grid gap-1.5"><Label htmlFor="staff-role"><PreviewText>Rol</PreviewText></Label>
                <select id="staff-role" className={SELECT + ' h-9'} value={role} onChange={(e) => setRole(e.target.value as CrmRole)}>
                  {roles.map((r) => <option key={r.role} value={r.role}>{t(r.label)}</option>)}
                </select></div>
              <div className="grid gap-1.5"><Label htmlFor="staff-password"><PreviewText>Wachtwoord (optioneel, min. 10 tekens)</PreviewText></Label><Input id="staff-password" name="password" type="password" minLength={10} maxLength={72} autoComplete="new-password" /></div>
              <Button type="submit" disabled={pending}><UserPlus /> <PreviewText>Uitnodigen</PreviewText></Button>
              {role === 'magazijn' && (
                <label className="flex items-center gap-2 text-sm md:col-span-4"><input type="checkbox" name="prices" /> <PreviewText>Mag inkoopprijzen zien</PreviewText></label>
              )}
            </form>
            {link && (
              <div className="mt-3 grid gap-1.5 rounded-md border p-3">
                <p className="text-sm">{t('Link voor')} <strong>{link.email}</strong> ({t('eenmalig te gebruiken')}):</p>
                <div className="flex gap-2">
                  <Input readOnly value={link.url} onFocus={(e) => e.currentTarget.select()} aria-label={t('Uitnodigingslink')} />
                  <Button type="button" variant="outline" onClick={() => navigator.clipboard?.writeText(link.url)}><Copy /> <PreviewText>Kopiëren</PreviewText></Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {message && <p role="status" className={message.tone === 'error' ? 'text-destructive text-sm' : 'text-sm text-emerald-700'}>{message.text}</p>}

      <Card>
        <CardHeader><CardTitle><PreviewText>Accounts</PreviewText> <span className="text-muted-foreground text-sm font-normal">({staff.length})</span></CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><PreviewText>E-mail</PreviewText></TableHead>
                <TableHead><PreviewText>Rol</PreviewText></TableHead>
                <TableHead><PreviewText>Inkoopprijzen</PreviewText></TableHead>
                <TableHead><PreviewText>Status</PreviewText></TableHead>
                <TableHead><PreviewText>Laatst ingelogd</PreviewText></TableHead>
                <TableHead className="text-right"><PreviewText>Acties</PreviewText></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((m) => {
                const self = m.id === me;
                const editable = canManage && !self && m.role !== 'monteur';
                const seesPrices = m.role === 'owner' || m.role === 'kantoor' || (m.role === 'magazijn' && m.pricesAllowed);
                return (
                  <TableRow key={m.id}>
                    <TableCell>{m.email}{self && <Badge variant="outline" className="ml-2">{t('jij')}</Badge>}</TableCell>
                    <TableCell>
                      {editable ? (
                        <select className={SELECT} value={m.role ?? ''} disabled={pending} aria-label={t('Rol')}
                          onChange={(e) => act(() => setRoleAction({ id: m.id, role: e.target.value }), () => t('Rol gewijzigd.'))}>
                          {!m.role && <option value="" disabled>{t('geen rol')}</option>}
                          {roles.map((r) => <option key={r.role} value={r.role}>{t(r.label)}</option>)}
                        </select>
                      ) : labelOf(m.role)}
                    </TableCell>
                    <TableCell>
                      {m.role === 'magazijn' && editable ? (
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={m.pricesAllowed} disabled={pending}
                            onChange={(e) => act(() => setPricesAction({ id: m.id, prices: e.target.checked }), () => t('Opgeslagen.'))} />
                          {m.pricesAllowed ? t('zichtbaar') : t('verborgen')}
                        </label>
                      ) : <span className="text-sm">{seesPrices ? t('zichtbaar') : t('verborgen')}</span>}
                    </TableCell>
                    <TableCell>
                      {m.disabled ? <Badge variant="destructive">{t('Uitgeschakeld')}</Badge>
                        : m.invited ? <Badge variant="secondary">{t('Uitgenodigd')}</Badge>
                          : <Badge variant="outline">{t('Actief')}</Badge>}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{when(m.lastSignIn)}</TableCell>
                    <TableCell className="text-right">
                      {editable && (
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" disabled={pending}
                            onClick={() => act(() => resendInviteAction({ id: m.id }), (url) => { if (url) setLink({ email: m.email, url }); return t('Nieuwe link gemaakt.'); })}>
                            <PreviewText>Nieuwe link</PreviewText>
                          </Button>
                          <Button size="sm" variant={m.disabled ? 'outline' : 'destructive'} disabled={pending}
                            onClick={() => {
                              if (!m.disabled && !window.confirm(`${m.email} ${t('uitschakelen? Inloggen lukt dan niet meer.')}`)) return;
                              act(() => setDisabledAction({ id: m.id, disabled: !m.disabled }), () => (m.disabled ? t('Ingeschakeld.') : t('Uitgeschakeld.')));
                            }}>
                            {m.disabled ? t('Inschakelen') : t('Uitschakelen')}
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {staff.length === 0 && <TableRow><TableCell colSpan={6} className="text-muted-foreground py-6 text-center"><PreviewText>Geen accounts gevonden.</PreviewText></TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle><PreviewText>Wat elke rol mag</PreviewText></CardTitle></CardHeader>
        <CardContent className="grid gap-2 text-sm">
          {roles.map((r) => <p key={r.role}><strong>{t(r.label)}</strong>: {t(r.does)}</p>)}
          {monteurNote && <p className="text-muted-foreground"><PreviewText>Monteurs worden aangemaakt en gekoppeld onder Monteurs.</PreviewText></p>}
        </CardContent>
      </Card>
    </div>
  );
}
