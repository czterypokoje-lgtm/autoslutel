import { PreviewText } from '../PreviewLanguage';
import { requireOfficeUser } from '@/lib/crmSession';
import { BRAND, STUDIO_UI } from '@/config/install';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PageHead, StatGrid, Stat, Notice } from '../_ui';
import { MousePointerClick, Link2, Euro, CircleHelp } from 'lucide-react';
import { readClickOrigin } from '@/lib/adClickId';
import { isoDate } from '@/lib/crmJobs';
import MatchPanel, { type ClickRow, type JobRow } from './MatchPanel';
import CampaignNames, { type CampaignSeen } from './CampaignNames';
import StudioMatchPanel from './StudioMatchPanel';
import StudioCampaignNames from './StudioCampaignNames';
import { Card as SCard, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: `Advertentieklikken koppelen | ${BRAND.name}`,
};

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

/**
 * One day's ad clicks beside that day's jobs, so a person can say which call
 * came from which click.
 *
 * The automatic claim in api/admin/jobs only looks 45 minutes back from the
 * moment a job is typed in, and the office types jobs in hours or days after
 * the phone rang. Across every click ever captured it has fired exactly once,
 * while 49 real Google click ids sat unclaimed and the completed work that
 * came from them reached Google as nothing at all.
 *
 * Widening the window does not fix it: across three days "the nearest
 * unclaimed click" is a coin toss between a dozen candidates, and a wrong
 * gclid uploaded to Google teaches Smart Bidding to buy the wrong traffic.
 * So the machine lays out what it knows — the minute, the campaign, the page
 * they were reading, the code they may have quoted — and a person decides.
 */
export default async function AttributiePage({
  searchParams,
}: {
  searchParams: Promise<{ datum?: string }>;
}) {
  await requireOfficeUser('/admin/attributie');
  const supabase = await createSupabaseServerClient();
  const params = await searchParams;

  const today = isoDate(new Date());
  const date = /^\d{4}-\d{2}-\d{2}$/.test(params.datum ?? '') ? params.datum! : today;

  /*
   * A day in Amsterdam, not in UTC. call_clicks.created_at is a timestamptz,
   * so slicing the string would put every evening click after 22:00 CEST on
   * the following day — which is exactly the part of the evening this
   * business gets called.
   */
  const nextDay = isoDate(new Date(new Date(`${date}T12:00:00`).getTime() + 864e5));

  const dayStart = new Date(`${date}T00:00:00`);
  const dayEnd = new Date(`${date}T23:59:59.999`);

  /*
   * campaign_id and keyword arrive with 0059, and migrations here are applied
   * by hand in the Supabase editor. Asking for a column that does not exist
   * fails the whole query in PostgREST, which would turn this screen — the one
   * the office is using right now — into an error message because of a
   * migration nobody has run yet. So it asks, and falls back to reading both
   * out of the landing URL, which is where they came from anyway.
   */
  const CLICK_COLUMNS = 'id, created_at, gclid, wbraid, gbraid, msclkid, source_url, ref, claimed_by_job_id';
  const clicksFor = (columns: string) =>
    supabase
      .from('call_clicks')
      .select(columns)
      .gte('created_at', dayStart.toISOString())
      .lte('created_at', dayEnd.toISOString())
      .order('created_at', { ascending: false });

  const [clickAttempt, jobResult] = await Promise.all([
    clicksFor(`${CLICK_COLUMNS}, campaign_id, keyword`),
    /*
     * This day's jobs and the next day's.
     *
     * Matching only on the click's own date loses the most common case there
     * is: somebody clicks at nine in the evening, rings, and the van goes out
     * the following morning. On the day this screen was built, 3 October had
     * twenty unclaimed clicks and not one job scheduled — every one of them
     * would have been unmatchable.
     */
    supabase
      .from('jobs')
      .select(
        'id, created_at, scheduled_date, slot_start, status, customer_name, customer_phone, city, car_make, car_model, final_price, quoted_price, gclid, wbraid, gbraid, msclkid, lead_id'
      )
      .gte('scheduled_date', date)
      .lte('scheduled_date', nextDay)
      .order('scheduled_date', { ascending: true })
      .order('slot_start', { ascending: true }),
  ]);

  const clickResult = clickAttempt.error && /campaign_id|keyword/.test(clickAttempt.error.message)
    ? await clicksFor(CLICK_COLUMNS)
    : clickAttempt;

  if (clickResult.error) {
    if (STUDIO_UI) {
      return (
        <div className="kfc-neutral flex flex-col gap-4 md:gap-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl leading-none font-medium tracking-tight"><PreviewText>Advertentieklikken</PreviewText></h1>
            <p className="text-muted-foreground text-sm"><PreviewText>Koppel een telefoonklus aan de klik die hem veroorzaakte.</PreviewText></p>
          </div>
          <p className="text-destructive text-sm"><PreviewText>{`Klikken laden mislukte: ${clickResult.error.message}`}</PreviewText></p>
        </div>
      );
    }
    return (
      <>
        <PageHead title="Advertentieklikken" sub="Koppel een telefoonklus aan de klik die hem veroorzaakte." />
        <Notice tone="bad">Klikken laden mislukte: {clickResult.error.message}</Notice>
      </>
    );
  }

  type RawClick = {
    id: string; created_at: string; source_url: string | null; ref: string | null;
    gclid: string | null; wbraid: string | null; gbraid: string | null; msclkid: string | null;
    claimed_by_job_id: string | null; campaign_id?: string | null; keyword?: string | null;
  };

  const clicks: ClickRow[] = ((clickResult.data ?? []) as unknown as RawClick[]).map((click) => {
    const origin = readClickOrigin(click.source_url);
    return {
      id: click.id,
      at: click.created_at,
      network: click.msclkid && !click.gclid ? 'Microsoft' : 'Google',
      /* The stored column once 0059 is in and the template is set; the
         landing URL for every click captured before that. */
      campaignId: click.campaign_id ?? origin.campaignId,
      keyword: click.keyword ?? origin.keyword,
      page: origin.page,
      ref: click.ref,
      claimed: Boolean(click.claimed_by_job_id),
      /* The click id itself is never shown in full: 90 characters of base64
         is noise to a human and the office never needs to read it. */
      hasClickId: Boolean(click.gclid || click.wbraid || click.gbraid || click.msclkid),
    };
  });

  const jobs: JobRow[] = (jobResult.data ?? []).map((job) => ({
    id: job.id,
    createdAt: job.created_at,
    scheduledDate: job.scheduled_date,
    slotStart: job.slot_start,
    status: job.status,
    customer: job.customer_name,
    phone: job.customer_phone,
    city: job.city,
    car: [job.car_make, job.car_model].filter(Boolean).join(' ') || null,
    value: Number(job.final_price ?? job.quoted_price ?? 0) || null,
    /* A job that came in through the website already knows its own origin
       via its lead, so offering to overwrite it would only invite a mistake. */
    attributed: Boolean(job.gclid || job.wbraid || job.gbraid || job.msclkid || job.lead_id),
  }));

  /*
   * Names, and the roster to name. Both read across ALL time, not just the day
   * on screen: a campaign is named once and the list would otherwise change
   * shape every time the date moved, which is a strange thing for a settings
   * list to do.
   */
  const [nameResult, allClicksResult] = await Promise.all([
    supabase.from('ad_campaigns').select('campaign_id, name'),
    supabase.from('call_clicks').select('source_url, campaign_id'),
  ]);

  const names = new Map<string, string>(
    (nameResult.data ?? []).map((row) => [row.campaign_id as string, row.name as string])
  );

  const seen = new Map<string, { clicks: number; pages: Map<string, number> }>();
  for (const row of (allClicksResult.data ?? []) as { source_url: string | null; campaign_id?: string | null }[]) {
    const origin = readClickOrigin(row.source_url);
    const id = row.campaign_id ?? origin.campaignId;
    if (!id) continue;
    const entry = seen.get(id) ?? { clicks: 0, pages: new Map<string, number>() };
    entry.clicks += 1;
    if (origin.page) entry.pages.set(origin.page, (entry.pages.get(origin.page) ?? 0) + 1);
    seen.set(id, entry);
  }

  const campaigns: CampaignSeen[] = [...seen.entries()]
    .map(([id, entry]) => ({
      id,
      name: names.get(id) ?? null,
      clicks: entry.clicks,
      topPage: [...entry.pages.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
    }))
    .sort((a, b) => b.clicks - a.clicks);

  /* The number stays visible beside the name: the office reads this screen
     next to the Ads tab, where the number is what they can search on. */
  for (const click of clicks) {
    if (click.campaignId) click.campaignName = names.get(click.campaignId) ?? null;
  }

  const open = clicks.filter((c) => !c.claimed && c.hasClickId);
  const unattributed = jobs.filter((j) => !j.attributed && j.scheduledDate === date);
  const value = unattributed.reduce((total, job) => total + (job.value ?? 0), 0);

  if (STUDIO_UI) {
    const kpis = [
      { label: 'Klikken deze dag', value: String(clicks.length), icon: MousePointerClick, foot: <>{open.length} <PreviewText>nog vrij</PreviewText></> },
      { label: 'Al gekoppeld', value: String(clicks.filter((c) => c.claimed).length), icon: Link2, foot: null },
      {
        label: 'Klussen zonder bron',
        value: String(unattributed.length),
        icon: CircleHelp,
        foot: <>{jobs.filter((j) => j.scheduledDate === date).length} <PreviewText>deze dag</PreviewText></>,
        warn: unattributed.length > 0,
      },
      { label: 'Omzet zonder bron', value: MONEY.format(value), icon: Euro, foot: <PreviewText>telt nu als organisch</PreviewText>, warn: value > 0 },
    ];

    return (
      <div className="kfc-neutral flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl leading-none font-medium tracking-tight"><PreviewText>Advertentieklikken koppelen</PreviewText></h1>
          <p className="text-muted-foreground text-sm">
            <PreviewText>Welke klik hoorde bij welke klus. U weet het van de telefoon; de database niet.</PreviewText>
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((k) => (
            <SCard key={k.label} className={k.warn ? 'border-amber-300 dark:border-amber-500/40' : undefined}>
              <CardContent className="flex flex-col gap-1 pt-6">
                <span className="text-muted-foreground flex items-center gap-1.5 text-sm"><k.icon className="size-4" /><PreviewText>{k.label}</PreviewText></span>
                <span className="text-2xl font-semibold">{k.value}</span>
                {k.foot && <span className="text-muted-foreground text-xs">{k.foot}</span>}
              </CardContent>
            </SCard>
          ))}
        </div>

        <StudioCampaignNames campaigns={campaigns} />

        <StudioMatchPanel date={date} today={today} clicks={clicks} jobs={jobs} />
      </div>
    );
  }

  return (
    <>
      <PageHead
        title="Advertentieklikken koppelen"
        sub="Welke klik hoorde bij welke klus. U weet het van de telefoon; de database niet."
      />

      <StatGrid>
        <Stat
          label="Klikken deze dag"
          value={clicks.length}
          foot={<>{open.length} <PreviewText>nog vrij</PreviewText></>}
          icon={<MousePointerClick size={18} />}
        />
        <Stat
          label="Al gekoppeld"
          value={clicks.filter((c) => c.claimed).length}
          icon={<Link2 size={18} />}
          tone="ok"
        />
        <Stat
          label="Klussen zonder bron"
          value={unattributed.length}
          foot={<>{jobs.filter((j) => j.scheduledDate === date).length} <PreviewText>deze dag</PreviewText></>}
          icon={<CircleHelp size={18} />}
          tone={unattributed.length ? 'warn' : 'ok'}
        />
        <Stat
          label="Omzet zonder bron"
          value={MONEY.format(value)}
          foot="telt nu als organisch"
          icon={<Euro size={18} />}
          tone={value > 0 ? 'warn' : 'ok'}
        />
      </StatGrid>

      <CampaignNames campaigns={campaigns} />

      <MatchPanel date={date} today={today} clicks={clicks} jobs={jobs} />
    </>
  );
}
