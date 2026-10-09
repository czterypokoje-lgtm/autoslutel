import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PageHead, StatGrid, Stat, Card, CardHead, Table, Badge, Notice, Empty, HelpSteps, ui } from '../_ui';
import { ShieldAlert, MousePointerClick, EyeOff, Ban } from 'lucide-react';
import { judgeAll, type AdVisit, type Judgement } from '@/lib/clickFraud';
import CopyBoxes from './CopyBoxes';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Klikfraude | Autosleutel24',
};

/** Default window. Google's own invalid-click credits are handled monthly. */
const DEFAULT_DAYS = 30;
const MAX_ROWS = 5000;

const DATE = new Intl.DateTimeFormat('nl-NL', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Amsterdam',
});

/**
 * Request-scoped clock read, kept out of the component body for the same
 * reason as in /admin/leads: React's purity rule treats `Date.now()` during
 * render as unstable, and it is right to. This is an async Server Component
 * that runs once per request, so "now" is a fixed input to that request.
 */
function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

const tone = (tier: Judgement['tier']) =>
  tier === 'fraude' ? 'stop' : tier === 'verdacht' ? 'warn' : 'ok';

/**
 * What our ad budget was actually spent on.
 *
 * READ THIS BEFORE USING THE LIST. A click is charged in Google's auction
 * before any request reaches this site, so nothing here prevented anything.
 * Two things change the money, and both are lists of addresses with dates:
 * an IP exclusion stops the next click, and an invalid-click credit claim
 * refunds the last ones. This screen produces exactly those two lists.
 *
 * The verdict is computed here, on every load, and is not stored — so moving
 * a threshold in src/lib/clickFraud.ts re-judges the whole history instead of
 * leaving last month frozen at last month's opinion.
 */
export default async function KlikfraudePage({
  searchParams,
}: {
  searchParams: Promise<{ dagen?: string }>;
}) {
  await requireOfficeUser('/admin/klikfraude');
  const supabase = await createSupabaseServerClient();
  const params = await searchParams;

  const requested = Number(params.dagen);
  const days = Number.isFinite(requested) && requested >= 1 && requested <= 90
    ? Math.round(requested)
    : DEFAULT_DAYS;

  const since = isoDaysAgo(days);

  /*
   * Migrations here are applied by hand in the Supabase editor, so this
   * screen has to survive being deployed before 0073 has been run — asking
   * PostgREST for a missing table fails the whole query, and an unexplained
   * crash on a new screen reads as "the fraud tool is broken" rather than
   * "one SQL file still needs running".
   */
  const { data, error } = await supabase
    .from('ad_visits')
    .select('*')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(MAX_ROWS);

  if (error) {
    return (
      <>
        <PageHead title="Klikfraude" sub="Bewijs tegen frauduleuze advertentieklikken" />
        <Notice tone="bad">
          De tabel <code>ad_visits</code> is er nog niet. Voer{' '}
          <code>supabase/migrations/0073_ad_visits_click_fraud.sql</code> uit in de SQL-editor
          van Supabase; daarna vult dit scherm zichzelf vanaf de eerstvolgende advertentieklik.
          {' '}({error.message})
        </Notice>
      </>
    );
  }

  const visits = (data ?? []) as AdVisit[];
  const judgements = judgeAll(visits);

  const fraud = judgements.filter((j) => j.tier === 'fraude');
  const suspect = judgements.filter((j) => j.tier === 'verdacht');
  const silent = visits.filter((v) => !v.js_ran).length;

  /* Only the convicted tier may be excluded. A `verdacht` address in this box
     would mean a person pasting a guess into a live campaign. */
  const exclusions = fraud.map((j) => j.ip).join('\n');

  /*
   * One line per landing, newest first, for the addresses that are actually
   * in question. Semicolons because this is opened in a Dutch Excel.
   */
  const evidenceRows = visits.filter((v) =>
    [...fraud, ...suspect].some((j) => j.ip === v.ip)
  );
  const evidence = [
    'datum;ip;land;gclid;campagne;js;oordeel',
    ...evidenceRows.map((v) => {
      const judgement = judgements.find((j) => j.ip === v.ip);
      const clickId = v.gclid ?? v.wbraid ?? v.gbraid ?? v.msclkid ?? '';
      return [
        DATE.format(new Date(v.created_at)),
        v.ip ?? '',
        v.country ?? '',
        clickId,
        v.campaign_id ?? '',
        v.js_ran ? 'ja' : 'nee',
        judgement?.tier ?? '',
      ].join(';');
    }),
  ].join('\n');

  return (
    <>
      <PageHead
        title="Klikfraude"
        sub={`Betaalde advertentieklikken van de afgelopen ${days} dagen, beoordeeld per IP-adres`}
      />

      <Notice tone="info">
        Een klik wordt afgerekend in de veiling van Google, voordat deze site wordt opgevraagd.
        Dit scherm houdt dus niets tegen — het levert de twee dingen die wél geld schelen: een
        lijst IP-adressen om uit te sluiten (stopt de volgende klik) en onderbouwing voor een
        claim op ongeldige klikken (geeft de vorige terug).
      </Notice>

      <StatGrid>
        <Stat
          label="Betaalde klikken"
          value={visits.length}
          foot={`${judgements.length} verschillende adressen`}
          icon={<MousePointerClick size={15} />}
        />
        <Stat
          label="Zonder JavaScript"
          value={silent}
          foot="pagina opgehaald, browser nooit gezien"
          icon={<EyeOff size={15} />}
          tone={silent ? 'warn' : 'ok'}
        />
        <Stat
          label="Uit te sluiten"
          value={fraud.length}
          foot="adressen met het oordeel fraude"
          icon={<Ban size={15} />}
          tone={fraud.length ? 'stop' : 'ok'}
        />
        <Stat
          label="Verdacht"
          value={suspect.length}
          foot="nog niet genoeg om uit te sluiten"
          icon={<ShieldAlert size={15} />}
          tone={suspect.length ? 'warn' : 'ok'}
        />
      </StatGrid>

      <HelpSteps
        steps={[
          'Kijk eerst in Google Ads bij de kolom «Ongeldige klikken». Wat daar staat, heeft Google zelf al gecrediteerd — dat opnieuw claimen kost alleen een ticket.',
          'Neem de IP-uitsluitingen hieronder over in de zoekcampagne: Instellingen → Aanvullende instellingen → IP-uitsluitingen. Maximaal 500 reeksen. Performance Max kent geen IP-uitsluitingen.',
          'Stuur het bewijsblok mee met een verzoek om creditering, met de gclid erin: zonder die code neemt support de claim niet in behandeling.',
          'Sluit nooit een adres uit dat hier «verdacht» is. Een bot die wegkomt kost één klik; een klant die je uitsluit kost elke klik die hij nog zou doen, en dat ziet niemand.',
        ]}
      />

      <CopyBoxes exclusions={exclusions} evidence={evidence} />

      <Card>
        <CardHead>Beoordeling per adres</CardHead>
        {judgements.length === 0 ? (
          <Empty>
            Nog geen betaalde klikken vastgelegd in deze periode. Dit scherm vult zichzelf zodra
            er iemand via een advertentie binnenkomt.
          </Empty>
        ) : (
          <Table
            head={
              <>
                <th>Oordeel</th>
                <th>IP</th>
                <th>Land</th>
                <th>Klikken</th>
                <th>Stil</th>
                <th>Laatste</th>
                <th>Waarom</th>
              </>
            }
          >
            {judgements.map((j) => (
              <tr key={j.ip}>
                <td>
                  <Badge tone={tone(j.tier)}>{j.tier}</Badge>
                </td>
                <td>
                  <code>{j.ip}</code>
                </td>
                <td>{j.country ?? '—'}</td>
                <td>{j.visits}</td>
                <td>{j.silent}</td>
                <td>{DATE.format(new Date(j.lastSeen))}</td>
                <td className={ui.sub}>
                  {j.reasons.length ? j.reasons.join('; ') : 'niets bijzonders gezien'}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
