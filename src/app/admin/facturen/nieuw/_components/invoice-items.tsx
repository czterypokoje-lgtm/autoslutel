import * as React from 'react';

import { RestrictToVerticalAxis } from '@dnd-kit/abstract/modifiers';
import { DragDropProvider, type DragEndEvent } from '@dnd-kit/react';
import { isSortable, useSortable } from '@dnd-kit/react/sortable';
import { cn } from 'cn';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import type { UseFormRegister } from 'react-hook-form';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';
import { usePreviewLanguage } from '../../../PreviewLanguage';

import { getLineAmount, type InvoiceFormValues, type InvoiceLineItem } from './data';

const PICK_PRICE = 'none';

export function InvoiceItems({ quickAddPriceList = false }: { quickAddPriceList?: boolean }) {
  const { control, register, setValue } = useFormContext<InvoiceFormValues>();
  const { t } = usePreviewLanguage();
  const { append, fields, move, remove } = useFieldArray({
    control,
    name: 'items',
    keyName: 'fieldKey',
  });
  const items = useWatch({ control, name: 'items' }) ?? [];
  const { priceList, priceListError } = usePriceList(quickAddPriceList);

  /* Picking a price fills the first still-blank line, or appends one — exactly
     what the old form's "Snel toevoegen vanuit prijslijst" did. */
  function addFromPriceList(description: string) {
    const template = priceList.find((entry) => entry.description === description);
    if (!template) return;
    const blankIndex = items.findIndex((item) => !item?.description?.trim());
    if (blankIndex === -1) {
      append({ id: `item-${Date.now()}`, description: template.description, quantity: 1, unitPrice: template.price });
      return;
    }
    setValue(`items.${blankIndex}.description`, template.description);
    setValue(`items.${blankIndex}.unitPrice`, template.price);
    setValue(`items.${blankIndex}.quantity`, items[blankIndex]?.quantity || 1);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { source } = event.operation;
    if (event.canceled || !isSortable(source) || source.initialIndex === source.index) return;
    move(source.initialIndex, source.index);
  }

  function handleAddItem() {
    append({ id: `item-${Date.now()}`, description: '', quantity: 1, unitPrice: 0 });
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-medium tracking-tight">{t('Factuurregels')}</h2>
        <Button type="button" variant="ghost" size="sm" onClick={handleAddItem}>
          <Plus data-icon="inline-start" />
          {t('Regel toevoegen')}
        </Button>
      </div>

      {priceListError && <p className="text-destructive text-sm">{priceListError}</p>}
      {priceList.length > 0 && (
        <Field className="gap-1">
          <FieldLabel className="text-xs">{t('Snel toevoegen vanuit prijslijst')}</FieldLabel>
          <Select value={PICK_PRICE} onValueChange={addFromPriceList}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectGroup>
                <SelectItem value={PICK_PRICE}>— kies een auto/dienst —</SelectItem>
                {priceList.map((entry) => (
                  <SelectItem key={entry.description} value={entry.description}>
                    {entry.description} — {formatInvoiceCurrency(entry.price)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      )}

      <div className="flex flex-col gap-2">
        <div className="text-muted-foreground hidden items-center gap-2 px-1 text-xs font-medium md:grid md:grid-cols-[24px_minmax(0,1fr)_64px_112px_112px_32px]">
          <span />
          <span>{t('Omschrijving')}</span>
          <span className="px-2">{t('Aantal')}</span>
          <span className="px-2">{t('Prijs')}</span>
          <span className="text-right">{t('Regeltotaal')}</span>
          <span />
        </div>

        <DragDropProvider onDragEnd={handleDragEnd}>
          <div className="flex flex-col gap-3">
            {fields.map((field, index) => (
              <SortableInvoiceItemRow
                key={field.id}
                id={field.id}
                index={index}
                item={items[index]}
                register={register}
                onRemove={() => remove(index)}
              />
            ))}
          </div>
        </DragDropProvider>
      </div>
    </section>
  );
}

function SortableInvoiceItemRow({ id, index, item, register, onRemove }: {
  id: string;
  index: number;
  item?: InvoiceLineItem;
  register: UseFormRegister<InvoiceFormValues>;
  onRemove: () => void;
}) {
  const { t } = usePreviewLanguage();
  const { handleRef, isDragging, ref } = useSortable({
    id,
    index,
    type: 'invoice-item',
    accept: 'invoice-item',
    group: 'invoice-items',
    modifiers: [RestrictToVerticalAxis],
  });

  return (
    <div
      ref={ref}
      className={cn(
        'grid min-w-0 grid-cols-[24px_minmax(0,0.8fr)_minmax(0,1fr)_32px] items-center gap-2 rounded-lg md:grid-cols-[24px_minmax(0,1fr)_64px_112px_112px_32px]',
        isDragging && 'relative z-10 opacity-50',
      )}
    >
      <Button
        ref={handleRef}
        type="button"
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground -ml-2 cursor-grab active:cursor-grabbing"
        aria-label={`${t('Verplaats regel')} ${index + 1}`}
      >
        <GripVertical />
      </Button>
      <Input
        className="min-w-0 text-sm max-md:col-span-3"
        aria-label={`${t('Omschrijving regel')} ${index + 1}`}
        {...register(`items.${index}.description` as const)}
      />
      <Input
        type="number"
        step="1"
        min="0"
        className="text-sm max-md:col-start-2 max-md:row-start-2"
        aria-label={`${t('Aantal regel')} ${index + 1}`}
        {...register(`items.${index}.quantity` as const, { valueAsNumber: true })}
      />
      <Input
        type="number"
        step="0.01"
        min="0"
        className="text-sm max-md:col-start-3 max-md:row-start-2"
        aria-label={`${t('Prijs regel')} ${index + 1}`}
        {...register(`items.${index}.unitPrice` as const, { valueAsNumber: true })}
      />
      <div className="min-w-0 text-right text-sm font-medium max-md:col-span-3 max-md:col-start-2 max-md:row-start-3 max-md:flex max-md:items-center max-md:justify-between max-md:text-left">
        <span className="text-muted-foreground hidden max-md:inline">{t('Regeltotaal')}</span>
        <span>{formatInvoiceCurrency(getLineAmount(item))}</span>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="max-md:col-start-4 max-md:row-start-2"
        aria-label={`${t('Verwijder regel')} ${index + 1}`}
        onClick={onRemove}
      >
        <Trash2 />
      </Button>
    </div>
  );
}

function formatInvoiceCurrency(value: number) {
  return formatCurrency(Number.isFinite(value) ? value : 0, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * The office-maintained dispatch prices, fetched once. Same endpoint the old
 * Autosleutel24 form used; off (and never requested) unless asked for, so the
 * KeyForCars screen makes no extra call.
 */
function usePriceList(enabled: boolean) {
  const [priceList, setPriceList] = React.useState<{ description: string; price: number }[]>([]);
  const [priceListError, setPriceListError] = React.useState('');

  React.useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    fetch('/api/admin/price-list')
      .then(async (response) => {
        const body = await response.json().catch(() => null);
        if (cancelled) return;
        if (!response.ok) {
          setPriceListError(`Prijslijst laden mislukt (${response.status}): ${body?.error ?? 'onbekende fout'}`);
          return;
        }
        /* A blank description can't be a Select value (Radix) and can't be picked either. */
        setPriceList((body?.items ?? []).filter((item: { description?: string }) => item?.description?.trim()));
      })
      .catch((error: Error) => {
        if (!cancelled) setPriceListError(`Prijslijst laden mislukt: ${error.message}`);
      });
    return () => { cancelled = true; };
  }, [enabled]);

  return { priceList, priceListError };
}
