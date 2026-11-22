import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { BRAND } from '@/config/install';
import { loadConversionData, forBrowser } from '@/lib/conversionData';
import { buildConfirmedFeed, matchStats, type FeedRow } from '@/lib/conversionMatcher';
import { formatAmsterdam } from '@/lib/adsConversionsFeed';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import ConversionReview from './ConversionReview';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: `Conversies naar Google | ${BRAND.name}`,
};

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const pct = (part: number, whole: number) => (whole ? `${Math.round((part / whole) * 100)}%` : '–');

/**
 * Sales beside the ad clicks that may have caused them. The machine proposes,
 * a person confirms, and only confirmed rows go to Google Ads (daily file
 * /api/ads/conversions.csv, value excl. BTW). Office only.
 */
export default async function ConversiesPage() {
  await requireOfficeUser('/admin/conversies');
  const supabase = await createSupabaseServerClient();
  const now = new Date();
  const data = await loadConversionData(supabase, now);
  const stats = matchStats(data.reviews);

  const confirmedRows = data.decisions.filter((d) => d.decision === 'bevestigd');
  const feed = buildConfirmedFeed(confirmedRows as unknown as FeedRow[], now);
  const inFeed = new Set(feed.ids);
  const saleTitle = new Map(data.reviews.map((r) => [`${r.sale.source}:${r.sale.id}`, r.sale.title] as const));

  const kpis = [
    { label: 'Verkopen laatste 90 dagen', value: String(stats.inWindow), foot: `${stats.byKind.job.inWindow} klussen · ${stats.byKind.whatsapp_quote.inWindow} WhatsApp · ${stats.byKind.whatsapp_review.inWindow} WA-code` },
    { label: 'Vóór: automatisch naar Google', value: `${stats.beforeAuto} (${pct(stats.beforeAuto, stats.inWindow)})`, foot: 'wat het oude bestand zonder controle stuurde' },
    { label: 'Nu: met een spoor naar een klik', value: `${stats.withEvidence} (${pct(stats.withEvidence, stats.inWindow)})`, foot: `${stats.withStrongEvidence} met hard of sterk bewijs` },
    { label: 'Bevestigd', value: `${stats.confirmed} (${pct(stats.confirmed, stats.inWindow)})`, foot: `${MONEY.format(stats.confirmedIncl)} incl. btw · ${MONEY.format(stats.confirmedExcl)} excl. btw` },
  ];

  return (
    <div className="kfc-neutral flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl leading-none font-medium tracking-tight">Conversies naar Google</h1>
        <p className="text-muted-foreground text-sm">
          Welke verkoop kwam van welke advertentieklik. Het systeem stelt voor, u bevestigt. Alleen bevestigde verkopen gaan naar
          Google Ads, met het bedrag <strong>excl. btw</strong>.
        </p>
      </div>

      {data.warnings.length > 0 && (
        <Card className="border-amber-300 dark:border-amber-500/40">
          <CardContent className="flex flex-col gap-1 pt-6 text-sm">
            {data.warnings.map((w) => (
              <p key={w}>{w}</p>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="flex flex-col gap-1 pt-6">
              <span className="text-muted-foreground text-sm">{k.label}</span>
              <span className="text-2xl font-semibold">{k.value}</span>
              <span className="text-muted-foreground text-xs">{k.foot}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <ConversionReview reviews={forBrowser(data.reviews)} />

      <Card>
        <CardHeader>
          <CardTitle>Proefbestand: dit haalt Google bij de volgende ophaalronde</CardTitle>
          <CardDescription>
            {feed.counts.rows} regels · conversienaam &quot;Job Completed&quot; · tijd Europe/Amsterdam · waarde excl. btw in EUR.
            {feed.counts.skipped_too_old > 0 && ` ${feed.counts.skipped_too_old} bevestigd maar klik ouder dan 90 dagen (Google weigert die).`}
            {data.reviewsExportedByHand > 0 && ` ${data.reviewsExportedByHand} WhatsApp-beoordelingen zijn eerder met de hand geüpload en staan hier niet in.`}{' '}
            <a className="underline" href="/api/admin/conversies/export">Download proefbestand (CSV)</a>
          </CardDescription>
        </CardHeader>
        <CardContent className={confirmedRows.length ? 'overflow-x-auto' : undefined}>
          {confirmedRows.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nog niets bevestigd: het bestand bevat alleen de twee kopregels.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Verkoop</TableHead>
                  <TableHead>Conversietijd</TableHead>
                  <TableHead>Klik</TableHead>
                  <TableHead className="text-right">Incl. btw</TableHead>
                  <TableHead className="text-right">Excl. btw (naar Google)</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {confirmedRows.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>{saleTitle.get(`${d.source}:${d.source_id}`) ?? d.source}</TableCell>
                    <TableCell>{formatAmsterdam(d.conversion_at) ?? '–'}</TableCell>
                    <TableCell className="font-mono text-xs">{d.click_kind} …{d.click_id.slice(-8)}</TableCell>
                    <TableCell className="text-right">{MONEY.format(Number(d.value_incl_btw) || 0)}{d.vat_assumed ? ' *' : ''}</TableCell>
                    <TableCell className="text-right">{MONEY.format(Number(d.value_excl_btw) || 0)}</TableCell>
                    <TableCell>
                      {!inFeed.has(d.id)
                        ? 'Niet in bestand (klik te oud)'
                        : d.uploaded_at
                          ? `Opgehaald ${formatAmsterdam(d.uploaded_at)?.slice(0, 10)}`
                          : 'Wacht op Google'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {confirmedRows.some((d) => d.vat_assumed) && (
            <p className="text-muted-foreground mt-2 text-xs">* Btw-basis niet genoemd in het gesprek; incl. btw aangenomen.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
