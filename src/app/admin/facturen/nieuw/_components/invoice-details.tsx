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

import { dueDateFor, getInvoiceDueDate, type InvoiceFormValues } from './data';

export function InvoiceDetails({ readOnlyIssueDate = false }: { readOnlyIssueDate?: boolean }) {
  const { control, register, getValues, setValue, watch } = useFormContext<InvoiceFormValues>();
  const { t } = usePreviewLanguage();

  /* The due date is issue date + the term chosen here; the API stores that
     date on the invoice and the ledger trigger uses it (0144). */
  const values = watch();
  const dueDate = getInvoiceDueDate(values);

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
          <Controller
            control={control}
            name="issuedDate"
            render={({ field }) => (
              <Field className="gap-1">
                <FieldLabel className="text-xs" htmlFor="issued-date">
                  {t('Factuurdatum')}
                </FieldLabel>
                {/* Editing: /api/admin/invoices/<id> never moves issue_date, so
                    offering a picker here would be a control that silently does
                    nothing. */}
                {readOnlyIssueDate ? (
                  <p className="text-muted-foreground flex h-9 items-center text-sm">
                    {(() => {
                      const issued = parseDateValue(field.value);
                      return issued ? format(issued, 'PPP', { locale: nl }) : '—';
                    })()}
                  </p>
                ) : (
                  <DatePicker
                    id="issued-date"
                    value={field.value}
                    onChange={(value) => {
                      field.onChange(value);
                      setValue('paymentDueDate', dueDateFor(value, getValues('to.termsDays')));
                    }}
                  />
                )}
              </Field>
            )}
          />

          <Field className="gap-1">
            <FieldLabel className="text-xs" htmlFor="terms-days">{t('Betaaltermijn')}</FieldLabel>
            {/* The office picks the term per invoice; the due date follows. The last term used comes back as the default. */}
            <Controller
              control={control}
              name="to.termsDays"
              render={({ field }) => (
                <InputGroup>
                  <InputGroupInput
                    id="terms-days" type="number" min={0} max={180} inputMode="numeric"
                    value={Number.isFinite(field.value) ? field.value : ''}
                    onChange={(e) => {
                      const days = Math.max(0, Math.min(180, Math.floor(Number(e.target.value) || 0)));
                      field.onChange(days);
                      setValue('paymentDueDate', dueDateFor(getValues('issuedDate'), days));
                    }}
                  />
                  <InputGroupAddon align="inline-end">{t('dagen')}</InputGroupAddon>
                </InputGroup>
              )}
            />
            <p className="text-muted-foreground text-xs">{t('Vervaldatum')}: {format(parseISO(dueDate), 'PPP', { locale: nl })}</p>
          </Field>
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
