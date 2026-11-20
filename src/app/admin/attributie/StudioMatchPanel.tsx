'use client';

import { PreviewText } from '@/app/admin/PreviewLanguage';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { ClickRow, JobRow } from './MatchPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const NONE = '__none__';

/** "2026-10-03T19:39:11+00:00" → "19:39", in Amsterdam. */
const clock = (iso: string) =>
  new Intl.DateTimeFormat('nl-NL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' }).format(new Date(iso));

/**
 * Studio restyle of MatchPanel: same date stepping, same choice state and the
 * same /api/admin/jobs/:id/call-clicks POST — only the markup changes, onto
 * shadcn Card/Table/Select/Badge.
 */
export default function StudioMatchPanel({
  date,
  today,
  clicks,
  jobs,
}: {
  date: string;
  today: string;
  clicks: ClickRow[];
  jobs: JobRow[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [choice, setChoice] = useState<Record<string, string>>({});

  const open = clicks.filter((c) => !c.claimed && c.hasClickId);
  const candidates = jobs.filter((j) => !j.attributed);

  async function link(clickId: string) {
    const jobId = choice[clickId];
    if (!jobId) return;
    setBusy(clickId);
    setError('');
    setDone('');

    const response = await fetch(`/api/admin/jobs/${jobId}/call-clicks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ click_id: clickId }),
    }).catch(() => null);

    const result = await response?.json().catch(() => null);
    if (!response?.ok) {
      setError(result?.error ?? 'Koppelen mislukt.');
      setBusy(null);
      return;
    }

    setDone('Gekoppeld. Deze klus telt nu mee als advertentieconversie.');
    setBusy(null);
    router.refresh();
  }

  function goToDate(value: string) {
    router.push(`/admin/attributie?datum=${value}`);
  }

  const shift = (days: number) => {
    const d = new Date(`${date}T12:00:00`);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={() => goToDate(shift(-1))}>
          <PreviewText>← Vorige dag</PreviewText>
        </Button>
        <Input type="date" value={date} max={today} onChange={(e) => goToDate(e.target.value)} className="w-44" />
        <Button variant="outline" onClick={() => goToDate(shift(1))} disabled={date >= today}>
          <PreviewText>Volgende dag →</PreviewText>
        </Button>
        {date !== today && (
          <Button variant="outline" onClick={() => goToDate(today)}>
            <PreviewText>Vandaag</PreviewText>
          </Button>
        )}
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}
      {done && <p className="text-emerald-700 text-sm dark:text-emerald-400"><PreviewText>{done}</PreviewText></p>}

      {!candidates.length && open.length > 0 && (
        <p className="bg-muted/50 rounded-lg border px-4 py-3 text-sm">
          <PreviewText>
            {jobs.length
              ? 'Alle klussen van deze en de volgende dag hebben al een bron.'
              : 'Geen klussen op deze of de volgende dag.'}
          </PreviewText>{' '}
          <PreviewText>
            Een klik hoort soms bij een klus verderop in de week — zoek die klus op en koppel hem daar, met de code uit het
            WhatsApp-bericht.
          </PreviewText>
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            <PreviewText>Advertentieklikken</PreviewText> — {open.length} <PreviewText>vrij</PreviewText>, {clicks.length} <PreviewText>totaal</PreviewText>
          </CardTitle>
        </CardHeader>
        <CardContent className={clicks.length ? 'overflow-x-auto' : undefined}>
          {!clicks.length ? (
            <p className="text-muted-foreground text-sm"><PreviewText>Geen advertentieklikken op deze dag.</PreviewText></p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><PreviewText>Tijd</PreviewText></TableHead>
                  <TableHead><PreviewText>Netwerk</PreviewText></TableHead>
                  <TableHead><PreviewText>Campagne</PreviewText></TableHead>
                  <TableHead><PreviewText>Zoekterm</PreviewText></TableHead>
                  <TableHead><PreviewText>Pagina</PreviewText></TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead><PreviewText>Koppel aan klus</PreviewText></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clicks.map((click) => (
                  <TableRow key={click.id} className={click.claimed ? 'opacity-60' : undefined}>
                    <TableCell className="font-mono text-xs">{clock(click.at)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          click.network === 'Microsoft'
                            ? undefined
                            : 'border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300'
                        }
                      >
                        {click.network}
                      </Badge>
                    </TableCell>
                    <TableCell className={click.campaignName ? undefined : 'font-mono text-xs'}>
                      {click.campaignName ? (
                        <>
                          {click.campaignName}
                          <div className="text-muted-foreground text-[11px]">{click.campaignId}</div>
                        </>
                      ) : (
                        (click.campaignId ?? '—')
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-32 truncate" title={click.keyword ?? ''}>{click.keyword ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground max-w-32 truncate" title={click.page ?? ''}>{click.page ?? '—'}</TableCell>
                    <TableCell className="font-mono text-xs">{click.ref ?? '—'}</TableCell>
                    <TableCell>
                      {click.claimed ? (
                        <span className="text-muted-foreground text-sm"><PreviewText>Al gekoppeld</PreviewText></span>
                      ) : !click.hasClickId ? (
                        <span className="text-muted-foreground text-sm"><PreviewText>Geen klik-id — niets te melden</PreviewText></span>
                      ) : !candidates.length ? (
                        <span className="text-muted-foreground text-sm"><PreviewText>Geen vrije klus</PreviewText></span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Select
                            value={choice[click.id] || NONE}
                            onValueChange={(value) => setChoice((prev) => ({ ...prev, [click.id]: value === NONE ? '' : value }))}
                          >
                            <SelectTrigger className="w-56"><SelectValue placeholder="— kies een klus —" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value={NONE}>— kies een klus —</SelectItem>
                              {candidates.map((job) => (
                                <SelectItem key={job.id} value={job.id}>
                                  {`${job.scheduledDate && job.scheduledDate !== date ? 'morgen ' : ''}${job.slotStart ? `${job.slotStart.slice(0, 5)} ` : ''}${job.customer?.trim() || job.car || 'Klus'}${job.city ? ` · ${job.city}` : ''}${job.phone ? ` · ${job.phone}` : ''}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button size="sm" onClick={() => link(click.id)} disabled={busy === click.id || !choice[click.id]}>
                            {busy === click.id ? '…' : <PreviewText>Koppel</PreviewText>}
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <PreviewText>Klussen deze en volgende dag</PreviewText> — {candidates.length} <PreviewText>zonder bron</PreviewText>, {jobs.length} <PreviewText>totaal</PreviewText>
          </CardTitle>
        </CardHeader>
        <CardContent className={jobs.length ? 'overflow-x-auto' : undefined}>
          {!jobs.length ? (
            <p className="text-muted-foreground text-sm"><PreviewText>Geen klussen gepland op deze dag.</PreviewText></p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><PreviewText>Afspraak</PreviewText></TableHead>
                  <TableHead><PreviewText>Ingevoerd</PreviewText></TableHead>
                  <TableHead><PreviewText>Klant</PreviewText></TableHead>
                  <TableHead><PreviewText>Telefoon</PreviewText></TableHead>
                  <TableHead><PreviewText>Auto</PreviewText></TableHead>
                  <TableHead><PreviewText>Plaats</PreviewText></TableHead>
                  <TableHead><PreviewText>Waarde</PreviewText></TableHead>
                  <TableHead><PreviewText>Bron</PreviewText></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-mono text-xs">{job.slotStart?.slice(0, 5) ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{clock(job.createdAt)}</TableCell>
                    <TableCell>
                      <Link href={`/admin/jobs/${job.id}`} className="hover:underline">{job.customer?.trim() || 'Klus'}</Link>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{job.phone ?? '—'}</TableCell>
                    <TableCell>{job.car ?? '—'}</TableCell>
                    <TableCell>{job.city ?? '—'}</TableCell>
                    <TableCell>{job.value ? MONEY.format(job.value) : '—'}</TableCell>
                    <TableCell>
                      {job.attributed ? (
                        <Badge className="border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300" variant="outline">
                          <PreviewText>Bekend</PreviewText>
                        </Badge>
                      ) : (
                        <Badge className="border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-300" variant="outline">
                          <PreviewText>Onbekend</PreviewText>
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-sm">
        <strong className="text-foreground"><PreviewText>Hoe u dit zeker weet.</PreviewText></strong>{' '}
        <PreviewText>De code in de kolom Code is het enige harde bewijs:</PreviewText> die staat in het WhatsApp-bericht van
        de klant. Verder gaat het om herkennen — de minuut van de klik, de campagne die ervoor betaalde en de pagina die ze
        lazen, naast uw eigen gesprek. Twijfelt u? Koppel niet. Een verkeerde klik naar Google leert Smart Bidding het
        verkeerde verkeer in te kopen, en dat kost meer dan een klus die als organisch geboekt blijft staan.
      </p>
    </div>
  );
}
