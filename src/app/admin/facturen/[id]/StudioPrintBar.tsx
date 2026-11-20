'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, Pencil, Printer, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePreviewLanguage } from '@/app/admin/PreviewLanguage';

import styles from './invoice.module.css';

type Status = 'concept' | 'verzonden' | 'betaald';

const STATUS_LABEL: Record<Status, string> = {
  concept: 'Concept',
  verzonden: 'Verzonden',
  betaald: 'Betaald',
};

/**
 * The Studio version of the controls above the sheet — same back link, status
 * PATCH, edit link, print and concept-only delete as PrintButton.tsx.
 *
 * It keeps `styles.bar`: that class is what the print stylesheet hides, and
 * the sheet below it is printed untouched. The row carries its own `bg-card`
 * surface because the sheet page is deliberately light whatever the CRM theme
 * is, and token-coloured buttons need a matching ground to stay readable.
 */
export default function StudioPrintBar({ invoiceId, status }: { invoiceId: string; status: Status }) {
  const router = useRouter();
  const { t } = usePreviewLanguage();
  const [current, setCurrent] = useState<Status>(status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  /* Only a concept can go: a sent or paid factuur carries a number from a
     gap-free sequence and is reversed with a creditfactuur, not removed. */
  async function remove() {
    if (!confirm('Deze conceptfactuur definitief verwijderen?')) return;
    setDeleting(true);
    setError('');

    const response = await fetch(`/api/admin/invoices/${invoiceId}`, { method: 'DELETE' }).catch(() => null);

    if (!response || !response.ok) {
      const body = await response?.json().catch(() => null);
      setError(body?.error ?? 'Verwijderen mislukt.');
      setDeleting(false);
      return;
    }

    router.push('/admin/facturen');
    router.refresh();
  }

  async function changeStatus(next: Status) {
    if (next === current) return;
    setSaving(true);
    setError('');

    const response = await fetch(`/api/admin/invoices/${invoiceId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    }).catch(() => null);

    if (!response || !response.ok) {
      const body = await response?.json().catch(() => null);
      setError(body?.error ?? 'Opslaan mislukt.');
      setSaving(false);
      return;
    }

    setCurrent(next);
    setSaving(false);
    router.refresh();
  }

  return (
    <div className={`${styles.bar} kfc-neutral print:hidden`}>
      <div className="bg-card text-card-foreground ring-foreground/10 flex w-full flex-wrap items-center justify-between gap-2 rounded-xl p-2 ring-1">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/facturen"><ArrowLeft data-icon="inline-start" />{t('Facturen')}</Link>
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          {error && <span className="text-destructive text-xs">{error}</span>}
          <Select value={current} disabled={saving} onValueChange={(value) => void changeStatus(value as Status)}>
            <SelectTrigger size="sm" className="w-36" aria-label="Status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {(Object.keys(STATUS_LABEL) as Status[]).map((option) => (
                  <SelectItem key={option} value={option}>{t(STATUS_LABEL[option])}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/facturen/${invoiceId}/bewerken`}><Pencil data-icon="inline-start" />{t('Bewerken')}</Link>
          </Button>
          <Button size="sm" onClick={() => window.print()}>
            <Printer data-icon="inline-start" />Afdrukken / Opslaan als PDF
          </Button>
          {current === 'concept' && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              disabled={deleting}
              title="Alleen een concept kan worden verwijderd"
              onClick={() => void remove()}
            >
              <Trash2 data-icon="inline-start" />{t(deleting ? 'Verwijderen…' : 'Verwijderen')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
