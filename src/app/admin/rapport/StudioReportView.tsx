import { PreviewText } from '@/app/admin/PreviewLanguage';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { isoDate } from '@/lib/crmJobs';
import { technicianColour } from '@/lib/crmColours';
import SalesChart from '../overzicht/SalesChart';
import { SPAN_LABEL, type Bucket, type Report, type Span } from './reportData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const EUR = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const money = (v: number | null) => (v === null ? '—' : EUR.format(v));
const pct = (part: number, whole: number) => (whole > 0 ? `${Math.round((part / whole) * 100)}%` : '—');

/** "↑ 12%" against the previous period; lower-is-better flips the colour. */
function Delta({ cur, prev, lowerIsBetter = false }: { cur: number | null; prev: number | null; lowerIsBetter?: boolean }) {
  if (cur === null || prev === null || prev === 0) return <span className="text-muted-foreground">—</span>;
  const change = Math.round(((cur - prev) / Math.abs(prev)) * 100);
  const good = lowerIsBetter ? change <= 0 : change >= 0;
  return (
    <span className={good ? 'text-emerald-700 dark:text-emerald-400' : 'text-destructive'}>
      {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
    </span>
  );
}

function Bar({ label, value, count, share }: { label: string; value: string; count?: string; share: number }) {
  return (
    <li className="flex items-center gap-3 text-sm">
      <span className="w-28 shrink-0 truncate">{label}</span>
      <span className="bg-muted relative h-2 flex-1 overflow-hidden rounded-full">
        <span className="bg-primary absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.max(3, Math.round(share * 100))}%` }} />
      </span>
      <span className="w-20 shrink-0 text-right font-medium">{value}</span>
      {count && <span className="text-muted-foreground w-16 shrink-0 text-right">{count}</span>}
    </li>
  );
}

function BucketCard({ title, rows, total }: { title: string; rows: Bucket[]; total: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-muted-foreground text-sm"><PreviewText>{'Geen klussen in deze periode.'}</PreviewText></p>
        ) : (
          <ul className="flex flex-col gap-2">
            {rows.map((b) => (
              <Bar key={b.label} label={b.label} value={EUR.format(b.revenue)} count={`${b.jobs}×`} share={total ? b.revenue / total : 0} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/** Studio restyle of ReportView: same data, same links and export, onto shadcn Card/Table. */
export default function StudioReportView({ d, anchor }: { d: Report; anchor: string }) {
  const span = d.span;
  const c = d.cur;
  const p = d.prev;

  const net = (t: typeof c) => t.margin - (t.adSpend ?? 0) - t.expenses;
  const href = (s: Span, a: string) => `/admin/rapport?p=${s}&d=${a}`;
  const maxTech = Math.max(1, ...d.technicians.map((t) => t.revenue));
  const prevName = { week: 'vorige week', maand: 'vorige maand', kwartaal: 'vorig kwartaal', jaar: 'vorig jaar' }[span];

  const kpis: { label: string; value: string; cur: number | null; prev: number | null; lowerIsBetter?: boolean; foot: React.ReactNode; main?: boolean }[] = [
    { label: 'Omzet', value: money(c.revenue), cur: c.revenue, prev: p.revenue, foot: <>· {prevName} {money(p.revenue)}</>, main: true },
    { label: 'Brutowinst', value: money(c.margin), cur: c.margin, prev: p.margin, foot: <>· {pct(c.margin, c.revenue)} van omzet</> },
    { label: 'Onze commissie', value: money(c.commission), cur: c.commission, prev: p.commission, foot: <PreviewText>· van monteurs</PreviewText> },
    { label: 'Klussen', value: String(c.jobs), cur: c.jobs, prev: p.jobs, foot: <PreviewText>{`· ${c.cancelled} geannuleerd`}</PreviewText> },
    { label: 'Gemiddelde klus', value: money(c.jobs ? c.revenue / c.jobs : null), cur: c.jobs ? c.revenue / c.jobs : null, prev: p.jobs ? p.revenue / p.jobs : null, foot: null },
  ];

  return (
    <div className="kfc-neutral flex flex-col gap-4 md:gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl leading-none font-medium tracking-tight"><PreviewText>Prestaties</PreviewText></h1>
          <p className="text-muted-foreground text-sm">
            <PreviewText>{`Wat het bedrijf en elke monteur deden, vergeleken met ${prevName}.`}</PreviewText>
          </p>
        </div>
        <Button variant="outline" asChild>
          <a href={`/api/admin/winst/export?van=${d.range.from}&tot=${d.range.to}`}>
            <Download data-icon="inline-start" /> Excel
          </a>
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex gap-1.5 rounded-lg border p-1" aria-label="Periode">
          {(['week', 'maand', 'kwartaal', 'jaar'] as Span[]).map((s) => (
            <Button key={s} asChild size="sm" variant={s === span ? 'default' : 'ghost'}>
              <Link href={href(s, anchor)}>{SPAN_LABEL[s]}</Link>
            </Button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild size="icon" variant="outline" aria-label="Vorige periode">
            <Link href={href(span, d.prevAnchor)}><ChevronLeft /></Link>
          </Button>
          <span className="min-w-32 text-center text-sm font-medium">{d.label}</span>
          <Button asChild size="icon" variant="outline" aria-label="Volgende periode">
            <Link href={href(span, d.nextAnchor)}><ChevronRight /></Link>
          </Button>
          {!d.isCurrent && (
            <Button asChild size="sm" variant="outline">
              <Link href={href(span, isoDate(new Date()))}><PreviewText>Naar nu</PreviewText></Link>
            </Button>
          )}
        </div>
      </div>

      {/* ── the business ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map((k) => (
          <Card key={k.label} className={k.main ? 'border-primary/40' : undefined}>
            <CardContent className="flex flex-col gap-1 pt-6">
              <span className="text-muted-foreground text-sm"><PreviewText>{k.label}</PreviewText></span>
              <span className="text-2xl font-semibold">{k.value}</span>
              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                <Delta cur={k.cur} prev={k.prev} lowerIsBetter={k.lowerIsBetter} /> {k.foot}
              </span>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardContent className="flex flex-col gap-1 pt-6">
            <span className="text-muted-foreground text-sm">Leads</span>
            <span className="text-2xl font-semibold">{c.leads}</span>
            <span className="text-muted-foreground flex items-center gap-1 text-xs">
              <Delta cur={c.leads} prev={p.leads} /> · {pct(c.sold, c.leads)} <PreviewText>verkocht</PreviewText>
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 pt-6">
            <span className="text-muted-foreground text-sm"><PreviewText>Advertenties</PreviewText></span>
            <span className="text-2xl font-semibold">{c.adSpend === null ? <PreviewText>Niet gekoppeld</PreviewText> : money(c.adSpend)}</span>
            <span className="text-muted-foreground flex items-center gap-1 text-xs">
              {c.adSpend === null ? (
                <PreviewText>kosten nog niet gesynchroniseerd</PreviewText>
              ) : (
                <>
                  <Delta cur={c.adSpend} prev={p.adSpend} lowerIsBetter /> · {c.jobs && c.adSpend ? `${money(c.adSpend / c.jobs)} per klus` : '—'}
                </>
              )}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 pt-6">
            <span className="text-muted-foreground text-sm"><PreviewText>Uitgaven</PreviewText></span>
            <span className="text-2xl font-semibold">{money(c.expenses)}</span>
            <span className="text-muted-foreground flex items-center gap-1 text-xs">
              <Delta cur={c.expenses} prev={p.expenses} lowerIsBetter /> · <PreviewText>bonnetjes</PreviewText>
            </span>
          </CardContent>
        </Card>
        <Card className="border-primary/40">
          <CardContent className="flex flex-col gap-1 pt-6">
            <span className="text-muted-foreground text-sm"><PreviewText>Netto over</PreviewText></span>
            <span className="text-2xl font-semibold">{money(net(c))}</span>
            <span className="text-muted-foreground flex items-center gap-1 text-xs">
              <Delta cur={net(c)} prev={net(p)} /> · <PreviewText>winst − advertenties − uitgaven</PreviewText>
            </span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <PreviewText>{`Verloop · ${span === 'jaar' ? 'per maand' : span === 'kwartaal' ? 'per week' : 'per dag'}`}</PreviewText>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SalesChart data={d.series} barLabel="Omzet" lineLabel="Brutowinst" countLabel="klussen" />
        </CardContent>
      </Card>

      {/* ── every technician ── */}
      <Card>
        <CardHeader>
          <CardTitle><PreviewText>Per monteur</PreviewText></CardTitle>
        </CardHeader>
        <CardContent className={d.technicians.length ? 'overflow-x-auto' : undefined}>
          {d.technicians.length === 0 ? (
            <p className="text-muted-foreground text-sm"><PreviewText>Geen monteurs met klussen in deze periode.</PreviewText></p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><PreviewText>Monteur</PreviewText></TableHead>
                  <TableHead className="text-right"><PreviewText>Klussen</PreviewText></TableHead>
                  <TableHead className="text-right"><PreviewText>Omzet</PreviewText></TableHead>
                  <TableHead className="text-right"><PreviewText>{`vs ${prevName}`}</PreviewText></TableHead>
                  <TableHead className="text-right"><PreviewText>Brutowinst</PreviewText></TableHead>
                  <TableHead className="text-right"><PreviewText>Onze commissie</PreviewText></TableHead>
                  <TableHead className="text-right"><PreviewText>Monteur verdiende</PreviewText></TableHead>
                  <TableHead className="text-right"><PreviewText>Gem. klus</PreviewText></TableHead>
                  <TableHead className="text-right"><PreviewText>Aanbod geaccepteerd</PreviewText></TableHead>
                  <TableHead className="text-right"><PreviewText>Geannuleerd</PreviewText></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {d.technicians.map((t) => (
                  <TableRow key={t.id} className="relative">
                    <TableCell>
                      <Link href={`/admin/monteurs/${t.id}`} className="flex items-center gap-2 after:absolute after:inset-0">
                        <span className="size-2.5 shrink-0 rounded-full" style={{ background: technicianColour(t.color) }} />
                        <span className="flex flex-col gap-1">
                          <b className="font-medium">{t.name}</b>
                          <span className="bg-muted relative h-1 w-20 overflow-hidden rounded-full">
                            <span
                              className="absolute inset-y-0 left-0 rounded-full"
                              style={{ width: `${Math.round((t.revenue / maxTech) * 100)}%`, background: technicianColour(t.color) }}
                            />
                          </span>
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">{t.jobs}</TableCell>
                    <TableCell className="text-right font-semibold">{EUR.format(t.revenue)}</TableCell>
                    <TableCell className="text-right"><Delta cur={t.revenue} prev={t.prevRevenue} /></TableCell>
                    <TableCell className="text-right">{EUR.format(t.margin)}</TableCell>
                    <TableCell className="text-right">{EUR.format(t.commission)}</TableCell>
                    <TableCell className="text-right">{EUR.format(t.earned)}</TableCell>
                    <TableCell className="text-right">{t.jobs ? EUR.format(t.revenue / t.jobs) : '—'}</TableCell>
                    <TableCell className="text-right">{t.offered ? `${t.accepted}/${t.offered} · ${pct(t.accepted, t.offered)}` : '—'}</TableCell>
                    <TableCell className={`text-right ${t.cancelled ? 'text-amber-700 dark:text-amber-400' : ''}`}>{t.cancelled || '—'}</TableCell>
                  </TableRow>
                ))}
                {d.unassigned.jobs > 0 && (
                  <TableRow>
                    <TableCell className="text-muted-foreground"><PreviewText>Zonder monteur</PreviewText></TableCell>
                    <TableCell className="text-right">{d.unassigned.jobs}</TableCell>
                    <TableCell className="text-right">{EUR.format(d.unassigned.revenue)}</TableCell>
                    <TableCell colSpan={7} />
                  </TableRow>
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell><PreviewText>Totaal</PreviewText></TableCell>
                  <TableCell className="text-right">{c.jobs}</TableCell>
                  <TableCell className="text-right">{EUR.format(c.revenue)}</TableCell>
                  <TableCell className="text-right"><Delta cur={c.revenue} prev={p.revenue} /></TableCell>
                  <TableCell className="text-right">{EUR.format(c.margin)}</TableCell>
                  <TableCell className="text-right">{EUR.format(c.commission)}</TableCell>
                  <TableCell className="text-right">{EUR.format(c.revenue - c.commission)}</TableCell>
                  <TableCell className="text-right">{c.jobs ? EUR.format(c.revenue / c.jobs) : '—'}</TableCell>
                  <TableCell />
                  <TableCell className="text-right">{c.cancelled || '—'}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── where it came from ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <BucketCard title="Per dienst" rows={d.byService} total={c.revenue} />
        <BucketCard title="Per automerk" rows={d.byMake} total={c.revenue} />
        <BucketCard title="Per plaats" rows={d.byCity} total={c.revenue} />
        <Card>
          <CardHeader>
            <CardTitle><PreviewText>Leads per bron</PreviewText></CardTitle>
          </CardHeader>
          <CardContent>
            {d.bySource.length === 0 ? (
              <p className="text-muted-foreground text-sm"><PreviewText>Geen leads in deze periode.</PreviewText></p>
            ) : (
              <ul className="flex flex-col gap-2">
                {d.bySource.map((s) => (
                  <Bar key={s.label} label={s.label} value={String(s.leads)} count={pct(s.sold, s.leads)} share={s.leads / Math.max(1, c.leads)} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="text-muted-foreground text-sm">
        <PreviewText>
          Omzet = wat de klant betaalde op afgeronde klussen, geteld op de dag van afronden. Brutowinst = na materiaal, reis,
          betaalkosten en monteur. Commissie = wat Autosleutel24 inhoudt (afgesproken percentage, anders 25%).
        </PreviewText>
      </p>
    </div>
  );
}
