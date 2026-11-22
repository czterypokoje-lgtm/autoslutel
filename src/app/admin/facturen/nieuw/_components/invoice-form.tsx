import { useFormContext } from 'react-hook-form';

import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { usePreviewLanguage } from '../../../PreviewLanguage';

import { ClientSelector } from './client-selector';
import type { CustomerOption, InvoiceFormValues, PreviousClientOption } from './data';
import { InvoiceAdjustments } from './invoice-adjustments';
import { InvoiceDetails } from './invoice-details';
import { InvoiceItems } from './invoice-items';

export function InvoiceForm({ customers, freeTextClient, previousClients, technicians, readOnlyIssueDate, quickAddPriceList }: {
  customers: CustomerOption[];
  /** Autosleutel24 mode — see ClientSelector. */
  freeTextClient?: boolean;
  previousClients?: PreviousClientOption[];
  technicians?: { id: string; name: string }[];
  /** Editing: the PATCH route never moves issue_date, so it is shown, not offered. */
  readOnlyIssueDate?: boolean;
  /** Autosleutel24: the office price list as ready-made lines. */
  quickAddPriceList?: boolean;
}) {
  const { t } = usePreviewLanguage();

  return (
    <div className="bg-card flex flex-col gap-4 rounded-xl border p-4">
      <Tabs defaultValue="invoice" className="gap-4">
        <TabsList className="w-full">
          <TabsTrigger value="invoice">{t('Factuur')}</TabsTrigger>
          <TabsTrigger value="payment">{t('Betaling')}</TabsTrigger>
          <TabsTrigger value="business">{t('Bedrijf')}</TabsTrigger>
        </TabsList>

        <TabsContent value="invoice" className="flex flex-col gap-4">
          <InvoiceDetails readOnlyIssueDate={readOnlyIssueDate} />
          <Separator />
          <ClientSelector customers={customers} freeText={freeTextClient} previousClients={previousClients} technicians={technicians} />
          <Separator />
          <InvoiceItems quickAddPriceList={quickAddPriceList} />
          <Separator />
          <InvoiceAdjustments />
        </TabsContent>

        <TabsContent value="payment" className="flex flex-col gap-4">
          <h2 className="font-medium tracking-tight">{t('Betaalgegevens')}</h2>
          <div className="grid gap-5 md:grid-cols-2">
            <TextField name="from.iban" label="IBAN" />
            <TextField name="from.accountName" label={t('Ten name van')} />
            <TextField name="creditApplied" label={t('Credit toegepast (€)')} type="number" step="0.01" />
          </div>
          <NotesField />
        </TabsContent>

        <TabsContent value="business" className="flex flex-col gap-4">
          <h2 className="font-medium tracking-tight">{t('Uw bedrijf')}</h2>
          <div className="grid gap-5 md:grid-cols-2">
            <TextField name="from.name" label={t('Bedrijfsnaam')} />
            <TextField name="from.email" label={t('E-mail')} type="email" />
            <TextField name="from.street" label={t('Straat + nummer')} />
            <TextField name="from.phone" label={t('Telefoon')} />
            <TextField name="from.postcode" label={t('Postcode')} />
            <TextField name="from.city" label={t('Plaats')} />
            <TextField name="from.kvk" label="KvK" />
            <TextField name="from.btw" label={t('Btw-nummer')} />
            <TextField name="from.website" label="Website" />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

type TextPath = 'from.iban' | 'from.accountName' | 'creditApplied' | 'from.name' | 'from.email' | 'from.street' | 'from.phone'
  | 'from.postcode' | 'from.city' | 'from.kvk' | 'from.btw' | 'from.website'
  | 'to.name' | 'to.email' | 'to.street' | 'to.postcode' | 'to.city' | 'to.btw' | 'to.phone';

export function TextField({ name, label, type = 'text', step }: { name: TextPath; label: string; type?: string; step?: string }) {
  const { register } = useFormContext<InvoiceFormValues>();
  const id = `f-${name.replace('.', '-')}`;
  return (
    <Field className="gap-1">
      <FieldLabel className="text-xs" htmlFor={id}>{label}</FieldLabel>
      <Input id={id} type={type} step={step} {...register(name, type === 'number' ? { valueAsNumber: true } : undefined)} />
    </Field>
  );
}

function NotesField() {
  const { register } = useFormContext<InvoiceFormValues>();
  const { t } = usePreviewLanguage();
  return (
    <Field className="gap-1">
      <FieldLabel className="text-xs" htmlFor="f-notes">{t('Notitie (verschijnt onderaan de factuur)')}</FieldLabel>
      <Textarea id="f-notes" rows={3} {...register('notes')} />
    </Field>
  );
}
