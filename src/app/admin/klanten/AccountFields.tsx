'use client';

import { useState } from 'react';
import { usePreviewLanguage } from '@/app/admin/PreviewLanguage';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isEuCountry } from '@/lib/accountValidation';

/**
 * The fields of one customer account (cari), shared by the KeyForCars cari
 * dialog and the relaties screen, so there is one form and one validation
 * (accountValidation.accountProblem, enforced again on the server). Choosing
 * "Bedrijf" makes KvK (Dutch companies), BTW, address and invoice e-mail
 * required. Inputs are uncontrolled and named after the kfc_customers
 * columns; customerFromForm() reads them back.
 */
export interface AccountDefaults {
  account_kind?: 'person' | 'company' | null; company?: string | null; contact_name?: string | null; phone?: string | null; email?: string | null;
  kvk?: string | null; vat_number?: string | null; invoice_email?: string | null; iban?: string | null; bic?: string | null; website?: string | null;
  street?: string | null; postcode?: string | null; city?: string | null; country?: string | null; terms_days?: number | null;
  credit_limit_cents?: number | null; reverse_charge?: boolean | null; note?: string | null;
}

export default function AccountFields({ initial = {}, defaultKind = 'company', idPrefix = 'acc' }: { initial?: AccountDefaults; defaultKind?: 'person' | 'company'; idPrefix?: string }) {
  const { t } = usePreviewLanguage();
  const [kind, setKind] = useState<'person' | 'company'>(initial.account_kind ?? defaultKind);
  const [country, setCountry] = useState((initial.country ?? 'NL').toUpperCase());
  const company = kind === 'company';
  const dutch = country === 'NL';
  const id = (key: string) => `${idPrefix}-${key}`;
  const field = (key: keyof AccountDefaults, label: string, props: React.ComponentProps<typeof Input> = {}, wide = false) => (
    <div className={`grid gap-1.5 ${wide ? 'sm:col-span-2' : ''}`}>
      <Label htmlFor={id(key)}>{t(label)}{props.required && <span aria-hidden className="text-destructive"> *</span>}</Label>
      <Input id={id(key)} name={key} defaultValue={initial[key] == null ? undefined : String(initial[key])} {...props} />
    </div>
  );

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="grid gap-1.5 sm:col-span-2">
        <Label htmlFor={id('kind')}>{t('Soort account')}</Label>
        <select id={id('kind')} name="account_kind" value={kind} onChange={(e) => setKind(e.target.value as 'person' | 'company')}
          className="border-input bg-background h-9 rounded-md border px-3 text-sm">
          <option value="company">{t('Bedrijf')}</option>
          <option value="person">{t('Particulier')}</option>
        </select>
      </div>
      {field('company', company ? 'Bedrijfsnaam (statutair)' : 'Naam', { required: true, maxLength: 160 }, true)}
      {company && field('contact_name', 'Contactpersoon', { maxLength: 120 })}
      {field('phone', 'Telefoon', { type: 'tel', maxLength: 40, placeholder: '+31…' })}
      {field('email', 'E-mail', { type: 'email', maxLength: 200 })}
      {company && <>
        {field('kvk', 'KvK-nummer', { required: dutch, inputMode: 'numeric', pattern: '\\s*\\d{4}\\s?\\d{4}\\s*', maxLength: 10, placeholder: '12345678', title: t('8 cijfers') })}
        {field('vat_number', 'Btw-nummer', { required: true, maxLength: 20, placeholder: dutch ? 'NL123456789B01' : 'DE123456789', title: dutch ? 'NL123456789B01' : undefined,
          pattern: dutch ? '\\s*[Nn][Ll]\\s?\\d{9}\\s?[Bb]\\s?\\d{2}\\s*' : undefined })}
        {field('invoice_email', 'Factuur-e-mail', { type: 'email', required: true, maxLength: 200, placeholder: 'facturen@…' })}
        {field('iban', 'IBAN', { maxLength: 42, placeholder: 'NL00 BANK 0123 4567 89' })}
        {field('bic', 'BIC', { maxLength: 11 })}
        {field('website', 'Website', { maxLength: 200 })}
      </>}
      {field('street', 'Straat en huisnummer', { required: company, maxLength: 200 }, true)}
      {field('postcode', 'Postcode', { required: company, maxLength: 20, placeholder: dutch ? '1234 AB' : undefined })}
      {field('city', 'Plaats', { required: company, maxLength: 100 })}
      <div className="grid gap-1.5">
        <Label htmlFor={id('country')}>{t('Land (code)')}</Label>
        <Input id={id('country')} name="country" required maxLength={2} pattern="[A-Za-z]{2}" value={country} onChange={(e) => setCountry(e.target.value.toUpperCase())} />
      </div>
      {field('terms_days', 'Betalingstermijn (dagen)', { type: 'number', min: 0, max: 120, required: true, defaultValue: String(initial.terms_days ?? 30) })}
      <div className="grid gap-1.5">
        <Label htmlFor={id('credit_limit')}>{t('Kredietlimiet € (leeg = geen)')}</Label>
        <Input id={id('credit_limit')} name="credit_limit" inputMode="decimal" defaultValue={initial.credit_limit_cents != null ? String(initial.credit_limit_cents / 100).replace('.', ',') : ''} />
      </div>
      {company && (
        <label className="flex items-center gap-2 self-end text-sm">
          <input type="checkbox" name="reverse_charge" className="size-4" defaultChecked={initial.reverse_charge ?? (!dutch && isEuCountry(country))} />
          {t('Btw verlegd (EU-bedrijf)')}
        </label>
      )}
      {field('note', 'Notitie', { maxLength: 500 }, true)}
    </div>
  );
}
