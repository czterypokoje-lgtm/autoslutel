'use client';

import { useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { PreviewText, usePreviewLanguage } from '@/app/admin/PreviewLanguage';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ACCOUNT_PROBLEMS, accountProblem, normalizeIban, normalizeKvk, normalizeVat } from '@/lib/accountValidation';
import type { Supplier, SupplierEntryType } from '@/lib/kfcSuppliers';

/* Shared bits of the supplier screens (crediteuren, 0130). */

export const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
export const money = (cents: number | null | undefined) => (cents == null ? '—' : MONEY.format(cents / 100));
export const api = '/api/admin/leveranciers';

export const ENTRY_LABEL: Record<SupplierEntryType, string> = {
  invoice: 'Inkoopfactuur', payment: 'Betaling', credit_note: 'Creditnota', refund: 'Terugbetaling ontvangen',
  opening: 'Beginsaldo', write_off: 'Afgeboekt', reversal: 'Tegenboeking',
};

/** "12,50" or "12.50" or "1.234,50" → cents; '' → null; NaN when unreadable. */
export function toCents(value: string): number | null {
  const raw = value.replace(/[€\s]/g, '');
  if (!raw) return null;
  const normal = raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw;
  return Math.round(Number(normal) * 100);
}

export async function post(body: unknown): Promise<{ error?: string; id?: string | number }> {
  const response = await fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => null);
  const data = await response?.json().catch(() => null);
  return response?.ok ? (data ?? {}) : { error: data?.error ?? 'Opslaan mislukt.' };
}

const FIELDS: [keyof Supplier, string, React.ComponentProps<typeof Input>?, boolean?][] = [
  ['name', 'Naam leverancier', { required: true, maxLength: 160 }, true],
  ['contact_name', 'Contactpersoon', { maxLength: 120 }],
  ['phone', 'Telefoon', { type: 'tel', maxLength: 40 }],
  ['email', 'E-mail (algemeen / facturen)', { type: 'email', maxLength: 200 }],
  ['order_email', 'Bestel-e-mail', { type: 'email', maxLength: 200 }],
  ['kvk', 'KvK-nummer', { inputMode: 'numeric', maxLength: 10, placeholder: '12345678' }],
  ['vat_number', 'Btw-nummer', { maxLength: 20, placeholder: 'NL123456789B01' }],
  ['iban', 'IBAN', { maxLength: 42 }],
  ['bic', 'BIC', { maxLength: 11 }],
  ['street', 'Straat en huisnummer', { maxLength: 200 }, true],
  ['postcode', 'Postcode', { maxLength: 20 }],
  ['city', 'Plaats', { maxLength: 100 }],
  ['country', 'Land (code)', { maxLength: 2, required: true, pattern: '[A-Za-z]{2}' }],
  ['website', 'Website', { maxLength: 200 }],
  ['terms_days', 'Betalingstermijn (dagen)', { type: 'number', min: 0, max: 180, required: true }],
  ['lead_time_days', 'Levertijd (dagen)', { type: 'number', min: 0, max: 365 }],
  ['customer_number', 'Ons klantnummer bij leverancier', { maxLength: 60 }],
  ['note', 'Notitie', { maxLength: 1000 }, true],
];

/** New supplier, or edit an existing one. KvK, BTW and IBAN are optional but checked when filled. */
export function SupplierDialog({ supplier, onSaved, trigger }: { supplier?: Supplier; onSaved: (id: string) => void; trigger?: React.ReactNode }) {
  const { t } = usePreviewLanguage();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function save(e: React.FormEvent<HTMLFormElement>) {
    // The dialog may sit inside another form (the purchase order): React events cross the portal, so stop here.
    e.preventDefault(); e.stopPropagation(); setError('');
    const form = new FormData(e.currentTarget);
    const get = (key: string) => String(form.get(key) ?? '').trim();
    const minOrder = toCents(get('min_order'));
    const payload = {
      ...Object.fromEntries(FIELDS.map(([key]) => [key, get(key)])),
      terms_days: Number(get('terms_days') || 30), lead_time_days: get('lead_time_days') === '' ? null : Number(get('lead_time_days')),
      min_order_cents: minOrder, active: form.get('active') === 'on',
    };
    const problem = accountProblem({
      kind: null, name: get('name'), kvk: normalizeKvk(get('kvk')), vat_number: normalizeVat(get('vat_number')), street: get('street'), postcode: get('postcode'),
      city: get('city'), country: get('country').toUpperCase(), invoice_email: '', email: get('email'), iban: normalizeIban(get('iban')),
      terms_days: payload.terms_days, credit_limit_cents: null,
    }, 180);
    if (problem) { setError(ACCOUNT_PROBLEMS[problem]); return; }
    if (minOrder !== null && !Number.isFinite(minOrder)) { setError('Controleer het minimale orderbedrag.'); return; }
    setBusy(true);
    const result = await post(supplier ? { action: 'update', id: supplier.id, supplier: payload } : { action: 'create', supplier: payload });
    setBusy(false);
    if (result.error) { setError(result.error); return; }
    setOpen(false);
    onSaved(supplier?.id ?? String(result.id));
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); setError(''); }}>
      <DialogTrigger asChild>
        {trigger ?? (supplier
          ? <Button variant="outline" size="sm"><Pencil className="size-4" /> <PreviewText>Gegevens wijzigen</PreviewText></Button>
          : <Button size="sm"><Plus className="size-4" /> <PreviewText>Nieuwe leverancier</PreviewText></Button>)}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{supplier ? supplier.name : t('Nieuwe leverancier')}</DialogTitle>
          <DialogDescription><PreviewText>KvK, btw en IBAN zijn optioneel, maar worden gecontroleerd als ze zijn ingevuld.</PreviewText></DialogDescription>
        </DialogHeader>
        <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
          {FIELDS.map(([key, label, props, wide]) => (
            <div key={key} className={`grid gap-1.5 ${wide ? 'sm:col-span-2' : ''}`}>
              <Label htmlFor={`s-${key}`}>{t(label)}{props?.required && <span aria-hidden className="text-destructive"> *</span>}</Label>
              <Input id={`s-${key}`} name={key} {...props}
                defaultValue={supplier ? String(supplier[key] ?? '') : key === 'terms_days' ? '30' : key === 'country' ? 'NL' : ''} />
            </div>
          ))}
          <div className="grid gap-1.5">
            <Label htmlFor="s-min-order">{t('Minimaal orderbedrag €')}</Label>
            <Input id="s-min-order" name="min_order" inputMode="decimal" defaultValue={supplier?.min_order_cents != null ? String(supplier.min_order_cents / 100).replace('.', ',') : ''} />
          </div>
          <label className="flex items-center gap-2 self-end text-sm">
            <input type="checkbox" name="active" className="size-4" defaultChecked={supplier?.active ?? true} /> {t('Actief (kiesbaar op inkooporders)')}
          </label>
          {error && <p role="alert" className="text-destructive text-sm sm:col-span-2">{t(error)}</p>}
          <div className="sm:col-span-2"><Button disabled={busy}><PreviewText>{supplier ? 'Opslaan' : 'Leverancier aanmaken'}</PreviewText></Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
