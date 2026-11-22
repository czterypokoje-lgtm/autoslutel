import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Controller, useFormContext } from 'react-hook-form';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getInitials } from '@/lib/utils';
import { usePreviewLanguage } from '../../../PreviewLanguage';

import {
  type CustomerOption, customerToDetails, dueDateFor, type InvoiceFormValues, type PreviousClientOption,
  previousClientToDetails, WALK_IN_ID, walkInClient,
} from './data';
import { TextField } from './invoice-form';

/* Radix Select has no empty-string value, so "nothing picked" needs a sentinel. */
const NO_PREVIOUS = 'none';
const NO_TECHNICIAN = 'none';

export function ClientSelector({ customers, freeText = false, previousClients, technicians }: {
  customers: CustomerOption[];
  /** Autosleutel24: no ledger accounts — the client is typed in, optionally copied off an earlier invoice. */
  freeText?: boolean;
  previousClients?: PreviousClientOption[];
  /** Present only for an office user who may bill on a monteur's behalf. */
  technicians?: { id: string; name: string }[];
}) {
  const { control, getValues, setValue } = useFormContext<InvoiceFormValues>();
  const { t } = usePreviewLanguage();
  const walkInLabel = t('Particulier / contant');
  /* A nameless row can't be a Select value (Radix) and would prefill nothing. */
  const knownClients = (previousClients ?? []).filter((client) => client.client_name?.trim());

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-medium tracking-tight">{t('Factuur aan')}</h2>
        {!freeText && (
          <Button type="button" variant="ghost" size="sm" asChild>
            <Link href="/admin/klanten">
              <Plus data-icon="inline-start" />
              {t('Nieuwe klant')}
            </Link>
          </Button>
        )}
      </div>

      <Controller
        control={control}
        name="to"
        render={({ field }) => {
          const selectedClient = field.value;
          const isWalkIn = selectedClient.id === WALK_IN_ID;

          /* Autosleutel24: the fields are always shown; the dropdown only
             prefills them from a client that was billed before. */
          if (freeText) {
            return (
              <>
                {knownClients.length > 0 && (
                  <Field className="gap-1">
                    <FieldLabel className="text-xs">{t('Kies bekende klant')}</FieldLabel>
                    <Select
                      value={NO_PREVIOUS}
                      onValueChange={(name) => {
                        const previous = knownClients.find((client) => client.client_name === name);
                        if (!previous) return;
                        field.onChange(previousClientToDetails(previous, selectedClient.termsDays));
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        <SelectGroup>
                          <SelectItem value={NO_PREVIOUS}>{t('Nieuwe klant invullen')}</SelectItem>
                          {knownClients.map((client) => (
                            <SelectItem key={client.client_name} value={client.client_name}>
                              {client.client_name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                )}

                <div className="grid gap-5 md:grid-cols-2">
                  <TextField name="to.name" label={`${t('Naam / Bedrijf')} *`} />
                  <TextField name="to.email" label={t('E-mail')} type="email" />
                  <TextField name="to.street" label={t('Straat + nummer')} />
                  <TextField name="to.phone" label={t('Telefoon')} />
                  <TextField name="to.postcode" label={t('Postcode')} />
                  <TextField name="to.city" label={t('Plaats')} />
                  <TextField name="to.btw" label={t('Btw-nummer')} />
                </div>

                {technicians && (
                  <Controller
                    control={control}
                    name="technicianId"
                    render={({ field: technicianField }) => (
                      <Field className="gap-1">
                        <FieldLabel className="text-xs">Op naam van monteur (optioneel)</FieldLabel>
                        <Select
                          value={technicianField.value || NO_TECHNICIAN}
                          onValueChange={(value) => technicianField.onChange(value === NO_TECHNICIAN ? '' : value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent position="popper">
                            <SelectGroup>
                              <SelectItem value={NO_TECHNICIAN}>— geen —</SelectItem>
                              {technicians.map((technician) => (
                                <SelectItem key={technician.id} value={technician.id}>{technician.name}</SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <FieldDescription className="text-xs">
                          Niet wie de factuur maakte — voor wie hij is. Dit zet hem in het eigen Facturen-scherm van die monteur.
                        </FieldDescription>
                      </Field>
                    )}
                  />
                )}
              </>
            );
          }

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
