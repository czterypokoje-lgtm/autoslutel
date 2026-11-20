'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronRight, MapPin, NotebookPen } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { HistoryRow, ToolOption } from './JobHistoryList';

export type { HistoryRow, ToolOption };

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const MONTH_SHORT = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
const MONTH_LONG = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];

const STATUS: Record<string, { label: string; className: string }> = {
  afgerond: { label: 'Afgerond', className: 'bg-green-500/15 text-green-600 dark:text-green-400' },
  gepland: { label: 'Gepland', className: 'bg-muted text-muted-foreground' },
  onderweg: { label: 'Onderweg', className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  bezig: { label: 'Bezig', className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  geannuleerd: { label: 'Geannuleerd', className: 'bg-destructive/10 text-destructive' },
};

function Row({ row, tools }: { row: HistoryRow; tools: ToolOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [toolUsedId, setToolUsedId] = useState(row.toolUsedId ?? '');
  const [keyUsed, setKeyUsed] = useState(row.keyUsed ?? '');
  const [adapterUsed, setAdapterUsed] = useState(row.adapterUsed ?? '');
  const [techNote, setTechNote] = useState(row.techNote ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const hasReference = Boolean(row.toolUsedId || row.keyUsed || row.adapterUsed || row.techNote);
  const status = STATUS[row.status] ?? { label: row.status, className: 'bg-muted text-muted-foreground' };
  const [y, m, d] = row.date.split('-');

  async function save() {
    setSaving(true);
    setError('');
    setSaved(false);

    const supabase = createSupabaseBrowserClient();
    const { error: updateError } = await supabase
      .from('jobs')
      .update({
        tool_used_id: toolUsedId || null,
        key_used: keyUsed.trim() || null,
        adapter_used: adapterUsed.trim() || null,
        tech_note: techNote.trim() || null,
      })
      .eq('id', row.id);

    if (updateError) {
      setError(updateError.message || 'Opslaan mislukt. Klussen ouder dan 30 dagen zijn niet meer te bewerken.');
      setSaving(false);
      return;
    }

    setSaved(true);
    setSaving(false);
    router.refresh();
  }

  return (
    <li>
      <Card className="overflow-hidden py-0">
        <button type="button" className="flex w-full items-center gap-3 px-4 py-3 text-left" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          <span className="flex w-9 shrink-0 flex-col items-center leading-none">
            <b className="text-base">{Number(d)}</b>
            <span className="text-muted-foreground text-[11px]">{MONTH_SHORT[Number(m) - 1]}</span>
          </span>

          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted" aria-hidden="true">
            {row.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={row.logo} alt="" className="size-6 object-contain" />
            ) : (
              <span className="text-xs font-semibold">{(row.make ?? '?').slice(0, 3).toUpperCase()}</span>
            )}
          </span>

          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2 text-sm font-medium">
              {row.car}
              {row.year && <span className="text-muted-foreground font-normal">{row.year}</span>}
            </span>
            <span className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
              <span>{row.service}</span>
              <span aria-hidden="true">·</span>
              <span>{row.slot}</span>
              {row.place && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="flex items-center gap-1">
                    <MapPin size={13} aria-hidden="true" />
                    {row.place}
                  </span>
                </>
              )}
            </span>
          </span>

          <span className="flex shrink-0 items-center gap-2">
            {hasReference && (
              <span title="Er staat een notitie bij deze klus">
                <NotebookPen size={14} aria-hidden="true" className="text-muted-foreground" />
              </span>
            )}
            <Badge className={status.className}>{status.label}</Badge>
            <span className="w-16 text-right text-sm font-medium tabular-nums">{row.price != null ? MONEY.format(Number(row.price)) : '—'}</span>
            {open ? <ChevronDown size={18} className="text-muted-foreground" /> : <ChevronRight size={18} className="text-muted-foreground" />}
          </span>
        </button>

        {open && (
          <CardContent className="flex flex-col gap-3 border-t pb-4 pt-3">
            <p className="text-sm text-muted-foreground">
              Wat werkte bij deze {row.car}? Je ziet dit terug als je dit model opnieuw tegenkomt. ({y})
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">Gebruikt gereedschap</span>
                <Select value={toolUsedId} onValueChange={setToolUsedId}>
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue placeholder="— geen gekozen —" />
                  </SelectTrigger>
                  <SelectContent>
                    {tools.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">Gebruikte sleutel / artikel</span>
                <Input
                  className="h-10"
                  value={keyUsed}
                  onChange={(e) => setKeyUsed(e.target.value)}
                  placeholder="bijv. Toyota smart key 2 knoppen, 433MHz"
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">Gebruikte adapter</span>
                <Input
                  className="h-10"
                  value={adapterUsed}
                  onChange={(e) => setAdapterUsed(e.target.value)}
                  placeholder="bijv. Xhorse OBD-adapter, of geen"
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
                <span className="font-medium">Notitie voor jezelf</span>
                <Textarea
                  value={techNote}
                  onChange={(e) => setTechNote(e.target.value)}
                  rows={3}
                  placeholder="Wat viel op aan deze klus, waar moet je de volgende keer op letten?"
                />
              </label>
            </div>

            <div className="flex items-center gap-3">
              <Button type="button" size="lg" className="h-10" onClick={save} disabled={saving}>
                {saving ? 'Opslaan…' : 'Opslaan'}
              </Button>
              {saved && <span className="text-sm text-green-600 dark:text-green-400">Opgeslagen.</span>}
              {error && <span className="text-sm text-destructive">{error}</span>}
            </div>
          </CardContent>
        )}
      </Card>
    </li>
  );
}

/** Jobs grouped under a month heading, newest first, as they come from the server. */
export default function StudioJobHistoryList({ rows, tools }: { rows: HistoryRow[]; tools: ToolOption[] }) {
  const groups: { key: string; label: string; rows: HistoryRow[] }[] = [];
  for (const row of rows) {
    const key = row.date.slice(0, 7);
    let group = groups.find((g) => g.key === key);
    if (!group) {
      group = { key, label: `${MONTH_LONG[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}`, rows: [] };
      groups.push(group);
    }
    group.rows.push(row);
  }

  return (
    <div className="flex flex-col gap-6">
      {groups.map((g) => (
        <section key={g.key} className="flex flex-col gap-2">
          <h2 className="flex items-center justify-between text-sm font-medium capitalize text-muted-foreground">
            <span>{g.label}</span>
            <span>
              {g.rows.length} {g.rows.length === 1 ? 'klus' : 'klussen'}
            </span>
          </h2>
          <ul className="flex flex-col gap-2">
            {g.rows.map((row) => (
              <Row key={row.id} row={row} tools={tools} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
