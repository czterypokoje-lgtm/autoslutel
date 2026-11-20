'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Download, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PreviewText } from '../PreviewLanguage';

const ALL = '__all__';

/**
 * Studio restyle of RateFilters: same search box + two selects, same
 * router.push query params, same export link — only the markup changes,
 * onto shadcn Input/Select/Button.
 */
export default function StudioRateFilters({
  technicians,
  scenarios,
  q,
  monteur,
  dienst,
}: {
  technicians: { id: string; name: string }[];
  scenarios: { id: string; label: string }[];
  q: string;
  monteur: string;
  dienst: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(q);

  const go = (next: { q?: string; monteur?: string; dienst?: string }) => {
    const params = new URLSearchParams();
    const values = { q: search, monteur, dienst, ...next };
    if (values.q) params.set('q', values.q);
    if (values.monteur) params.set('monteur', values.monteur);
    if (values.dienst) params.set('dienst', values.dienst);
    router.push(`/admin/monteurtarieven${params.toString() ? `?${params}` : ''}`);
  };

  const exportUrl = (() => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (monteur) params.set('monteur', monteur);
    if (dienst) params.set('dienst', dienst);
    return `/api/admin/monteurtarieven/export${params.toString() ? `?${params}` : ''}`;
  })();

  const filtered = Boolean(q || monteur || dienst);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        go({ q: search });
      }}
      className="flex flex-wrap items-end gap-3"
    >
      <div className="grid min-w-60 flex-1 gap-1.5">
        <Label htmlFor="rate-search"><PreviewText>Zoek op auto of monteur</PreviewText></Label>
        <Input
          id="rate-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="bijv. golf, peugeot 107, mukremin"
        />
      </div>

      <div className="grid gap-1.5">
        <Label><PreviewText>Monteur</PreviewText></Label>
        <Select value={monteur || ALL} onValueChange={(v) => go({ monteur: v === ALL ? '' : v })}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}><PreviewText>Alle monteurs</PreviewText></SelectItem>
            {technicians.map((tech) => (
              <SelectItem key={tech.id} value={tech.id}>{tech.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-1.5">
        <Label><PreviewText>Werk</PreviewText></Label>
        <Select value={dienst || ALL} onValueChange={(v) => go({ dienst: v === ALL ? '' : v })}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}><PreviewText>Alle soorten</PreviewText></SelectItem>
            {scenarios.map((scenario) => (
              <SelectItem key={scenario.id} value={scenario.id}>{scenario.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit">
        <Search data-icon="inline-start" /> <PreviewText>Zoek</PreviewText>
      </Button>

      {filtered && (
        <Button type="button" variant="outline" onClick={() => { setSearch(''); router.push('/admin/monteurtarieven'); }}>
          <X data-icon="inline-start" /> <PreviewText>Wis</PreviewText>
        </Button>
      )}

      <Button type="button" variant="outline" asChild>
        <a href={exportUrl}>
          <Download data-icon="inline-start" /> Excel
        </a>
      </Button>
    </form>
  );
}
