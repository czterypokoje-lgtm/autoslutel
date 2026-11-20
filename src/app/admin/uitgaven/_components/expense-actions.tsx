'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, MoreHorizontal, Pencil, RotateCcw, Trash2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PreviewText, usePreviewLanguage } from '@/app/admin/PreviewLanguage';
import { EXPENSE_CATEGORIES } from '@/lib/expenseCaption';

import type { ExpenseRow } from '../ExpenseActions';

/**
 * The Studio look of ExpenseActions: the same four PATCH bodies and the same
 * DELETE against /api/admin/expenses/<id>. Approving is still not the end of
 * the story — a wrong figure stays wrong, so "Bewerken" works at any status.
 */
export function StudioExpenseActions({ expense }: { expense: ExpenseRow }) {
  const router = useRouter();
  const { t } = usePreviewLanguage();
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [category, setCategory] = useState(expense.category);
  const [description, setDescription] = useState(expense.description);
  const [amount, setAmount] = useState(String(expense.amount));
  const [date, setDate] = useState(expense.date_incurred);
  const [supplier, setSupplier] = useState(expense.supplier_name ?? '');
  const [reimbursable, setReimbursable] = useState(expense.is_reimbursable);

  async function send(method: 'PATCH' | 'DELETE', body?: unknown) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/expenses/${expense.id}`, {
        method,
        ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? 'Actie mislukt');
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Actie mislukt');
    } finally {
      setBusy(false);
    }
  }

  function remove() {
    /* A receipt goes with it, and neither comes back. Worth one question. */
    const ok = window.confirm(
      `Deze uitgave verwijderen?\n\n${EXPENSE_CATEGORIES[expense.category] ?? expense.category} — € ${expense.amount}\n${expense.description}\n\nDe bon wordt ook verwijderd. Dit kan niet ongedaan worden gemaakt.`
    );
    if (ok) void send('DELETE');
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {error && <span className="text-destructive text-xs">{error}</span>}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label={`${t('Acties voor')} ${EXPENSE_CATEGORIES[expense.category] ?? expense.category}`}
            className="text-muted-foreground hover:bg-muted/50 size-8 rounded-md"
            disabled={busy}
            size="icon-sm"
            variant="ghost"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {expense.status === 'pending' ? (
            <>
              <DropdownMenuItem onSelect={() => void send('PATCH', { status: 'approved' })}>
                <Check /> <PreviewText>Goedkeuren</PreviewText>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => void send('PATCH', { status: 'rejected' })}>
                <X /> <PreviewText>Afwijzen</PreviewText>
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem onSelect={() => void send('PATCH', { status: 'pending' })}>
              <RotateCcw /> <PreviewText>Terug naar open</PreviewText>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setEditing(true)}>
            <Pencil /> <PreviewText>Bewerken</PreviewText>
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => remove()}>
            <Trash2 /> <PreviewText>Verwijderen</PreviewText>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editing} onOpenChange={(open) => { setEditing(open); if (!open) setError(null); }}>
        <DialogContent className="kfc-neutral sm:max-w-lg">
          <DialogHeader>
            <DialogTitle><PreviewText>Uitgave bewerken</PreviewText></DialogTitle>
            <DialogDescription>
              Corrigeer de categorie, het bedrag, de datum of de leverancier. De status blijft zoals hij staat.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field className="gap-1 sm:col-span-2">
              <FieldLabel className="text-xs" htmlFor={`exp-cat-${expense.id}`}><PreviewText>Categorie</PreviewText></FieldLabel>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id={`exp-cat-${expense.id}`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectGroup>
                    {Object.entries(EXPENSE_CATEGORIES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            <Field className="gap-1 sm:col-span-2">
              <FieldLabel className="text-xs" htmlFor={`exp-desc-${expense.id}`}><PreviewText>Omschrijving</PreviewText></FieldLabel>
              <Input id={`exp-desc-${expense.id}`} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Omschrijving" />
            </Field>

            <Field className="gap-1">
              <FieldLabel className="text-xs" htmlFor={`exp-amount-${expense.id}`}>Bedrag (€)</FieldLabel>
              <Input id={`exp-amount-${expense.id}`} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Bedrag" />
            </Field>

            <Field className="gap-1">
              <FieldLabel className="text-xs" htmlFor={`exp-date-${expense.id}`}><PreviewText>Datum</PreviewText></FieldLabel>
              <Input id={`exp-date-${expense.id}`} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>

            <Field className="gap-1 sm:col-span-2">
              <FieldLabel className="text-xs" htmlFor={`exp-supplier-${expense.id}`}>Leverancier (optioneel)</FieldLabel>
              <Input id={`exp-supplier-${expense.id}`} value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Leverancier (optioneel)" />
            </Field>

            <div className="flex items-start gap-2 sm:col-span-2">
              <Checkbox id={`exp-reimb-${expense.id}`} checked={reimbursable} onCheckedChange={(value) => setReimbursable(!!value)} />
              <Label htmlFor={`exp-reimb-${expense.id}`} className="text-sm font-normal">
                Declaratie — de monteur heeft dit zelf betaald
              </Label>
            </div>

            {error && <p className="text-destructive text-sm sm:col-span-2">{error}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" disabled={busy} onClick={() => { setEditing(false); setError(null); }}>
              <PreviewText>Annuleren</PreviewText>
            </Button>
            <Button
              type="button"
              disabled={busy}
              onClick={() => void send('PATCH', {
                category,
                description,
                amount,
                date_incurred: date,
                supplier_name: supplier,
                is_reimbursable: reimbursable,
              })}
            >
              <PreviewText>{busy ? 'Opslaan…' : 'Opslaan'}</PreviewText>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
