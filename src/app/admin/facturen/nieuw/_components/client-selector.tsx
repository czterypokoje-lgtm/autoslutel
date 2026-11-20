import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Controller, useFormContext } from 'react-hook-form';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getInitials } from '@/lib/utils';
import { usePreviewLanguage } from '../../../PreviewLanguage';

import { type CustomerOption, customerToDetails, dueDateFor, type InvoiceFormValues, WALK_IN_ID, walkInClient } from './data';
import { TextField } from './invoice-form';

export function ClientSelector({ customers }: { customers: CustomerOption[] }) {
  const { control, getValues, setValue } = useFormContext<InvoiceFormValues>();
  const { t } = usePreviewLanguage();
  const walkInLabel = t('Particulier / contant');

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-medium tracking-tight">{t('Factuur aan')}</h2>
        <Button type="button" variant="ghost" size="sm" asChild>
          <Link href="/admin/klanten">
            <Plus data-icon="inline-start" />
            {t('Nieuwe klant')}
          </Link>
        </Button>
      </div>

      <Controller
        control={control}
        name="to"
        render={({ field }) => {
          const selectedClient = field.value;
          const isWalkIn = selectedClient.id === WALK_IN_ID;

          return (
            <>
              <Field className="gap-1">
                <FieldLabel className="text-xs">{t('Klant')}</FieldLabel>
                <Select
                  value={selectedClient.id}
                  onValueChange={(clientId) => {
                    const customer = customers.find((item) => item.id === clientId);
                    const next = customer ? customerToDetails(customer) : walkInClient;
                    field.onChange(next);
                    setValue('paymentDueDate', dueDateFor(getValues('issuedDate'), next.termsDays));
                  }}
                >
                  <SelectTrigger className="w-full data-[size=default]:h-auto">
                    <SelectValue placeholder={t('Kies klant')}>
                      <div className="flex items-center gap-1.5">
                        <Avatar className="after:rounded-md">
                          <AvatarFallback className="bg-card text-foreground rounded-md">
                            {getInitials(isWalkIn ? walkInLabel.replace(/[^\p{L}\s]/gu, '') : selectedClient.name).slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="text-left text-xs">
                          <div>{isWalkIn ? walkInLabel : selectedClient.name}</div>
                          <div className="text-muted-foreground">
                            {isWalkIn ? t('Geen rekening — gegevens hieronder') : selectedClient.email || `${t('Betaaltermijn')} ${selectedClient.termsDays} ${t('dagen')}`}
                          </div>
                        </div>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectGroup>
                      <SelectItem value={WALK_IN_ID}>{walkInLabel}</SelectItem>
                      {customers.map((clientOption) => (
                        <SelectItem key={clientOption.id} value={clientOption.id}>
                          {clientOption.company}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              {isWalkIn && (
                <div className="grid gap-5 md:grid-cols-2">
                  <TextField name="to.name" label={`${t('Naam')} *`} />
                  <TextField name="to.email" label={t('E-mail')} type="email" />
                  <TextField name="to.street" label={t('Straat + nummer')} />
                  <TextField name="to.btw" label={t('Btw-nummer')} />
                  <TextField name="to.postcode" label={t('Postcode')} />
                  <TextField name="to.city" label={t('Plaats')} />
                </div>
              )}
            </>
          );
        }}
      />
    </section>
  );
}
