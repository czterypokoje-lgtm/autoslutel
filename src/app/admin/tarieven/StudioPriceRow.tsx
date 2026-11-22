'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updatePrice } from './actions';
import StudioDeletePriceButton from './StudioDeletePriceButton';
import { SCENARIO_INFO } from '@/lib/scenarios';
import type { PriceRowData } from './PriceRow';
import { TableCell, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PreviewText } from '../PreviewLanguage';

const SCENARIOS = Object.entries(SCENARIO_INFO) as [keyof typeof SCENARIO_INFO, { label: string }][];
const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

/**
 * Studio restyle of PriceRow: same editable fields, same updatePrice/deletePrice
 * calls — only the markup changes, onto shadcn Table/Input/Select.
 */
export default function StudioPriceRow({ row }: { row: PriceRowData }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [make, setMake] = useState(row.make);
  const [model, setModel] = useState(row.model ?? '');
  const [scenario, setScenario] = useState<string>(row.scenario);
  const [fromYear, setFromYear] = useState(row.from_year === null ? '' : String(row.from_year));
  const [toYear, setToYear] = useState(row.to_year === null ? '' : String(row.to_year));
  const [keyless, setKeyless] = useState(row.keyless === null ? '' : String(row.keyless));
  const [price, setPrice] = useState(String(row.price));
  const [servicePrice, setServicePrice] = useState(row.service_price == null ? '' : String(row.service_price));
  const [note, setNote] = useState(row.note ?? '');

  function cancel() {
    setMake(row.make);
    setModel(row.model ?? '');
    setScenario(row.scenario);
    setFromYear(row.from_year === null ? '' : String(row.from_year));
    setToYear(row.to_year === null ? '' : String(row.to_year));
    setKeyless(row.keyless === null ? '' : String(row.keyless));
    setPrice(String(row.price));
    setServicePrice(row.service_price == null ? '' : String(row.service_price));
    setNote(row.note ?? '');
    setError('');
    setEditing(false);
  }

  async function save() {
    setBusy(true);
    setError('');
    const result = await updatePrice(row.id, { make, model, scenario, fromYear, toYear, keyless, price, servicePrice, note });
    setBusy(false);
    if ('error' in result) {
      setError(result.error);
      return;
    }
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <TableRow>
        <TableCell className="font-medium">{row.make}</TableCell>
        <TableCell className={row.model ? undefined : 'text-muted-foreground'}>
          {row.model ?? <PreviewText>Heel merk</PreviewText>}
        </TableCell>
        <TableCell>{SCENARIO_INFO[row.scenario]?.label ?? row.scenario}</TableCell>
        <TableCell className="text-muted-foreground">
          {row.from_year || row.to_year ? `${row.from_year ?? ''}–${row.to_year ?? ''}` : '—'}
        </TableCell>
        <TableCell className="text-muted-foreground">
          {row.keyless === true ? 'Keyless' : row.keyless === false ? <PreviewText>Baard/contact</PreviewText> : <PreviewText>Beide</PreviewText>}
        </TableCell>
        <TableCell className="text-right font-medium">{MONEY.format(row.price)}
          {row.service_price != null && <div className="text-muted-foreground text-xs"><PreviewText>Diensttarief excl. btw</PreviewText> {MONEY.format(row.service_price)}</div>}
        </TableCell>
        <TableCell className="text-muted-foreground max-w-40 truncate" title={row.note ?? undefined}>
          {row.note ?? ''}
        </TableCell>
        <TableCell className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            <PreviewText>Bewerken</PreviewText>
          </Button>
          <StudioDeletePriceButton id={row.id} />
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow>
      <TableCell>
        <Input value={make} onChange={(e) => setMake(e.target.value)} aria-label="Merk" />
      </TableCell>
      <TableCell>
        <Input value={model} placeholder="leeg = heel merk" onChange={(e) => setModel(e.target.value)} aria-label="Model" />
      </TableCell>
      <TableCell>
        <Select value={scenario} onValueChange={setScenario}>
          <SelectTrigger aria-label="Scenario" className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {SCENARIOS.map(([value, info]) => (
              <SelectItem key={value} value={value}>{info.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <div className="flex gap-1.5">
          <Input className="w-20" type="number" value={fromYear} placeholder="vanaf" onChange={(e) => setFromYear(e.target.value)} aria-label="Bouwjaar vanaf" />
          <Input className="w-20" type="number" value={toYear} placeholder="tot" onChange={(e) => setToYear(e.target.value)} aria-label="Bouwjaar tot" />
        </div>
      </TableCell>
      <TableCell>
        <Select value={keyless === '' ? 'both' : keyless} onValueChange={(v) => setKeyless(v === 'both' ? '' : v)}>
          <SelectTrigger aria-label="Sleuteltype" className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="both"><PreviewText>Beide</PreviewText></SelectItem>
            <SelectItem value="true">Keyless</SelectItem>
            <SelectItem value="false"><PreviewText>Baard/contact</PreviewText></SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Input value={price} onChange={(e) => setPrice(e.target.value)} aria-label="Prijs in euro" />
        <label className="mt-2 block text-xs"><PreviewText>Diensttarief excl. btw</PreviewText>
          <Input value={servicePrice} onChange={(e) => setServicePrice(e.target.value)} inputMode="decimal" />
        </label>
      </TableCell>
      <TableCell>
        <Input value={note} placeholder="Optioneel" onChange={(e) => setNote(e.target.value)} aria-label="Notitie" />
        {error && <p className="text-destructive mt-1 text-xs"><PreviewText>{error}</PreviewText></p>}
      </TableCell>
      <TableCell className="flex justify-end gap-2">
        <Button size="sm" onClick={save} disabled={busy}>
          <PreviewText>{busy ? 'Opslaan…' : 'Opslaan'}</PreviewText>
        </Button>
        <Button size="sm" variant="outline" onClick={cancel} disabled={busy}>
          <PreviewText>Annuleren</PreviewText>
        </Button>
      </TableCell>
    </TableRow>
  );
}
