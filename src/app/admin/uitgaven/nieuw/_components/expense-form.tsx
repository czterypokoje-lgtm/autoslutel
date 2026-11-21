'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PreviewText } from '@/app/admin/PreviewLanguage';

/* Same list, same ids and labels as the old form — the ids are what the API stores. */
const CATEGORIES = [
  { id: 'fuel', label: 'Brandstof' },
  { id: 'parking', label: 'Parkeren' },
  { id: 'toll', label: 'Tol' },
  { id: 'meals', label: 'Eten & Drinken' },
  { id: 'vehicle_maintenance', label: 'Voertuig Onderhoud' },
  { id: 'tool_subscription', label: 'Gereedschap Abonnement' },
  { id: 'phone', label: 'Telefonie' },
  { id: 'advertising', label: 'Advertenties' },
  { id: 'supplier', label: 'Leverancier' },
  { id: 'office', label: 'Kantoor' },
  { id: 'insurance', label: 'Verzekeringen' },
  { id: 'rent', label: 'Huur' },
  { id: 'training', label: 'Training' },
  { id: 'other', label: 'Overig' },
];

/* Radix Select has no empty-string value; "" is what the API wants for "no monteur". */
const NO_TECHNICIAN = 'none';

/**
 * Studio look of the nieuwe-uitgave form. Identical fields and identical POST
 * body to /api/admin/expenses — category, description, amount, date_incurred,
 * technician_id, is_reimbursable.
 */
export function StudioExpenseForm({ technicians, isOffice, myTechId }: {
  technicians: { id: string; name: string }[];
  isOffice: boolean;
  myTechId: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [category, setCategory] = useState('fuel');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dateIncurred, setDateIncurred] = useState(new Date().toISOString().split('T')[0]);
  const [technicianId, setTechnicianId] = useState(isOffice ? '' : myTechId || '');
  const [isReimbursable, setIsReimbursable] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');

    const numAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Voer een geldig bedrag in.');
      setBusy(false);
      return;
    }

    const res = await fetch('/api/admin/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        purchase_order_id: new URLSearchParams(window.location.search).get('inkoop'),
        category,
        description,
        amount: numAmount,
        date_incurred: dateIncurred,
        technician_id: technicianId || null,
        is_reimbursable: isReimbursable,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setError(err.error || 'Opslaan mislukt');
      setBusy(false);
      return;
    }

    router.push('/admin/uitgaven');
    router.refresh();
  }

  return (
    <div className="kfc-neutral flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl leading-none font-medium tracking-tight"><PreviewText>Nieuwe Uitgave</PreviewText></h1>
        <p className="text-muted-foreground text-sm">
          <PreviewText>Registreer een bedrijfskost of dien een bonnetje in voor declaratie.</PreviewText>
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader className="border-b">
          <CardTitle className="text-xl leading-none"><PreviewText>Uitgave</PreviewText></CardTitle>
          <CardDescription className="leading-snug">
            <PreviewText>Vul het bedrag, de datum en een korte omschrijving in.</PreviewText>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="flex flex-col gap-5">
            <div className="grid gap-5 md:grid-cols-2">
              <Field className="gap-1">
                <FieldLabel className="text-xs" htmlFor="expense-category"><PreviewText>Categorie</PreviewText></FieldLabel>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="expense-category" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectGroup>
                      {CATEGORIES.map((option) => (
                        <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              <Field className="gap-1">
                <FieldLabel className="text-xs" htmlFor="expense-amount">Bedrag (€)</FieldLabel>
                <Input
                  id="expense-amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  required
                  placeholder="0.00"
                />
              </Field>

              <Field className="gap-1">
                <FieldLabel className="text-xs" htmlFor="expense-date"><PreviewText>Datum</PreviewText></FieldLabel>
                <Input
                  id="expense-date"
                  type="date"
                  value={dateIncurred}
                  onChange={(event) => setDateIncurred(event.target.value)}
                  required
                />
              </Field>

              <Field className="gap-1">
                <FieldLabel className="text-xs" htmlFor="expense-description"><PreviewText>Omschrijving</PreviewText></FieldLabel>
                <Input
                  id="expense-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  required
                  placeholder="bijv. Tanken BP, Google Ads factuur..."
                />
              </Field>

              {isOffice && (
                <Field className="gap-1 md:col-span-2">
                  <FieldLabel className="text-xs" htmlFor="expense-technician">Monteur (optioneel)</FieldLabel>
                  <Select
                    value={technicianId || NO_TECHNICIAN}
                    onValueChange={(value) => setTechnicianId(value === NO_TECHNICIAN ? '' : value)}
                  >
                    <SelectTrigger id="expense-technician" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectGroup>
                        <SelectItem value={NO_TECHNICIAN}>Algemeen / kantoor</SelectItem>
                        {technicians.map((technician) => (
                          <SelectItem key={technician.id} value={technician.id}>{technician.name}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              )}
            </div>

            <div className="flex items-start gap-2">
              <Checkbox id="expense-reimbursable" checked={isReimbursable} onCheckedChange={(value) => setIsReimbursable(!!value)} />
              <Label htmlFor="expense-reimbursable" className="text-sm font-normal">
                Dit is een declaratie (ik heb dit privé voorgeschoten en wil het terug).
              </Label>
            </div>

            {error && <p role="alert" className="text-destructive text-sm">{error}</p>}

            <div className="flex flex-wrap justify-end gap-3">
              <Button type="button" variant="outline" disabled={busy} onClick={() => router.back()}>
                <PreviewText>Annuleren</PreviewText>
              </Button>
              <Button type="submit" disabled={busy}>
                <PreviewText>{busy ? 'Opslaan...' : 'Opslaan'}</PreviewText>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
