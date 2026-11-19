import * as React from 'react';

import { format, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';
import { CalendarIcon, Hash } from 'lucide-react';
import { Controller, useFormContext } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { usePreviewLanguage } from '../../../PreviewLanguage';

import { dueDateFor, type InvoiceFormValues } from './data';

export function InvoiceDetails() {
  const { control, register, getValues, setValue } = useFormContext<InvoiceFormValues>();
  const { t } = usePreviewLanguage();

  const dateFields: Array<{ id: string; label: string; name: 'issuedDate' | 'paymentDueDate' }> = [
    { id: 'issued-date', label: t('Factuurdatum'), name: 'issuedDate' },
    { id: 'payment-due-date', label: t('Vervaldatum'), name: 'paymentDueDate' },
  ];

  return (
    <section className="flex flex-col gap-3">
      <FieldGroup>
        <Field className="gap-1">
          <FieldLabel className="text-xs" htmlFor="reference-number">
            {t('Factuurnummer')}
          </FieldLabel>
          <InputGroup>
            {/* Numbered by the database on save; shown here so the layout matches the template. */}
            <InputGroupInput id="reference-number" disabled placeholder={t('Automatisch bij opslaan')} {...register('referenceNumber')} />
            <InputGroupAddon align="inline-end">
              <Hash />
            </InputGroupAddon>
          </InputGroup>
        </Field>

        <div className="grid gap-5 md:grid-cols-2">
          {dateFields.map((dateField) => (
            <Controller
              key={dateField.name}
              control={control}
              name={dateField.name}
              render={({ field }) => (
                <Field className="gap-1">
                  <FieldLabel className="text-xs" htmlFor={dateField.id}>
                    {dateField.label}
                  </FieldLabel>
                  <DatePicker
                    id={dateField.id}
                    value={field.value}
                    onChange={(value) => {
                      field.onChange(value);
                      // Moving the invoice date keeps the payment term; the due date can still be overridden afterwards.
                      if (dateField.name === 'issuedDate') setValue('paymentDueDate', dueDateFor(value, getValues('to.termsDays')));
                    }}
                  />
                </Field>
              )}
            />
          ))}
        </div>
      </FieldGroup>
    </section>
  );
}

function DatePicker({ id, value, onChange }: { id: string; value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = React.useState(false);
  const { t } = usePreviewLanguage();
  const date = parseDateValue(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          data-empty={!date}
          className="data-[empty=true]:text-muted-foreground w-full justify-between text-left font-normal"
        >
          {date ? format(date, 'PPP', { locale: nl }) : <span>{t('Kies een datum')}</span>}
          <CalendarIcon className="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Calendar
          className="w-full"
          mode="single"
          locale={nl}
          selected={date}
          onSelect={(selectedDate) => {
            if (!selectedDate) return;
            onChange(format(selectedDate, 'yyyy-MM-dd'));
            setOpen(false);
          }}
          defaultMonth={date}
        />
      </PopoverContent>
    </Popover>
  );
}

function parseDateValue(value: string) {
  const date = parseISO(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}
