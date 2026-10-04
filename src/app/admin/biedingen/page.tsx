import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PageHead, Card, CardHead, Empty, Notice } from '../_ui';
import { SCENARIO_INFO, type Scenario } from '@/lib/scenarios';
import AwardPanel, { type BidRow } from './AwardPanel';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Biedingen | Autosleutel24' };

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

/**
 * What the monteurs are asking for the open work.
 *
 * The bids arrive over Telegram — a price and a two-hour window, typed on a
 * phone between jobs. This is where one of them becomes the job: awarding
 * writes the bid's price and slot onto the klus, puts it on that monteur's
 * name, and closes every other bid on it in the same statement.
 *
 * Grouped by job rather than listed flat, because the only question worth
 * asking here is "of these three, which one" — and that is unanswerable in a
 * list sorted by time.
 */
export default async function BiedingenPage() {
  await requireOfficeUser('/admin/biedingen');
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('job_offers')
    .select(
      'id, job_id, bid_price, bid_date, bid_start, bid_end, bid_at, offered_at, expires_at, technicians (id, name), jobs (city, postcode, car_make, car_model, scenario, service_type, quoted_price, status)'
    )
    .is('response', null)
    .not('bid_price', 'is', null)
    .order('bid_at', { ascending: true });

  if (error) {
    return (
      <>
        <PageHead title="Biedingen" sub="Wat de monteurs vragen voor het open werk." />
        <Notice tone="bad">
          Biedingen laden mislukte: {error.message}
          {/bid_price|column/.test(error.message) && (
            <> — voer <code>supabase/migrations/0066_offer_bids.sql</code> uit.</>
          )}
        </Notice>
      </>
    );
  }

  type Row = {
    id: string; job_id: string; bid_price: number | null; bid_date: string | null;
    bid_start: string | null; bid_end: string | null; bid_at: string | null;
    technicians: { id: string; name: string } | null;
    jobs: { city: string | null; postcode: string | null; car_make: string | null; car_model: string | null;
            scenario: string | null; service_type: string | null; quoted_price: number | null; status: string } | null;
  };

  const rows = (data ?? []) as unknown as Row[];

  /* One card per job, bids inside it — cheapest bid is not automatically the
     best one, so they are shown in the order they arrived and the office
     reads them. */
  const byJob = new Map<string, { label: string; askedFor: number | null; bids: BidRow[] }>();
  for (const row of rows) {
    const job = row.jobs;
    const what = job?.scenario
      ? (SCENARIO_INFO[job.scenario as Scenario]?.label ?? job.scenario)
      : (job?.service_type ?? 'Klus');
    const label = [what, [job?.car_make, job?.car_model].filter(Boolean).join(' '), job?.city ?? job?.postcode]
      .filter(Boolean)
      .join(' · ');

    const entry = byJob.get(row.job_id) ?? { label, askedFor: job?.quoted_price ?? null, bids: [] };
    entry.bids.push({
      id: row.id,
      technician: row.technicians?.name ?? 'Onbekend',
      price: row.bid_price,
      date: row.bid_date,
      start: row.bid_start,
      end: row.bid_end,
    });
    byJob.set(row.job_id, entry);
  }

  return (
    <>
      <PageHead
        title="Biedingen"
        sub="Monteurs noemen hun prijs en hun moment via Telegram. U gunt de klus."
      />

      {!byJob.size ? (
        <Empty>
          Nog geen biedingen. Een monteur krijgt een aanbod in Telegram, kiest een dag en een
          tijd, en stuurt zijn bedrag — dat komt hier binnen.
        </Empty>
      ) : (
        [...byJob.entries()].map(([jobId, job]) => (
          <Card key={jobId}>
            <CardHead>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', gap: 12 }}>
                <span>{job.label}</span>
                <span style={{ fontSize: 12, color: 'var(--crm-muted)' }}>
                  {job.askedFor ? `richtprijs ${MONEY.format(Number(job.askedFor))} · ` : ''}
                  {job.bids.length} bod{job.bids.length === 1 ? '' : 'en'}
                </span>
              </div>
            </CardHead>
            <AwardPanel bids={job.bids} />
          </Card>
        ))
      )}

      <Notice>
        Gunnen zet de klus op naam van die monteur, neemt zijn prijs en tijdvak over, en sluit de
        andere biedingen. Iedereen die bood krijgt meteen bericht — ook wie hem niet kreeg, want
        anders houdt die zijn dag vrij voor werk dat niet komt.
      </Notice>
    </>
  );
}
