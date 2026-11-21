'use client';

import { Fragment, useMemo, useState, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Msg = { id: string; at: string; from_me: boolean; text: string };

export type Quote = {
  id: string;
  phone: string | null;
  contact_name: string | null;
  asked_at: string | null;
  quoted_at: string | null;
  reply_minutes: number | null;
  context: Msg[];
  make: string;
  model: string | null;
  year: number | null;
  kenteken: string | null;
  scenario: string | null;
  problem: string;
  product: string | null;
  city: string | null;
  postcode: string | null;
  urgency: string;
  requested_time: string | null;
  conditions: string | null;
  price_amount: number | null;
  price_max: number | null;
  price_kind: string;
  price_vat: string;
  price_vat_assumed: boolean;
  price_incl: number | null;
  quote_excerpt: string | null;
  outcome: string;
  lost_reason: string | null;
  lost_detail: string | null;
  declined_reason: string | null;
  declined_detail: string | null;
  price_objection: boolean;
  time_objection: boolean;
  competitor_price: number | null;
  competitor: string | null;
  customer_budget: number | null;
  we_lowered_price: boolean;
  final_price_amount: number | null;
  we_followed_up: boolean;
  source: string;
  job_id: string | null;
  confidence: number | null;
  review: string;
};

// ---- labels ---------------------------------------------------------------

const SCENARIO: Record<string, string> = {
  bijmaken: 'Bijmaken',
  alle_sleutels_kwijt: 'Alle sleutels kwijt',
  reparatie: 'Reparatie',
  slot: 'Slot',
};
const OUTCOME: Record<string, string> = {
  gewonnen: 'Gewonnen',
  verloren: 'Verloren',
  geen_reactie: 'Geen reactie',
  afgewezen_door_ons: 'Door ons afgewezen',
  onbekend: 'Onbekend',
};
const OUTCOME_CLASS: Record<string, string> = {
  gewonnen: 'border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300',
  verloren: 'border-red-200 bg-red-100 text-red-700 dark:border-red-500/20 dark:bg-red-500/15 dark:text-red-300',
};
const REASON: Record<string, string> = {
  prijs: 'Prijs',
  tijd: 'Tijd',
  klant_elders: 'Ging elders',
  dealer: 'Dealer',
  zelf_opgelost: 'Zelf opgelost',
  vertrouwen: 'Vertrouwen',
  anders: 'Anders',
  onbekend: 'Onbekend',
  auto_niet_mogelijk: 'Auto niet mogelijk',
  geen_onderdeel: 'Geen onderdeel',
  geen_monteur: 'Geen monteur',
  te_ver: 'Te ver',
  te_laat_op_dag: 'Te laat op de dag',
  niet_rendabel: 'Niet rendabel',
};
const SOURCE: Record<string, string> = {
  google: 'Google',
  advertentie: 'Advertentie',
  website: 'Website',
  marktplaats: 'Marktplaats',
  doorverwezen: 'Doorverwezen',
  terugkerende_klant: 'Terugkerende klant',
  garage_b2b: 'Garage (B2B)',
  onbekend: 'Onbekend',
};
const REVIEW: Record<string, string> = { nieuw: 'Niet gecontroleerd', goedgekeurd: 'Klopt', afgewezen: 'Klopt niet' };
const WEEKDAY = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];

// ---- formatting -----------------------------------------------------------

const TZ = 'Europe/Amsterdam';
const eur = (n: number | null | undefined) =>
  n == null ? '–' : new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
const day = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat('nl-NL', { timeZone: TZ, day: 'numeric', month: 'short' }).format(new Date(iso)) : '–';
const time = (iso: string) =>
  new Intl.DateTimeFormat('nl-NL', { timeZone: TZ, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
const isoDay = (iso: string) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date(iso));
const car = (q: { make: string; model: string | null }) => [q.make, q.model].filter(Boolean).join(' ') || 'Onbekende auto';
const pct = (a: number, b: number) => (b ? `${Math.round((100 * a) / b)}%` : '–');
const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const norm = (s: string | null | undefined) => (s ?? '').trim().toLowerCase();
const yearBand = (y: number | null) => (y == null ? null : `${Math.floor(y / 5) * 5}–${Math.floor(y / 5) * 5 + 4}`);
const reasonOf = (q: Quote) => q.lost_reason ?? q.declined_reason;

// ---- aggregates -----------------------------------------------------------

type Agg = {
  n: number;
  priced: number;
  min: number | null;
  med: number | null;
  max: number | null;
  won: number;
  lost: number;
  silent: number;
  declined: number;
  decided: number;
  lostOnPrice: number;
  reply: number | null;
  ids: string[];
};

function agg(rows: Quote[]): Agg {
  const prices = rows.map((q) => q.price_incl).filter((p): p is number => p != null);
  const replies = rows.map((q) => q.reply_minutes).filter((m): m is number => m != null);
  const count = (o: string) => rows.filter((q) => q.outcome === o).length;
  return {
    n: rows.length,
    priced: prices.length,
    min: prices.length ? Math.min(...prices) : null,
    med: median(prices),
    max: prices.length ? Math.max(...prices) : null,
    won: count('gewonnen'),
    lost: count('verloren'),
    silent: count('geen_reactie'),
    declined: count('afgewezen_door_ons'),
    decided: rows.filter((q) => q.outcome !== 'onbekend').length,
    lostOnPrice: rows.filter((q) => q.lost_reason === 'prijs').length,
    reply: median(replies),
    ids: rows.map((q) => q.id),
  };
}

/** What a report can be grouped by. Each returns the group's label, or null to leave a row out. */
const GROUPS: Record<string, { label: string; key: (q: Quote) => string | null }> = {
  merk: { label: 'Merk', key: (q) => q.make || 'Onbekend' },
  model: { label: 'Merk + model', key: (q) => car(q) },
  bouwjaar: { label: 'Bouwjaar (5 jaar)', key: (q) => yearBand(q.year) ?? 'Onbekend' },
  model_jaar: { label: 'Model + bouwjaar', key: (q) => `${car(q)} ${yearBand(q.year) ?? ''}`.trim() },
  klus: { label: 'Klus', key: (q) => (q.scenario ? SCENARIO[q.scenario] : 'Onbekend') },
  uitkomst: { label: 'Uitkomst', key: (q) => OUTCOME[q.outcome] ?? q.outcome },
  reden: { label: 'Reden afhaken / afwijzen', key: (q) => (reasonOf(q) ? REASON[reasonOf(q)!] : null) },
  plaats: { label: 'Plaats', key: (q) => q.city || 'Onbekend' },
  maand: { label: 'Maand', key: (q) => (q.asked_at ? isoDay(q.asked_at).slice(0, 7) : null) },
  weekdag: {
    label: 'Weekdag',
    key: (q) => (q.asked_at ? WEEKDAY[(new Date(isoDay(q.asked_at) + 'T12:00:00Z').getUTCDay() + 6) % 7] : null),
  },
  uur: {
    label: 'Uur van de dag',
    key: (q) =>
      q.asked_at ? new Intl.DateTimeFormat('nl-NL', { timeZone: TZ, hour: '2-digit', hourCycle: 'h23' }).format(new Date(q.asked_at)) + ':00' : null,
  },
  bron: { label: 'Bron', key: (q) => SOURCE[q.source] ?? q.source },
  spoed: { label: 'Spoed', key: (q) => q.urgency },
  prijsklasse: {
    label: 'Prijsklasse (incl.)',
    key: (q) => (q.price_incl == null ? null : `${Math.floor(q.price_incl / 100) * 100}–${Math.floor(q.price_incl / 100) * 100 + 99}`),
  },
};

// ---- filters (kept in the URL so a view can be shared) ---------------------

const FILTER_KEYS = ['q', 'merk', 'model', 'jaarVan', 'jaarTot', 'klus', 'uitkomst', 'reden', 'prijsVan', 'prijsTot', 'van', 'tot', 'plaats', 'bron', 'controle', 'btw'] as const;
type FilterKey = (typeof FILTER_KEYS)[number];
type Filters = Record<FilterKey, string>;

function applyFilters(quotes: Quote[], f: Filters) {
  const num = (s: string) => (s.trim() === '' ? null : Number(s));
  const [yFrom, yTo, pFrom, pTo] = [num(f.jaarVan), num(f.jaarTot), num(f.prijsVan), num(f.prijsTot)];
  const needle = norm(f.q);
  return quotes.filter((q) => {
    if (f.merk && norm(q.make) !== norm(f.merk)) return false;
    if (f.model && norm(q.model) !== norm(f.model)) return false;
    if (yFrom != null && (q.year == null || q.year < yFrom)) return false;
    if (yTo != null && (q.year == null || q.year > yTo)) return false;
    if (f.klus && (f.klus === 'onbekend' ? q.scenario != null : q.scenario !== f.klus)) return false;
    if (f.uitkomst && q.outcome !== f.uitkomst) return false;
    if (f.reden && reasonOf(q) !== f.reden) return false;
    if (pFrom != null && (q.price_incl == null || q.price_incl < pFrom)) return false;
    if (pTo != null && (q.price_incl == null || q.price_incl > pTo)) return false;
    if (f.van && (!q.asked_at || isoDay(q.asked_at) < f.van)) return false;
    if (f.tot && (!q.asked_at || isoDay(q.asked_at) > f.tot)) return false;
    if (f.plaats && !norm(q.city).includes(norm(f.plaats))) return false;
    if (f.bron && q.source !== f.bron) return false;
    if (f.controle && q.review !== f.controle) return false;
    if (f.btw === 'gezegd' && (q.price_amount == null || q.price_vat_assumed)) return false;
    if (f.btw === 'aangenomen' && !q.price_vat_assumed) return false;
    if (f.btw === 'geen_prijs' && q.price_amount != null) return false;
    if (needle) {
      const hay = [q.make, q.model, q.problem, q.product, q.contact_name, q.phone, q.city, q.lost_detail, q.declined_detail, q.quote_excerpt, q.conditions, q.kenteken, q.competitor]
        .map(norm)
        .join(' ');
      if (!hay.includes(needle)) return false;
    }
    return true;
  });
}

// ---- CSV (semicolon + BOM: opens straight in Dutch Excel with ë, ş, ü intact) --

function downloadCsv(name: string, header: string[], rows: (string | number | null | undefined)[][]) {
  const cell = (v: string | number | null | undefined) => {
    const s = v == null ? '' : typeof v === 'number' ? String(v).replace('.', ',') : v;
    return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const text = '﻿' + [header, ...rows].map((r) => r.map(cell).join(';')).join('\r\n');
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  a.click();
  URL.revokeObjectURL(url);
}

// ---- small pieces ---------------------------------------------------------

const selectClass =
  'h-8 rounded-md border border-input bg-transparent px-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30';

function Select({ value, onChange, label, options }: { value: string; onChange: (v: string) => void; label: string; options: [string, string][] }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-muted-foreground text-xs">{label}</span>
      <select className={selectClass} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Alle</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-muted-foreground text-xs">{label}</span>
      {children}
    </label>
  );
}

function Kpi({ label, value, hint, onClick }: { label: string; value: string; hint?: string; onClick?: () => void }) {
  const body = (
    <Card className="h-full">
      <CardContent className="flex flex-col gap-1 py-4">
        <span className="text-muted-foreground text-xs">{label}</span>
        <span className="text-2xl font-medium tabular-nums">{value}</span>
        {hint && <span className="text-muted-foreground text-xs">{hint}</span>}
      </CardContent>
    </Card>
  );
  return onClick ? (
    <button type="button" className="text-left" onClick={onClick}>
      {body}
    </button>
  ) : (
    body
  );
}

function OutcomeBadge({ outcome }: { outcome: string }) {
  return (
    <Badge variant="outline" className={OUTCOME_CLASS[outcome]}>
      {OUTCOME[outcome] ?? outcome}
    </Badge>
  );
}

/** A grouped table: one row per group with the standard numbers. Click a row to open its chats. */
function GroupTable({
  rows,
  groupLabel,
  onOpen,
  sortKey,
  onSort,
}: {
  rows: [string, Agg][];
  groupLabel: string;
  onOpen: (label: string, ids: string[]) => void;
  sortKey: string;
  onSort: (k: string) => void;
}) {
  const cols: [string, string, (a: Agg) => ReactNode][] = [
    ['n', 'Vragen', (a) => a.n],
    ['priced', 'Met prijs', (a) => a.priced],
    ['min', 'Laagst', (a) => eur(a.min)],
    ['med', 'Midden', (a) => eur(a.med)],
    ['max', 'Hoogst', (a) => eur(a.max)],
    ['won', 'Gewonnen', (a) => a.won],
    ['win', 'Win %', (a) => pct(a.won, a.decided)],
    ['lost', 'Verloren', (a) => a.lost],
    ['lostOnPrice', 'Op prijs', (a) => a.lostOnPrice || ''],
    ['silent', 'Stil', (a) => a.silent],
    ['declined', 'Afgewezen', (a) => a.declined || ''],
    ['reply', 'Antwoord', (a) => (a.reply == null ? '–' : `${Math.round(a.reply)} min`)],
  ];
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{groupLabel}</TableHead>
          {cols.map(([k, l]) => (
            <TableHead key={k} className="cursor-pointer text-right select-none" onClick={() => onSort(k)}>
              {l}
              {sortKey === k ? ' ↓' : ''}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map(([label, a]) => (
          <TableRow key={label} className="cursor-pointer" onClick={() => onOpen(`${groupLabel}: ${label}`, a.ids)}>
            <TableCell className="font-medium">{label}</TableCell>
            {cols.map(([k, , f]) => (
              <TableCell key={k} className="text-right tabular-nums">
                {f(a)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function sortGroups(rows: [string, Agg][], key: string) {
  const v = (a: Agg) =>
    key === 'win' ? (a.decided ? a.won / a.decided : -1) : ((a as unknown as Record<string, number | null>)[key] ?? -1);
  return [...rows].sort((x, y) => v(y[1]) - v(x[1]) || y[1].n - x[1].n);
}

function group(rows: Quote[], key: (q: Quote) => string | null): [string, Agg][] {
  const m = new Map<string, Quote[]>();
  for (const q of rows) {
    const k = key(q);
    if (k == null) continue;
    m.set(k, [...(m.get(k) ?? []), q]);
  }
  return [...m.entries()].map(([k, qs]) => [k, agg(qs)]);
}

/**
 * The AI writes the make as the customer did, so one brand arrives under several
 * spellings (Citroen / Citroën, Mercedes / Mercedes-AMG). One name per brand,
 * or every report splits it in two.
 */
const MAKE_ALIAS: Record<string, string> = {
  citroen: 'Citroën',
  'citroën': 'Citroën',
  mercedes: 'Mercedes-Benz',
  'mercedes benz': 'Mercedes-Benz',
  'mercedes-amg': 'Mercedes-Benz',
  mb: 'Mercedes-Benz',
  vw: 'Volkswagen',
  'škoda': 'Skoda',
  'alfa': 'Alfa Romeo',
  'range rover': 'Land Rover',
  onbekend: 'Onbekend',
  '': 'Onbekend',
};
const canonMake = (make: string) => MAKE_ALIAS[norm(make)] ?? make.trim();

// ---- the page -------------------------------------------------------------

export default function AnalyseView({ quotes: raw }: { quotes: Quote[] }) {
  const quotes = useMemo(() => raw.map((q) => ({ ...q, make: canonMake(q.make) })), [raw]);
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [filters, setFilters] = useState<Filters>(
    () => Object.fromEntries(FILTER_KEYS.map((k) => [k, params.get(k) ?? ''])) as Filters,
  );
  const [tab, setTab] = useState(params.get('tab') ?? 'overzicht');
  const [groupBy, setGroupBy] = useState(params.get('groep') ?? 'model');
  const [sortKey, setSortKey] = useState('n');
  const [drill, setDrill] = useState<{ label: string; ids: Set<string> } | null>(null);
  const [showRejected, setShowRejected] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  /** Keep filters, tab and grouping in the address bar, so the exact view can be bookmarked or sent. */
  function sync(next: { filters?: Filters; tab?: string; groep?: string }) {
    const f = next.filters ?? filters;
    const sp = new URLSearchParams();
    for (const k of FILTER_KEYS) if (f[k]) sp.set(k, f[k]);
    const t = next.tab ?? tab;
    const g = next.groep ?? groupBy;
    if (t !== 'overzicht') sp.set('tab', t);
    if (g !== 'model') sp.set('groep', g);
    window.history.replaceState(null, '', `${pathname}${sp.toString() ? `?${sp}` : ''}`);
  }
  function setFilter(k: FilterKey, v: string) {
    const next = { ...filters, [k]: v, ...(k === 'merk' ? { model: '' } : {}) };
    setFilters(next);
    setDrill(null);
    sync({ filters: next });
  }
  function clearFilters() {
    const empty = Object.fromEntries(FILTER_KEYS.map((k) => [k, ''])) as Filters;
    setFilters(empty);
    setDrill(null);
    sync({ filters: empty });
  }
  function changeTab(t: string) {
    setTab(t);
    sync({ tab: t });
  }
  /** Open the rows behind any number on the page. */
  function show(label: string, ids: string[]) {
    setDrill({ label, ids: new Set(ids) });
    setOpen(null);
    changeTab('vragen');
  }

  async function setReview(id: string, review: string) {
    setBusy(id);
    setError('');
    const res = await fetch(`/api/admin/whatsapp-quotes/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ review }),
    });
    setBusy(null);
    if (!res.ok) {
      setError((await res.json().catch(() => null))?.error ?? 'Opslaan mislukt');
      return;
    }
    router.refresh();
  }

  // Options for the dropdowns come from the data itself.
  const makes = useMemo(
    () => [...new Set(quotes.map((q) => q.make).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'nl')),
    [quotes],
  );
  const models = useMemo(
    () =>
      [...new Set(quotes.filter((q) => !filters.merk || norm(q.make) === norm(filters.merk)).map((q) => q.model).filter((m): m is string => !!m))].sort(
        (a, b) => a.localeCompare(b, 'nl'),
      ),
    [quotes, filters.merk],
  );

  // Rows marked "klopt niet" stay out of every number unless asked for.
  const base = useMemo(() => (showRejected ? quotes : quotes.filter((q) => q.review !== 'afgewezen')), [quotes, showRejected]);
  const filtered = useMemo(() => applyFilters(base, filters), [base, filters]);
  const total = useMemo(() => agg(filtered), [filtered]);
  const activeFilters = FILTER_KEYS.filter((k) => filters[k]).length;

  const perScenario = useMemo(() => group(filtered, GROUPS.klus.key), [filtered]);
  const priceList = useMemo(
    () => sortGroups(group(filtered.filter((q) => q.price_incl != null), (q) => `${car(q)} · ${yearBand(q.year) ?? 'jaar ?'} · ${q.scenario ? SCENARIO[q.scenario] : 'klus ?'}`), sortKey),
    [filtered, sortKey],
  );
  const lossReasons = useMemo(
    () => sortGroups(group(filtered.filter((q) => q.outcome === 'verloren' || q.outcome === 'geen_reactie'), (q) => (q.lost_reason ? REASON[q.lost_reason] : OUTCOME[q.outcome])), sortKey),
    [filtered, sortKey],
  );
  const declinedCars = useMemo(
    () => sortGroups(group(filtered.filter((q) => q.outcome === 'afgewezen_door_ons'), (q) => `${car(q)} ${q.year ?? ''} · ${q.declined_reason ? REASON[q.declined_reason] : '?'}`.trim()), sortKey),
    [filtered, sortKey],
  );
  const report = useMemo(() => sortGroups(group(filtered, GROUPS[groupBy]?.key ?? GROUPS.model.key), sortKey), [filtered, groupBy, sortKey]);

  const list = useMemo(() => (drill ? filtered.filter((q) => drill.ids.has(q.id)) : filtered), [filtered, drill]);

  function exportList() {
    downloadCsv(
      `whatsapp-vragen-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Datum', 'Klant', 'Telefoon', 'Merk', 'Model', 'Bouwjaar', 'Kenteken', 'Klus', 'Probleem', 'Product', 'Plaats', 'Spoed', 'Voorwaarden', 'Prijs', 'Tot', 'Btw', 'Btw aangenomen', 'Prijs incl.', 'Uitkomst', 'Reden', 'Woorden klant/ons', 'Concurrent', 'Concurrentprijs', 'Wij zakten', 'Laatste prijs', 'Bron', 'Antwoord (min)', 'Klus in CRM', 'Gecontroleerd', 'Onze prijszin'],
      list.map((q) => [
        q.asked_at ? isoDay(q.asked_at) : '', q.contact_name, q.phone, q.make, q.model, q.year, q.kenteken,
        q.scenario ? SCENARIO[q.scenario] : '', q.problem, q.product, q.city, q.urgency, q.conditions,
        q.price_amount, q.price_max, q.price_vat, q.price_vat_assumed ? 'ja' : '', q.price_incl,
        OUTCOME[q.outcome], reasonOf(q) ? REASON[reasonOf(q)!] : '', q.lost_detail ?? q.declined_detail,
        q.competitor, q.competitor_price, q.we_lowered_price ? 'ja' : '', q.final_price_amount, SOURCE[q.source],
        q.reply_minutes, q.job_id ? 'ja' : '', REVIEW[q.review], q.quote_excerpt,
      ]),
    );
  }
  function exportGroups(name: string, label: string, rows: [string, Agg][]) {
    downloadCsv(
      `${name}-${new Date().toISOString().slice(0, 10)}.csv`,
      [label, 'Vragen', 'Met prijs', 'Laagst incl.', 'Midden incl.', 'Hoogst incl.', 'Gewonnen', 'Win %', 'Verloren', 'Op prijs', 'Stil', 'Afgewezen', 'Antwoord (min)'],
      rows.map(([l, a]) => [l, a.n, a.priced, a.min, a.med, a.max, a.won, a.decided ? Math.round((100 * a.won) / a.decided) : null, a.lost, a.lostOnPrice, a.silent, a.declined, a.reply == null ? null : Math.round(a.reply)]),
    );
  }

  if (!quotes.length) {
    return <p className="text-muted-foreground text-sm">Nog geen WhatsApp-gegevens geïmporteerd.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ---- filter bar: applies to every tab ---- */}
      <Card>
        <CardContent className="flex flex-col gap-3 py-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Field label="Zoeken">
              <Input className="h-8" placeholder="Auto, klant, woorden…" value={filters.q} onChange={(e) => setFilter('q', e.target.value)} />
            </Field>
            <Select label="Merk" value={filters.merk} onChange={(v) => setFilter('merk', v)} options={makes.map((m) => [m, m])} />
            <Select label="Model" value={filters.model} onChange={(v) => setFilter('model', v)} options={models.map((m) => [m, m])} />
            <Field label="Bouwjaar van / tot">
              <div className="flex gap-1">
                <Input className="h-8" inputMode="numeric" placeholder="2010" value={filters.jaarVan} onChange={(e) => setFilter('jaarVan', e.target.value.replace(/\D/g, ''))} />
                <Input className="h-8" inputMode="numeric" placeholder="2024" value={filters.jaarTot} onChange={(e) => setFilter('jaarTot', e.target.value.replace(/\D/g, ''))} />
              </div>
            </Field>
            <Select label="Klus" value={filters.klus} onChange={(v) => setFilter('klus', v)} options={[...Object.entries(SCENARIO), ['onbekend', 'Onbekend']]} />
            <Select label="Uitkomst" value={filters.uitkomst} onChange={(v) => setFilter('uitkomst', v)} options={Object.entries(OUTCOME)} />
            <Select label="Reden" value={filters.reden} onChange={(v) => setFilter('reden', v)} options={Object.entries(REASON)} />
            <Field label="Prijs incl. van / tot">
              <div className="flex gap-1">
                <Input className="h-8" inputMode="numeric" placeholder="€" value={filters.prijsVan} onChange={(e) => setFilter('prijsVan', e.target.value.replace(/\D/g, ''))} />
                <Input className="h-8" inputMode="numeric" placeholder="€" value={filters.prijsTot} onChange={(e) => setFilter('prijsTot', e.target.value.replace(/\D/g, ''))} />
              </div>
            </Field>
            <Field label="Periode van / tot">
              <div className="flex gap-1">
                <Input className="h-8" type="date" value={filters.van} onChange={(e) => setFilter('van', e.target.value)} />
                <Input className="h-8" type="date" value={filters.tot} onChange={(e) => setFilter('tot', e.target.value)} />
              </div>
            </Field>
            <Field label="Plaats">
              <Input className="h-8" placeholder="Utrecht…" value={filters.plaats} onChange={(e) => setFilter('plaats', e.target.value)} />
            </Field>
            <Select label="Bron" value={filters.bron} onChange={(v) => setFilter('bron', v)} options={Object.entries(SOURCE)} />
            <Select
              label="Btw / prijs"
              value={filters.btw}
              onChange={(v) => setFilter('btw', v)}
              options={[
                ['gezegd', 'Btw in gesprek genoemd'],
                ['aangenomen', 'Btw aangenomen (incl.)'],
                ['geen_prijs', 'Geen prijs gegeven'],
              ]}
            />
            <Select label="Gecontroleerd" value={filters.controle} onChange={(v) => setFilter('controle', v)} options={Object.entries(REVIEW)} />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium">{filtered.length} van {base.length} vragen</span>
            {activeFilters > 0 && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Filters wissen ({activeFilters})
              </Button>
            )}
            <label className="text-muted-foreground ml-auto flex items-center gap-2 text-xs">
              <input type="checkbox" checked={showRejected} onChange={(e) => setShowRejected(e.target.checked)} />
              Ook regels die &lsquo;klopt niet&rsquo; zijn
            </label>
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Tabs value={tab} onValueChange={changeTab} className="flex flex-col gap-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overzicht">Overzicht</TabsTrigger>
          <TabsTrigger value="rapport">Rapport</TabsTrigger>
          <TabsTrigger value="prijzen">Prijslijst</TabsTrigger>
          <TabsTrigger value="verloren">Verloren</TabsTrigger>
          <TabsTrigger value="afgewezen">Afgewezen</TabsTrigger>
          <TabsTrigger value="vragen">Vragen ({list.length})</TabsTrigger>
        </TabsList>

        {/* ---- overview ---- */}
        <TabsContent value="overzicht" className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <Kpi label="Prijsvragen" value={String(total.n)} hint={`${total.priced} met prijs`} onClick={() => show('Alle gefilterde vragen', total.ids)} />
            <Kpi
              label="Gewonnen"
              value={String(total.won)}
              hint={`${pct(total.won, total.decided)} van beslist · ${filtered.filter((q) => q.job_id).length} met klus in CRM`}
              onClick={() => show('Gewonnen', filtered.filter((q) => q.outcome === 'gewonnen').map((q) => q.id))}
            />
            <Kpi label="Geen reactie" value={String(total.silent)} hint="Stil na ons antwoord" onClick={() => show('Geen reactie', filtered.filter((q) => q.outcome === 'geen_reactie').map((q) => q.id))} />
            <Kpi label="Verloren" value={String(total.lost)} hint={`${total.lostOnPrice} op prijs`} onClick={() => show('Verloren', filtered.filter((q) => q.outcome === 'verloren').map((q) => q.id))} />
            <Kpi label="Door ons afgewezen" value={String(total.declined)} onClick={() => show('Door ons afgewezen', filtered.filter((q) => q.outcome === 'afgewezen_door_ons').map((q) => q.id))} />
            <Kpi label="Middenprijs incl." value={eur(total.med)} hint={`Eerste echt antwoord: ${total.reply == null ? '–' : `${Math.round(total.reply)} min`}`} />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Per soort klus</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <GroupTable rows={sortGroups(perScenario, sortKey)} groupLabel="Klus" onOpen={show} sortKey={sortKey} onSort={setSortKey} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---- free report ---- */}
        <TabsContent value="rapport" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-muted-foreground text-xs">Groepeer op</span>
              <select
                className={selectClass}
                value={groupBy}
                onChange={(e) => {
                  setGroupBy(e.target.value);
                  sync({ groep: e.target.value });
                }}
              >
                {Object.entries(GROUPS).map(([k, g]) => (
                  <option key={k} value={k}>
                    {g.label}
                  </option>
                ))}
              </select>
            </label>
            <Button variant="outline" size="sm" onClick={() => exportGroups(`whatsapp-rapport-${groupBy}`, GROUPS[groupBy]?.label ?? 'Groep', report)}>
              Download (Excel)
            </Button>
            <span className="text-muted-foreground text-xs">Klik een kolomkop om te sorteren, een regel om de gesprekken te zien.</span>
          </div>
          <Card>
            <CardContent className="overflow-x-auto py-2">
              <GroupTable rows={report} groupLabel={GROUPS[groupBy]?.label ?? 'Groep'} onOpen={show} sortKey={sortKey} onSort={setSortKey} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---- price list ---- */}
        <TabsContent value="prijzen" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => exportGroups('whatsapp-prijslijst', 'Auto · bouwjaar · klus', priceList)}>
              Download (Excel)
            </Button>
            <span className="text-muted-foreground text-xs">Prijzen incl. btw. Zonder btw-vermelding in het gesprek telt de prijs als incl.</span>
          </div>
          <Card>
            <CardContent className="overflow-x-auto py-2">
              <GroupTable rows={priceList} groupLabel="Auto · bouwjaar · klus" onOpen={show} sortKey={sortKey} onSort={setSortKey} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---- why customers left ---- */}
        <TabsContent value="verloren" className="flex flex-col gap-3">
          <Card>
            <CardHeader>
              <CardTitle>Waarom klanten afhaakten</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <GroupTable rows={lossReasons} groupLabel="Reden" onOpen={show} sortKey={sortKey} onSort={setSortKey} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Wat ze zeiden</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              {filtered
                .filter((q) => q.outcome === 'verloren' && q.lost_detail)
                .slice(0, 40)
                .map((q) => (
                  <button key={q.id} type="button" className="hover:bg-muted/50 rounded-md p-2 text-left" onClick={() => show(`${car(q)} ${q.year ?? ''}`, [q.id])}>
                    <span className="text-muted-foreground text-xs">
                      {day(q.asked_at)} · {car(q)} {q.year ?? ''} · {eur(q.price_incl)} · {q.lost_reason ? REASON[q.lost_reason] : ''}
                    </span>
                    <div>&ldquo;{q.lost_detail}&rdquo;</div>
                  </button>
                ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---- what we turned away ---- */}
        <TabsContent value="afgewezen">
          <Card>
            <CardHeader>
              <CardTitle>Klussen die wij afwezen</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {declinedCars.length === 0 ? (
                <p className="text-muted-foreground text-sm">Geen binnen deze filters.</p>
              ) : (
                <GroupTable rows={declinedCars} groupLabel="Auto · reden" onOpen={show} sortKey={sortKey} onSort={setSortKey} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---- every question ---- */}
        <TabsContent value="vragen" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {drill && (
              <Button variant="outline" size="sm" onClick={() => setDrill(null)}>
                {drill.label} ✕
              </Button>
            )}
            <span className="text-muted-foreground text-sm">{list.length} vragen</span>
            <Button variant="outline" size="sm" className="ml-auto" onClick={exportList}>
              Download lijst (Excel)
            </Button>
          </div>
          <Card>
            <CardContent className="overflow-x-auto py-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Klant</TableHead>
                    <TableHead>Auto</TableHead>
                    <TableHead>Klus</TableHead>
                    <TableHead>Plaats</TableHead>
                    <TableHead className="text-right">Prijs</TableHead>
                    <TableHead>Uitkomst</TableHead>
                    <TableHead>Gecontroleerd</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((q) => (
                    <Fragment key={q.id}>
                      <TableRow className={`cursor-pointer ${q.review === 'afgewezen' ? 'opacity-50' : ''}`} onClick={() => setOpen(open === q.id ? null : q.id)}>
                        <TableCell className="whitespace-nowrap">{day(q.asked_at)}</TableCell>
                        <TableCell>{q.contact_name ?? q.phone ?? '–'}</TableCell>
                        <TableCell>
                          {car(q)} {q.year ?? ''}
                        </TableCell>
                        <TableCell>{q.scenario ? SCENARIO[q.scenario] : '–'}</TableCell>
                        <TableCell>{q.city ?? '–'}</TableCell>
                        <TableCell className="text-right whitespace-nowrap tabular-nums">
                          {eur(q.price_amount)}
                          {q.price_max ? `–${eur(q.price_max)}` : ''}{' '}
                          <span className="text-muted-foreground text-xs">
                            {q.price_amount == null ? '' : q.price_vat === 'excl' ? 'ex' : q.price_vat_assumed ? 'incl?' : 'incl'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <OutcomeBadge outcome={q.outcome} />
                          {reasonOf(q) && <span className="text-muted-foreground ml-1 text-xs">{REASON[reasonOf(q)!]}</span>}
                        </TableCell>
                        <TableCell className="text-xs">{q.review === 'goedgekeurd' ? '✓' : q.review === 'afgewezen' ? 'Fout' : ''}</TableCell>
                      </TableRow>
                      {open === q.id && (
                        <TableRow>
                          <TableCell colSpan={8} className="bg-muted/40 whitespace-normal">
                            <div className="flex flex-col gap-3 py-2 text-sm">
                              <div className="grid gap-1 md:grid-cols-2">
                                <p><span className="text-muted-foreground">Probleem:</span> {q.problem}</p>
                                <p><span className="text-muted-foreground">Product:</span> {q.product ?? '–'}</p>
                                <p>
                                  <span className="text-muted-foreground">Plaats / spoed:</span> {q.city ?? '–'}
                                  {q.postcode ? ` (${q.postcode})` : ''} · {q.urgency}
                                  {q.requested_time ? ` · ${q.requested_time}` : ''}
                                </p>
                                <p><span className="text-muted-foreground">Voorwaarden:</span> {q.conditions ?? '–'}</p>
                                <p>
                                  <span className="text-muted-foreground">Telefoon:</span> {q.phone ?? '–'}
                                  {q.kenteken ? ` · ${q.kenteken}` : ''}
                                  {q.reply_minutes != null && <> · eerste antwoord na {q.reply_minutes} min</>}
                                </p>
                                <p>
                                  <span className="text-muted-foreground">Onderhandeling:</span>{' '}
                                  {[
                                    q.price_objection && 'klant vond het duur',
                                    q.time_objection && 'klant vond het te laat',
                                    q.customer_budget && `budget klant ${eur(q.customer_budget)}`,
                                    q.we_lowered_price && `wij zakten${q.final_price_amount ? ` naar ${eur(q.final_price_amount)}` : ''}`,
                                    q.competitor_price && `concurrent ${eur(q.competitor_price)}${q.competitor ? ` (${q.competitor})` : ''}`,
                                    q.we_followed_up && 'wij stuurden een herinnering',
                                  ]
                                    .filter(Boolean)
                                    .join(' · ') || '–'}
                                </p>
                                {(q.lost_detail || q.declined_detail) && (
                                  <p className="md:col-span-2">
                                    <span className="text-muted-foreground">Woorden:</span> &ldquo;{q.lost_detail ?? q.declined_detail}&rdquo;
                                  </p>
                                )}
                              </div>
                              <div className="bg-background flex flex-col gap-1 rounded-md border p-3">
                                {q.context.map((m) => (
                                  <div key={m.id} className={`flex gap-2 ${m.from_me ? 'justify-end' : ''}`}>
                                    <div className={`max-w-[80%] rounded-lg px-3 py-1.5 ${m.from_me ? 'bg-emerald-100 dark:bg-emerald-500/15' : 'bg-muted'}`}>
                                      <div className="text-muted-foreground text-[10px]">
                                        {m.from_me ? 'Wij' : 'Klant'} · {time(m.at)}
                                      </div>
                                      <div className="whitespace-pre-wrap">{m.text}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-muted-foreground text-xs">
                                  Klopt deze regel? (zekerheid AI: {q.confidence == null ? '–' : Math.round(q.confidence * 100) + '%'})
                                </span>
                                <Button size="sm" disabled={busy === q.id} onClick={() => setReview(q.id, 'goedgekeurd')}>
                                  Klopt
                                </Button>
                                <Button size="sm" variant="outline" disabled={busy === q.id} onClick={() => setReview(q.id, 'afgewezen')}>
                                  Klopt niet
                                </Button>
                                {q.review !== 'nieuw' && (
                                  <Button size="sm" variant="ghost" disabled={busy === q.id} onClick={() => setReview(q.id, 'nieuw')}>
                                    Terugzetten
                                  </Button>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
