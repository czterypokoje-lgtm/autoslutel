'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Save, Send } from 'lucide-react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { usePreviewLanguage } from '../../../PreviewLanguage';

import {
  type CustomerOption, getInvoiceItems, customerToDetails, defaultInvoiceValues, type InvoiceFormValues, type InvoiceFromDetails,
  toApiPayload, walkInClient,
} from './data';
import { InvoiceForm } from './invoice-form';
import { InvoicePreview } from './invoice-preview';

type SaveAs = 'concept' | 'verzonden';

export function Invoice({ customers, from, initialCustomerId }: {
  customers: CustomerOption[];
  from: InvoiceFromDetails;
  initialCustomerId: string | null;
}) {
  const router = useRouter();
  const { t } = usePreviewLanguage();
  const [busy, setBusy] = React.useState<SaveAs | null>(null);
  const [error, setError] = React.useState('');

  const initialCustomer = customers.find((c) => c.id === initialCustomerId) ?? customers[0];
  const form = useForm<InvoiceFormValues>({
    defaultValues: defaultInvoiceValues(from, initialCustomer ? customerToDetails(initialCustomer) : walkInClient),
  });
  const invoice = useWatch({ control: form.control }) as InvoiceFormValues;

  async function save(status: SaveAs) {
    setError('');
    const values = form.getValues();
    if (!values.to.name.trim()) return setError(t('Naam van de klant is verplicht.'));
    if (!getInvoiceItems(values).length) return setError(t('Voeg minstens één regel toe met een omschrijving, aantal en prijs.'));

    setBusy(status);
    const response = await fetch('/api/admin/invoices', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(toApiPayload(values)),
    }).catch(() => null);
    const body = await response?.json().catch(() => null);
    if (!response?.ok || !body?.id) {
      setError(body?.error ?? t('Opslaan mislukt.'));
      setBusy(null);
      return;
    }
    if (status === 'verzonden') {
      // Leaving 'concept' is what posts the invoice to the customer's account (trigger kfc_post_invoice).
      const sent = await fetch(`/api/admin/invoices/${body.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'verzonden' }),
      }).catch(() => null);
      if (!sent?.ok) {
        setError(t('Factuur opgeslagen als concept, maar verzenden mislukte. Zet de status op de factuurpagina.'));
      }
    }
    router.push(`/admin/facturen/${body.id}`);
  }

  return (
    <FormProvider {...form}>
      <div className="kfc-neutral flex flex-col gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl leading-none font-medium tracking-tight">{t('Nieuwe factuur')}</h1>
            <p className="text-muted-foreground text-sm">
              {t('Vul de factuur in, controleer het voorbeeld en verstuur hem naar de klant.')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" disabled={busy !== null} onClick={() => save('concept')}>
              <Save data-icon="inline-start" />
              {busy === 'concept' ? t('Opslaan…') : t('Opslaan als concept')}
            </Button>
            <Button type="button" disabled={busy !== null} onClick={() => save('verzonden')}>
              <Send data-icon="inline-start" />
              {busy === 'verzonden' ? t('Verzenden…') : t('Factuur verzenden')}
            </Button>
          </div>
        </div>

        {error && <p role="alert" className="text-destructive text-sm">{error}</p>}

        <form className="grid gap-5 xl:grid-cols-2" noValidate onSubmit={(event) => event.preventDefault()}>
          <InvoiceForm customers={customers} />
          <InvoicePreview invoice={invoice} />
        </form>
      </div>
    </FormProvider>
  );
}
