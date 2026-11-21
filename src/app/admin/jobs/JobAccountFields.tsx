'use client';

import { useState } from 'react';
import { usePreviewLanguage } from '@/app/admin/PreviewLanguage';
import type { JobAccountOption } from '@/lib/jobAccounts';

export default function JobAccountFields({ accounts, onSelect }: {
  accounts: JobAccountOption[];
  onSelect: (accountId: string, contactId: string, name?: string, phone?: string) => void;
}) {
  const [id, setId] = useState('');
  const [person, setPerson] = useState('');
  const { t } = usePreviewLanguage();
  const account = accounts.find((row) => row.id === id);
  if (!accounts.length) return null;

  return <div className="grid gap-3 rounded-lg border p-3 sm:grid-cols-2">
    <label className="grid gap-1 text-sm">
      {t('Aan wie factureren we?')}
      <select className="border-input bg-background w-full rounded-md border p-2" value={id} onChange={(event) => {
        const chosen = accounts.find((row) => row.id === event.target.value);
        setId(event.target.value);
        setPerson('');
        onSelect(event.target.value, '', chosen?.account_kind === 'person' ? chosen.company : (person || account?.account_kind === 'person' ? '' : undefined),
          chosen?.account_kind === 'person' ? chosen.phone ?? '' : (person || account?.account_kind === 'person' ? '' : undefined));
      }}>
        <option value="">{t('Geen gekoppeld klantaccount')}</option>
        {accounts.map((row) => <option key={row.id} value={row.id}>{row.company} · {t(row.account_kind === 'company' ? 'Bedrijf' : 'Particulier')}</option>)}
      </select>
    </label>
    {account?.account_kind === 'company' && <label className="grid gap-1 text-sm">
      {t('Met wie nemen we contact op?')}
      <select className="border-input bg-background w-full rounded-md border p-2" value={person} onChange={(event) => {
        const chosen = account.contacts.find((row) => row.id === event.target.value);
        setPerson(event.target.value);
        onSelect(id, event.target.value, chosen?.name ?? "", chosen?.phone ?? "");
      }}>
        <option value="">{t('Contactgegevens handmatig invullen')}</option>
        {account.contacts.map((row) => <option key={row.id} value={row.id}>{row.name} · {row.position}</option>)}
      </select>
    </label>}
  </div>;
}
