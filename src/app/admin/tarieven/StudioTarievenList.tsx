'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import StudioPriceRow from './StudioPriceRow';
import type { PriceRowData } from './PriceRow';
import { SCENARIO_INFO } from '@/lib/scenarios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PreviewText } from '../PreviewLanguage';

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const SCENARIOS = Object.entries(SCENARIO_INFO) as [string, { label: string }][];

/**
 * Studio restyle of TarievenList: same search/scenario filtering and grouping
 * by make, same open-on-search behaviour — only the markup changes, onto
 * shadcn Input/Button/Table.
 */
export default function StudioTarievenList({ rows }: { rows: PriceRowData[] }) {
  const [q, setQ] = useState('');
  const [scenario, setScenario] = useState<string>('all');

  const groups = useMemo(() => {
    const term = q.trim().toLowerCase();
    const filtered = rows.filter((r) => {
      if (scenario !== 'all' && r.scenario !== scenario) return false;
      if (!term) return true;
      return `${r.make} ${r.model ?? ''} ${r.note ?? ''}`.toLowerCase().includes(term);
    });
    const byMake = new Map<string, PriceRowData[]>();
    for (const r of filtered) {
      const key = r.make.trim().toLowerCase();
      byMake.set(key, [...(byMake.get(key) ?? []), r]);
    }
    return [...byMake.values()]
      .map((list) => {
        const prices = list.map((r) => r.price);
        return { name: list[0].make, list, min: Math.min(...prices), max: Math.max(...prices) };
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'nl'));
  }, [rows, q, scenario]);

  const searching = q.trim().length > 0;
  const total = groups.reduce((n, g) => n + g.list.length, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek merk of model, bijv. Golf"
            aria-label="Zoek tarief"
            className="pl-8"
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Scenario">
          <Button type="button" size="sm" variant={scenario === 'all' ? 'default' : 'outline'} onClick={() => setScenario('all')}>
            <PreviewText>Alles</PreviewText>
          </Button>
          {SCENARIOS.map(([key, info]) => (
            <Button key={key} type="button" size="sm" variant={scenario === key ? 'default' : 'outline'} onClick={() => setScenario(key)}>
              {info.label}
            </Button>
          ))}
        </div>
        <span className="text-muted-foreground ml-auto text-sm">
          <PreviewText>{`${total} tarieven · ${groups.length} merken`}</PreviewText>
        </span>
      </div>

      {groups.length === 0 ? (
        <p className="text-muted-foreground text-sm"><PreviewText>Geen tarief gevonden.</PreviewText></p>
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map((g) => (
            <details key={`${g.name}-${searching}`} className="rounded-lg border" open={searching}>
              <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 select-none">
                <span className="font-medium">{g.name}</span>
                <span className="text-muted-foreground text-sm">
                  <PreviewText>{`${g.list.length} ${g.list.length === 1 ? 'tarief' : 'tarieven'}`}</PreviewText>
                </span>
                <span className="text-muted-foreground ml-auto text-sm">
                  {g.min === g.max ? MONEY.format(g.min) : `${MONEY.format(g.min)} – ${MONEY.format(g.max)}`}
                </span>
              </summary>
              <div className="overflow-x-auto border-t">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead><PreviewText>Merk</PreviewText></TableHead>
                      <TableHead><PreviewText>Model</PreviewText></TableHead>
                      <TableHead><PreviewText>Scenario</PreviewText></TableHead>
                      <TableHead><PreviewText>Bouwjaar</PreviewText></TableHead>
                      <TableHead><PreviewText>Sleutel</PreviewText></TableHead>
                      <TableHead className="text-right"><PreviewText>Prijs</PreviewText></TableHead>
                      <TableHead><PreviewText>Notitie</PreviewText></TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {g.list.map((row) => (
                      <StudioPriceRow key={row.id} row={row} />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
