'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Candidate, SaleReview, SaleStatus, SaleSource } from '@/lib/conversionMatcher';
import { RULE_INFO, STRENGTH_LABEL, VAT_RATE, type Strength } from '@/lib/conversionRules';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const WHEN = new Intl.DateTimeFormat('nl-NL', { timeZone: 'Europe/Amsterdam', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const DAY = new Intl.DateTimeFormat('nl-NL', { timeZone: 'Europe/Amsterdam', day: 'numeric', month: 'short', year: 'numeric' });

const SOURCE_LABEL: Record<SaleSource, string> = {
  job: 'Klus',
  whatsapp_quote: 'WhatsApp-verkoop',
  whatsapp_review: 'WhatsApp-code',
};

const STRENGTH_CLASS: Record<Strength, string> = {
  hard: 'border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300',
  strong: 'border-sky-200 bg-sky-100 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/15 dark:text-sky-300',
  medium: 'border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-300',
  weak: 'border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/15 dark:text-rose-300',
};

const TABS: { status: SaleStatus; label: string }[] = [
  { status: 'voorstel', label: 'Te beoordelen' },
  { status: 'bevestigd', label: 'Bevestigd' },
  { status: 'geen', label: 'Geen spoor' },
  { status: 'te_oud', label: 'Te oud voor Google' },
];

const parseAmount = (s: string): number | null => {
  const n = Number(s.trim().replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
};
const excl = (incl: number) => Math.round((incl / (1 + VAT_RATE)) * 100) / 100;

function minutes(m: number): string {
  if (m < 60) return `${m} min`;
  if (m < 48 * 60) return `${Math.round(m / 60)} uur`;
  return `${Math.round(m / 1440)} dagen`;
}

async function send(method: 'POST' | 'DELETE', body?: object, id?: string): Promise<string | null> {
  const res = await fetch(id ? `/api/admin/conversies?id=${encodeURIComponent(id)}` : '/api/admin/conversies', {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.ok) return null;
  return ((await res.json().catch(() => null)) as { error?: string } | null)?.error ?? 'Opslaan mislukt';
}

function SaleHead({ review }: { review: SaleReview }) {
  const { sale } = review;
  return (
    <CardHeader>
      <CardTitle className="flex flex-wrap items-center gap-2 text-base">
        <Badge variant="outline">{SOURCE_LABEL[sale.source]}</Badge>
        <span>{sale.title}</span>
        <span className="text-muted-foreground text-sm font-normal">{DAY.format(new Date(sale.at))}</span>
      </CardTitle>
      {sale.detail && <CardDescription>{sale.detail}</CardDescription>}
    </CardHeader>
  );
}

function ProposalCard({ review, onError }: { review: SaleReview; onError: (m: string) => void }) {
  const router = useRouter();
  const { sale } = review;
  const [amount, setAmount] = useState(sale.valueIncl ? sale.valueIncl.toFixed(2) : '');
  const [busy, setBusy] = useState(false);
  const incl = parseAmount(amount);
  const typed = incl !== null && incl !== sale.valueIncl;

  async function decide(c: Candidate, decision: 'bevestigd' | 'afgewezen') {
    if (decision === 'bevestigd' && c.strength === 'weak' && !window.confirm('Deze koppeling rust alleen op de tijd van de klik. Weet u zeker dat dit de klant was?')) return;
    setBusy(true);
    const error = await send('POST', {
      source: sale.source,
      sourceId: sale.id,
      clickId: c.id,
      decision,
      valueIncl: decision === 'bevestigd' && typed ? incl : undefined,
    });
    setBusy(false);
    if (error) onError(error);
    else router.refresh();
  }

  return (
    <Card>
      <SaleHead review={review} />
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <label htmlFor={`amt-${sale.id}`} className="text-muted-foreground">Bedrag incl. btw</label>
          <Input id={`amt-${sale.id}`} inputMode="decimal" className="w-28" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <span>
            = <strong>{incl ? MONEY.format(excl(incl)) : '–'}</strong> excl. btw naar Google
          </span>
          {sale.vatAssumed && !typed && <span className="text-muted-foreground text-xs">(btw niet genoemd; incl. aangenomen)</span>}
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bewijs</TableHead>
                <TableHead>Klik</TableHead>
                <TableHead>Ervoor</TableHead>
                <TableHead>Campagne / pagina</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {review.candidates.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className={STRENGTH_CLASS[c.strength]}>{STRENGTH_LABEL[c.strength]}</Badge>
                      {c.rules.map((r) => (
                        <Badge key={r} variant="outline">{RULE_INFO[r].label}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {WHEN.format(new Date(c.clickedAt))}
                    <div className="text-muted-foreground font-mono text-xs">{c.kind} …{c.id.slice(-8)}</div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{minutes(c.minutesBefore)}</TableCell>
                  <TableCell className="text-xs">
                    {c.campaignId ?? '–'}
                    <div className="text-muted-foreground">{c.page ?? ''}</div>
                  </TableCell>
                  <TableCell>
                    {c.taken ? (
                      <span className="text-muted-foreground text-xs">Al gekoppeld aan andere verkoop</span>
                    ) : (
                      <div className="flex gap-2">
                        <Button size="sm" disabled={busy || !incl} onClick={() => decide(c, 'bevestigd')}>Bevestig</Button>
                        <Button size="sm" variant="outline" disabled={busy} onClick={() => decide(c, 'afgewezen')}>Niet deze</Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function ConfirmedCard({ review, onError }: { review: SaleReview; onError: (m: string) => void }) {
  const router = useRouter();
  const d = review.confirmed!;
  const [busy, setBusy] = useState(false);
  const rule = RULE_INFO[d.rule as keyof typeof RULE_INFO];

  async function undo() {
    setBusy(true);
    const error = await send('DELETE', undefined, d.id);
    setBusy(false);
    if (error) onError(error);
    else router.refresh();
  }

  return (
    <Card>
      <SaleHead review={review} />
      <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <span>{rule?.label ?? d.rule}</span>
        <span className="font-mono text-xs">{d.click_kind} …{d.click_id.slice(-8)}</span>
        <span>
          {MONEY.format(Number(d.value_incl_btw) || 0)} incl. btw{d.vat_assumed ? ' (aangenomen)' : ''} → <strong>{MONEY.format(Number(d.value_excl_btw) || 0)} excl. btw</strong>
        </span>
        {d.uploaded_at ? (
          <span className="text-muted-foreground">Door Google opgehaald op {DAY.format(new Date(d.uploaded_at))}; terugdraaien kan alleen in Google Ads.</span>
        ) : (
          <Button size="sm" variant="outline" disabled={busy} onClick={undo}>Ongedaan maken</Button>
        )}
      </CardContent>
    </Card>
  );
}

function PlainCard({ review }: { review: SaleReview }) {
  return (
    <Card>
      <SaleHead review={review} />
      <CardContent className="text-muted-foreground text-sm">
        {review.sale.valueIncl ? `${MONEY.format(review.sale.valueIncl)} incl. btw` : 'Geen bedrag'}
      </CardContent>
    </Card>
  );
}

/** Sales with their proposed clicks. Nothing is sent before someone presses Bevestig. */
export default function ConversionReview({ reviews }: { reviews: SaleReview[] }) {
  const [tab, setTab] = useState<SaleStatus>('voorstel');
  const [error, setError] = useState('');
  const shown = reviews.filter((r) => r.status === tab);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Button key={t.status} size="sm" variant={tab === t.status ? 'default' : 'outline'} onClick={() => setTab(t.status)}>
            {t.label} ({reviews.filter((r) => r.status === t.status).length})
          </Button>
        ))}
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      {tab === 'voorstel' && (
        <p className="text-muted-foreground text-sm">
          Twijfelt u? Kies &quot;Niet deze&quot; of laat het staan. Een verkeerde klik leert Google het verkeerde verkeer in te kopen; een gemiste
          kost alleen één datapunt.
        </p>
      )}
      {tab === 'te_oud' && (
        <p className="text-muted-foreground text-sm">Verkocht meer dan 90 dagen geleden: Google accepteert deze klikken niet meer. Alleen ter informatie.</p>
      )}
      {shown.length === 0 ? (
        <p className="text-muted-foreground text-sm">Niets in deze lijst.</p>
      ) : (
        shown.slice(0, 200).map((r) =>
          r.status === 'voorstel' ? (
            <ProposalCard key={`${r.sale.source}:${r.sale.id}`} review={r} onError={setError} />
          ) : r.status === 'bevestigd' ? (
            <ConfirmedCard key={`${r.sale.source}:${r.sale.id}`} review={r} onError={setError} />
          ) : (
            <PlainCard key={`${r.sale.source}:${r.sale.id}`} review={r} />
          )
        )
      )}
    </div>
  );
}
