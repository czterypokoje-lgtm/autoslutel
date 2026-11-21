'use client';

import { Fragment, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  scenario: string | null;
  problem: string;
  product: string | null;
  city: string | null;
  urgency: string;
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
  competitor_price: number | null;
  competitor: string | null;
  we_lowered_price: boolean;
  final_price_amount: number | null;
  job_id: string | null;
  confidence: number | null;
  review: string;
};

export type PriceLine = {
  make: string;
  model: string | null;
  year_from: number | null;
  year_to: number | null;
  scenario: string | null;
  quotes: number;
  min_incl: number | null;
  median_incl: number | null;
  max_incl: number | null;
  won: number;
  lost: number;
  lost_on_price: number;
  median_won_incl: number | null;
  quote_ids: string[];
};

export type Loss = {
  reason: string;
  scenario: string | null;
  lost: number;
  median_our_price_incl: number | null;
  median_competitor_price: number | null;
  recent_words: string[] | null;
  quote_ids: string[];
};

export type Declined = {
  make: string;
  model: string | null;
  year_from: number | null;
  scenario: string | null;
  declined_reason: string | null;
  declined: number;
  our_words: string[] | null;
  quote_ids: string[];
};

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

const eur = (n: number | null | undefined) =>
  n == null ? '–' : new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
const day = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat('nl-NL', { timeZone: 'Europe/Amsterdam', day: 'numeric', month: 'short' }).format(new Date(iso)) : '–';
const time = (iso: string) =>
  new Intl.DateTimeFormat('nl-NL', { timeZone: 'Europe/Amsterdam', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
const car = (q: { make: string; model: string | null }) => [q.make, q.model].filter(Boolean).join(' ') || 'Onbekende auto';
const pct = (a: number, b: number) => (b ? `${Math.round((100 * a) / b)}%` : '–');
const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 py-4">
        <span className="text-muted-foreground text-xs">{label}</span>
        <span className="text-2xl font-medium tabular-nums">{value}</span>
        {hint && <span className="text-muted-foreground text-xs">{hint}</span>}
      </CardContent>
    </Card>
  );
}

function OutcomeBadge({ outcome }: { outcome: string }) {
  return (
    <Badge variant="outline" className={OUTCOME_CLASS[outcome]}>
      {OUTCOME[outcome] ?? outcome}
    </Badge>
  );
}

export default function AnalyseView({
  quotes,
  prices,
  losses,
  declined,
}: {
  quotes: Quote[];
  prices: PriceLine[];
  losses: Loss[];
  declined: Declined[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState('overzicht');
  const [filter, setFilter] = useState<{ label: string; ids: Set<string> } | null>(null);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  /** Open the rows behind any number on the page. */
  function show(label: string, ids: string[]) {
    setFilter({ label, ids: new Set(ids) });
    setSearch('');
    setOpen(null);
    setTab('vragen');
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

  const live = useMemo(() => quotes.filter((q) => q.review !== 'afgewezen'), [quotes]);

  const totals = useMemo(() => {
    const by = (o: string) => live.filter((q) => q.outcome === o);
    const decided = live.filter((q) => q.outcome !== 'onbekend').length;
    const replies = live.map((q) => q.reply_minutes).filter((m): m is number => m != null);
    return {
      won: by('gewonnen'),
      lost: by('verloren'),
      silent: by('geen_reactie'),
      declined: by('afgewezen_door_ons'),
      quoted: live.filter((q) => q.price_amount != null),
      decided,
      reply: median(replies),
      proven: live.filter((q) => q.job_id).length,
      lostOnPrice: live.filter((q) => q.lost_reason === 'prijs'),
    };
  }, [live]);

  const scenarios = useMemo(() => {
    return Object.keys(SCENARIO).map((s) => {
      const rows = live.filter((q) => q.scenario === s);
      const priced = rows.map((q) => q.price_incl).filter((p): p is number => p != null);
      return {
        key: s,
        rows,
        quoted: priced.length,
        median: median(priced),
        won: rows.filter((q) => q.outcome === 'gewonnen').length,
        decided: rows.filter((q) => q.outcome !== 'onbekend').length,
      };
    });
  }, [live]);

  const list = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return quotes.filter((q) => {
      if (filter && !filter.ids.has(q.id)) return false;
      if (!needle) return true;
      return [q.make, q.model, q.problem, q.contact_name, q.phone, q.city, q.lost_detail, q.quote_excerpt]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle));
    });
  }, [quotes, filter, search]);

  if (!quotes.length) {
    return <p className="text-muted-foreground text-sm">Nog geen WhatsApp-gegevens geïmporteerd.</p>;
  }

  return (
    <Tabs value={tab} onValueChange={setTab} className="flex flex-col gap-4">
      <TabsList className="flex-wrap">
        <TabsTrigger value="overzicht">Overzicht</TabsTrigger>
        <TabsTrigger value="prijzen">Prijslijst</TabsTrigger>
        <TabsTrigger value="verloren">Verloren</TabsTrigger>
        <TabsTrigger value="afgewezen">Afgewezen</TabsTrigger>
        <TabsTrigger value="vragen">Alle vragen ({quotes.length})</TabsTrigger>
      </TabsList>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <TabsContent value="overzicht" className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <button type="button" className="text-left" onClick={() => show('Alle prijsvragen', live.map((q) => q.id))}>
            <Kpi label="Prijsvragen" value={String(live.length)} hint={`${totals.quoted.length} met prijs`} />
          </button>
          <button type="button" className="text-left" onClick={() => show('Gewonnen', totals.won.map((q) => q.id))}>
            <Kpi label="Gewonnen" value={String(totals.won.length)} hint={`${pct(totals.won.length, totals.decided)} van beslist · ${totals.proven} met klus in CRM`} />
          </button>
          <button type="button" className="text-left" onClick={() => show('Geen reactie na ons antwoord', totals.silent.map((q) => q.id))}>
            <Kpi label="Geen reactie" value={String(totals.silent.length)} hint="Klant stil na ons antwoord" />
          </button>
          <button type="button" className="text-left" onClick={() => show('Verloren op prijs', totals.lostOnPrice.map((q) => q.id))}>
            <Kpi label="Verloren" value={String(totals.lost.length)} hint={`${totals.lostOnPrice.length} op prijs`} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <button type="button" className="text-left" onClick={() => show('Door ons afgewezen', totals.declined.map((q) => q.id))}>
            <Kpi label="Door ons afgewezen" value={String(totals.declined.length)} />
          </button>
          <Kpi label="Eerste echt antwoord" value={totals.reply == null ? '–' : `${Math.round(totals.reply)} min`} hint="Mediaan, automatische 'Hallo' niet meegeteld" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Per soort klus</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Klus</TableHead>
                  <TableHead className="text-right">Vragen</TableHead>
                  <TableHead className="text-right">Met prijs</TableHead>
                  <TableHead className="text-right">Middenprijs incl.</TableHead>
                  <TableHead className="text-right">Gewonnen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scenarios.map((s) => (
                  <TableRow key={s.key} className="cursor-pointer" onClick={() => show(SCENARIO[s.key], s.rows.map((q) => q.id))}>
                    <TableCell>{SCENARIO[s.key]}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.rows.length}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.quoted}</TableCell>
                    <TableCell className="text-right tabular-nums">{eur(s.median)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {s.won} <span className="text-muted-foreground">({pct(s.won, s.decided)})</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="prijzen">
        <Card>
          <CardHeader>
            <CardTitle>Prijslijst uit WhatsApp (incl. btw)</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Auto</TableHead>
                  <TableHead>Bouwjaar</TableHead>
                  <TableHead>Klus</TableHead>
                  <TableHead className="text-right">Keer</TableHead>
                  <TableHead className="text-right">Laagst</TableHead>
                  <TableHead className="text-right">Midden</TableHead>
                  <TableHead className="text-right">Hoogst</TableHead>
                  <TableHead className="text-right">Gewonnen</TableHead>
                  <TableHead className="text-right">Verloren op prijs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prices.map((p, i) => (
                  <TableRow
                    key={i}
                    className="cursor-pointer"
                    onClick={() => show(`${car(p)} · ${p.scenario ? SCENARIO[p.scenario] : 'klus onbekend'}`, p.quote_ids)}
                  >
                    <TableCell>{car(p)}</TableCell>
                    <TableCell>{p.year_from == null ? '–' : `${p.year_from}–${p.year_to}`}</TableCell>
                    <TableCell>{p.scenario ? SCENARIO[p.scenario] : '–'}</TableCell>
                    <TableCell className="text-right tabular-nums">{p.quotes}</TableCell>
                    <TableCell className="text-right tabular-nums">{eur(p.min_incl)}</TableCell>
                    <TableCell className="text-right tabular-nums">{eur(p.median_incl)}</TableCell>
                    <TableCell className="text-right tabular-nums">{eur(p.max_incl)}</TableCell>
                    <TableCell className="text-right tabular-nums">{p.won}</TableCell>
                    <TableCell className="text-right tabular-nums">{p.lost_on_price || ''}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="text-muted-foreground mt-3 text-xs">
              Prijzen zonder btw-vermelding in het gesprek tellen als incl. btw. Klik een regel voor de gesprekken.
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="verloren">
        <Card>
          <CardHeader>
            <CardTitle>Waarom klanten afhaakten</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reden</TableHead>
                  <TableHead>Klus</TableHead>
                  <TableHead className="text-right">Aantal</TableHead>
                  <TableHead className="text-right">Onze prijs</TableHead>
                  <TableHead className="text-right">Concurrent</TableHead>
                  <TableHead>Wat ze zeiden</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {losses.map((l, i) => (
                  <TableRow key={i} className="cursor-pointer" onClick={() => show(`Afgehaakt: ${REASON[l.reason] ?? l.reason}`, l.quote_ids)}>
                    <TableCell>{REASON[l.reason] ?? l.reason}</TableCell>
                    <TableCell>{l.scenario ? SCENARIO[l.scenario] : '–'}</TableCell>
                    <TableCell className="text-right tabular-nums">{l.lost}</TableCell>
                    <TableCell className="text-right tabular-nums">{eur(l.median_our_price_incl)}</TableCell>
                    <TableCell className="text-right tabular-nums">{eur(l.median_competitor_price)}</TableCell>
                    <TableCell className="text-muted-foreground max-w-md text-xs">
                      {(l.recent_words ?? []).slice(0, 2).map((w) => `“${w}”`).join(' · ')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="text-muted-foreground mt-3 text-xs">Verloren én klanten die na ons antwoord stil bleven (reden onbekend).</p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="afgewezen">
        <Card>
          <CardHeader>
            <CardTitle>Klussen die wij afwezen</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {declined.length === 0 ? (
              <p className="text-muted-foreground text-sm">Geen.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Auto</TableHead>
                    <TableHead>Bouwjaar</TableHead>
                    <TableHead>Klus</TableHead>
                    <TableHead>Reden</TableHead>
                    <TableHead className="text-right">Keer</TableHead>
                    <TableHead>Onze woorden</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {declined.map((d, i) => (
                    <TableRow key={i} className="cursor-pointer" onClick={() => show(`Afgewezen: ${car(d)}`, d.quote_ids)}>
                      <TableCell>{car(d)}</TableCell>
                      <TableCell>{d.year_from == null ? '–' : `${d.year_from}+`}</TableCell>
                      <TableCell>{d.scenario ? SCENARIO[d.scenario] : '–'}</TableCell>
                      <TableCell>{d.declined_reason ? REASON[d.declined_reason] ?? d.declined_reason : '–'}</TableCell>
                      <TableCell className="text-right tabular-nums">{d.declined}</TableCell>
                      <TableCell className="text-muted-foreground max-w-md text-xs">{(d.our_words ?? [])[0] ?? ''}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="vragen" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Zoek op auto, klant, plaats of woorden"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          {filter && (
            <Button variant="outline" size="sm" onClick={() => setFilter(null)}>
              {filter.label} ✕
            </Button>
          )}
          <span className="text-muted-foreground text-sm">{list.length} vragen</span>
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
                      <TableCell className="text-right tabular-nums whitespace-nowrap">
                        {eur(q.price_amount)}
                        {q.price_max ? `–${eur(q.price_max)}` : ''}{' '}
                        <span className="text-muted-foreground text-xs">
                          {q.price_amount == null ? '' : q.price_vat === 'excl' ? 'ex' : q.price_vat_assumed ? 'incl?' : 'incl'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <OutcomeBadge outcome={q.outcome} />
                        {q.lost_reason && <span className="text-muted-foreground ml-1 text-xs">{REASON[q.lost_reason]}</span>}
                      </TableCell>
                      <TableCell className="text-xs">
                        {q.review === 'goedgekeurd' ? '✓' : q.review === 'afgewezen' ? 'Fout' : ''}
                      </TableCell>
                    </TableRow>
                    {open === q.id && (
                      <TableRow>
                        <TableCell colSpan={7} className="bg-muted/40 whitespace-normal">
                          <div className="flex flex-col gap-3 py-2 text-sm">
                            <div className="grid gap-1 md:grid-cols-2">
                              <p><span className="text-muted-foreground">Probleem:</span> {q.problem}</p>
                              <p><span className="text-muted-foreground">Product:</span> {q.product ?? '–'}</p>
                              <p><span className="text-muted-foreground">Plaats / spoed:</span> {q.city ?? '–'} · {q.urgency}</p>
                              <p><span className="text-muted-foreground">Voorwaarden:</span> {q.conditions ?? '–'}</p>
                              <p>
                                <span className="text-muted-foreground">Telefoon:</span> {q.phone ?? '–'}
                                {q.reply_minutes != null && <> · eerste antwoord na {q.reply_minutes} min</>}
                              </p>
                              <p>
                                <span className="text-muted-foreground">Onderhandeling:</span>{' '}
                                {[
                                  q.price_objection && 'klant vond het duur',
                                  q.we_lowered_price && `wij zakten${q.final_price_amount ? ` naar ${eur(q.final_price_amount)}` : ''}`,
                                  q.competitor_price && `concurrent ${eur(q.competitor_price)}${q.competitor ? ` (${q.competitor})` : ''}`,
                                ]
                                  .filter(Boolean)
                                  .join(' · ') || '–'}
                              </p>
                              {(q.lost_detail || q.declined_detail) && (
                                <p className="md:col-span-2">
                                  <span className="text-muted-foreground">Woorden:</span> “{q.lost_detail ?? q.declined_detail}”
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col gap-1 rounded-md border bg-background p-3">
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
  );
}
