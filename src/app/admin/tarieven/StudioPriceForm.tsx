'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { addPrice } from './actions';
import { SCENARIO_INFO } from '@/lib/scenarios';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PreviewText } from '../PreviewLanguage';

const SCENARIOS = Object.entries(SCENARIO_INFO) as [keyof typeof SCENARIO_INFO, { label: string }][];
const BOTH = 'both';

/** Studio restyle of PriceForm: same addPrice() call, same fields. */
export default function StudioPriceForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [scenario, setScenario] = useState<string>('bijmaken');
  const [keyless, setKeyless] = useState<string>(BOTH);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    setBusy(true);
    setError('');

    const result = await addPrice({
      make: String(form.get('make') ?? ''),
      model: String(form.get('model') ?? ''),
      scenario: String(form.get('scenario') ?? ''),
      fromYear: String(form.get('fromYear') ?? ''),
      toYear: String(form.get('toYear') ?? ''),
      keyless: String(form.get('keyless') ?? ''),
      price: String(form.get('price') ?? ''),
      servicePrice: String(form.get('servicePrice') ?? ''),
      note: String(form.get('note') ?? ''),
    });

    setBusy(false);
    if ('error' in result) {
      setError(result.error);
      return;
    }
    formEl.reset();
    setScenario('bijmaken');
    setKeyless(BOTH);
    router.refresh();
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={submit}>
      <input type="hidden" name="scenario" value={scenario} />
      <input type="hidden" name="keyless" value={keyless === BOTH ? '' : keyless} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="make"><PreviewText>Merk</PreviewText></Label>
          <Input id="make" name="make" required placeholder="Volkswagen" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="model"><PreviewText>Model</PreviewText></Label>
          <Input id="model" name="model" placeholder="Golf (leeg = heel merk)" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="scenario-select"><PreviewText>Scenario</PreviewText></Label>
          <Select value={scenario} onValueChange={setScenario}>
            <SelectTrigger id="scenario-select" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SCENARIOS.map(([value, info]) => (
                <SelectItem key={value} value={value}>{info.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="fromYear"><PreviewText>Bouwjaar vanaf</PreviewText></Label>
            <Input id="fromYear" name="fromYear" type="number" placeholder="2005" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="toYear"><PreviewText>Bouwjaar tot</PreviewText></Label>
            <Input id="toYear" name="toYear" type="number" placeholder="2012" />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="keyless-select"><PreviewText>Sleuteltype</PreviewText></Label>
          <Select value={keyless} onValueChange={setKeyless}>
            <SelectTrigger id="keyless-select" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={BOTH}><PreviewText>Beide</PreviewText></SelectItem>
              <SelectItem value="true">Keyless</SelectItem>
              <SelectItem value="false"><PreviewText>Baard/contact</PreviewText></SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="price"><PreviewText>Prijs (€)</PreviewText></Label>
          <Input id="price" name="price" required placeholder="195,00" />
          <Label htmlFor="servicePrice"><PreviewText>Diensttarief excl. btw (€)</PreviewText></Label>
          <Input id="servicePrice" name="servicePrice" inputMode="decimal" />
        </div>
        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor="note"><PreviewText>Notitie</PreviewText></Label>
          <Input id="note" name="note" placeholder="Optioneel" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={busy}>
          <PreviewText>{busy ? 'Opslaan…' : 'Toevoegen'}</PreviewText>
        </Button>
        {error && <p className="text-destructive text-sm"><PreviewText>{error}</PreviewText></p>}
      </div>
    </form>
  );
}
