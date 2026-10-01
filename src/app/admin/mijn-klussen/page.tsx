import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PageHead, Card, Empty } from '../_ui';
import { slotLabel } from '@/lib/crmJobs';
import { getBrandLogo } from '@/lib/brandLogos';
import { SCENARIO_INFO, type Scenario } from '@/lib/scenarios';
import JobHistoryList, { type HistoryRow, type ToolOption } from './JobHistoryList';
import styles from './klussen.module.css';

export const dynamic = 'force-dynamic';

/**
 * The technician's own record of how a job actually went.
 *
 * "Mijn agenda" is the next week; this is everything before it. Nobody else
 * benefits from what tool or adapter unlocked a stubborn Toyota — but the
 * same monteur meeting the same model again in six months does, and today
 * that fact lives only in their memory or dies with the job. Writing it here
 * is what makes it findable by car make and model instead.
 *
 * Read is unrestricted by date (0022); a job stays editable for 30 days after
 * it happened, which is when a note actually gets added — not a year later.
 */
/**
 * A readable service name. Older jobs stored the raw scenario key
 * ("alle_sleutels_kwijt", "bijmaken") as their service — those get the label.
 */
function serviceLabel(serviceType: string | null, scenario: string | null): string {
  const raw = (serviceType ?? '').trim();
  const fromKey = (key: string) => SCENARIO_INFO[key.toLowerCase() as Scenario]?.label;
  if (raw) return fromKey(raw) ?? raw.charAt(0).toUpperCase() + raw.slice(1);
  if (scenario) return fromKey(scenario) ?? scenario;
  return 'Klus';
}

export default async function MijnKlussenPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireCrmUser('/admin/mijn-klussen');
  const supabase = await createSupabaseServerClient();
  const sp = await searchParams;
  const q = (sp.q ?? '').trim().slice(0, 60);

  const { data: me } = await supabase
    .from('technicians')
    .select('id, name')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!me) {
    return (
      <>
        <PageHead title="Mijn klussen" sub="Uw geschiedenis, per model." />
        <Card padded>
          <p>Uw login is nog niet aan een monteur gekoppeld. Vraag het kantoor dit te doen.</p>
        </Card>
      </>
    );
  }

  let query = supabase
    .from('jobs')
    .select(
      'id, status, scheduled_date, slot_start, slot_end, postcode, city, car_make, car_model, car_year, scenario, service_type, quoted_price, final_price, tool_used_id, key_used, adapter_used, tech_note'
    )
    .eq('technician_id', me.id)
    .order('scheduled_date', { ascending: false })
    .order('slot_start', { ascending: false })
    .limit(200);

  if (q) {
    const safe = q.replace(/[,()%*\\]/g, ' ').trim();
    query = query.or(`car_make.ilike.%${safe}%,car_model.ilike.%${safe}%`);
  }

  const [{ data: jobs, error }, { data: tools }] = await Promise.all([
    query,
    supabase.from('technician_tools').select('id, brand, model').eq('technician_id', me.id).order('brand'),
  ]);

  if (error) {
    return (
      <>
        <PageHead title="Mijn klussen" sub="Uw geschiedenis, per model." />
        <Card padded>
          <p className={styles.warning}>
            {/does not exist|relation|column/i.test(error.message)
              ? 'Voer supabase/migrations/0022_job_tech_history.sql uit.'
              : error.message}
          </p>
        </Card>
      </>
    );
  }

  const rows: HistoryRow[] = (jobs ?? []).map((j) => ({
    id: j.id,
    status: j.status,
    date: j.scheduled_date,
    slot: slotLabel(j.slot_start, j.slot_end),
    place: [j.postcode, j.city].filter(Boolean).join(' '),
    car: [j.car_make, j.car_model].filter(Boolean).join(' ') || 'Onbekende auto',
    year: j.car_year ? String(j.car_year) : null,
    make: j.car_make,
    logo: getBrandLogo(j.car_make),
    service: serviceLabel(j.service_type, j.scenario),
    price: j.final_price ?? j.quoted_price,
    toolUsedId: j.tool_used_id,
    keyUsed: j.key_used,
    adapterUsed: j.adapter_used,
    techNote: j.tech_note,
  }));

  const toolOptions: ToolOption[] = (tools ?? []).map((t) => ({
    id: t.id,
    label: [t.brand, t.model].filter(Boolean).join(' '),
  }));

  const doneRows = rows.filter((r) => r.status === 'afgerond');
  const turnover = doneRows.reduce((t, r) => t + (Number(r.price) || 0), 0);
  const planned = rows.filter((r) => r.status === 'gepland' || r.status === 'onderweg' || r.status === 'bezig').length;
  const withNotes = rows.filter((r) => r.toolUsedId || r.keyUsed || r.adapterUsed || r.techNote).length;
  const EUR = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

  return (
    <>
      <PageHead
        title="Mijn klussen"
        sub="Al je klussen, nieuwste eerst. Klik een klus open om op te schrijven welk gereedschap, welke sleutel en welke adapter werkte. Zo vind je het de volgende keer terug."
      />

      <div className={styles.stats}>
        <div className={styles.stat}><span>Klussen</span><b>{rows.length}</b></div>
        <div className={styles.stat}><span>Afgerond</span><b>{doneRows.length}</b></div>
        <div className={styles.stat}><span>Gepland</span><b>{planned}</b></div>
        <div className={styles.stat}><span>Omzet afgerond</span><b>{EUR.format(turnover)}</b></div>
        <div className={styles.stat}><span>Met notitie</span><b>{withNotes}</b></div>
      </div>

      <form className={styles.search} action="/admin/mijn-klussen" role="search">
        <input
          type="search"
          name="q"
          defaultValue={q}
          aria-label="Zoek op merk of model"
          placeholder="Zoek op merk of model, bijv. Toyota of Prius"
          className={styles.searchInput}
        />
        <button type="submit" className={styles.searchBtn}>
          Zoeken
        </button>
        {q && (
          <a href="/admin/mijn-klussen" className={styles.searchClear}>
            Wis zoekterm
          </a>
        )}
      </form>

      {rows.length === 0 ? (
        <Card padded>
          <Empty>
            {q ? 'Geen eerdere klussen gevonden met deze zoekterm.' : 'Nog geen afgeronde klussen.'}
          </Empty>
        </Card>
      ) : (
        <JobHistoryList rows={rows} tools={toolOptions} />
      )}
    </>
  );
}
