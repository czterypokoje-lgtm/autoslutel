import { Controller, useFormContext, useWatch } from 'react-hook-form';

import { Field, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePreviewLanguage } from '../../../PreviewLanguage';

import { type InvoiceFormValues, invoiceTaxOptions } from './data';

export function InvoiceAdjustments() {
  const { control, register } = useFormContext<InvoiceFormValues>();
  const { t } = usePreviewLanguage();
  const discountType = useWatch({ control, name: 'discountType' });

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-medium tracking-tight">{t('Btw en korting')}</h2>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        <Controller
          control={control}
          name="taxId"
          render={({ field }) => (
            <Field className="gap-1">
              <FieldLabel className="text-xs">{t('Btw')}</FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder={t('Kies btw')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {invoiceTaxOptions.map((taxOption) => (
                      <SelectItem key={taxOption.id} value={taxOption.id}>
                        {t(taxOption.name)} ({taxOption.rate}%)
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          )}
        />

        <div className="grid grid-cols-[1fr_112px] gap-4">
          <Controller
            control={control}
            name="discountType"
            render={({ field }) => (
              <Field className="gap-1">
                <FieldLabel className="text-xs">{t('Korting')}</FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue placeholder={t('Soort korting')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="fixed">{t('Vast bedrag')}</SelectItem>
                      <SelectItem value="percent">{t('Percentage')}</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
          <Field className="gap-1">
            <FieldLabel className="text-xs opacity-0">{t('Waarde')}</FieldLabel>
            <InputGroup>
              <InputGroupInput
                type="number"
                step="0.01"
                min="0"
                aria-label={t('Kortingswaarde')}
                {...register('discountValue', { valueAsNumber: true })}
              />
              <InputGroupAddon align="inline-end">{discountType === 'fixed' ? '€' : '%'}</InputGroupAddon>
            </InputGroup>
          </Field>
        </div>
      </div>
    </section>
  );
}
