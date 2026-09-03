import Link from 'next/link';
import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import styles from './leads.module.css';
import LeadsTable, { type LeadRow } from './LeadsTable';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

/** Minutes after which an untouched `new` lead is treated as late. */
const STALE_MINUTES = 60;

const TABS = [
  { value: '', label: 'Alles' },
  { value: 'new', label: 'Nieuw' },
  { value: 'qualified', label: 'Gekwalificeerd' },
  { value: 'contacted', label: 'Gebeld' },
  { value: 'sold', label: 'Verkocht' },
  { value: 'rejected', label: 'Afgewezen' },
  { value: 'duplicate', label: 'Dubbel' },
] as const;

const SOURCES = [
  'hero_wizard',
  'kenteken_form',
  'hero_form',
  'city_form',
  'contact_form',
  'webshop_service',
  'phone',
  'unknown',
];

const RANGES: Record<string, number | null> = {
  '1': 1,
  '7': 7,
  '30': 30,
  all: null,
};

/**
 * PostgREST's `or=` filter is a comma-separated list wrapped in parentheses,
 * so a comma or a bracket in the search term rewrites the query. Strip the
 * characters that carry meaning rather than trying to escape them.
 */
function sanitiseSearch(raw: string): string {
  return raw.replace(/[,()%*\\]/g, ' ').trim().slice(0, 60);
}

/**
 * Rebuilds the current URL with some filters changed. Paging is deliberately
 * opt-in: any filter change drops back to page 1, because page 3 of a result
 * set you just replaced is meaningless.
 */
function buildHref(
  current: Record<string, string | undefined>,
  changes: Record<string, string | undefined> = {},
  page?: number
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...current, ...changes })) {
    if (value) params.set(key, value);
  }
  if (page && page > 1) params.set('p', String(page));
  const query = params.toString();
  return query ? `/admin/leads?${query}` : '/admin/leads';
}

/**
 * Request-scoped clock reads.
 *
 * Kept out of the component body on purpose: React's purity rule treats
 * `Date.now()` during render as unstable, and it is right to in a component
 * that can re-render. This page is an async Server Component that runs once
 * per request, so "now" is a fixed input to that request — naming it as such
 * says so, instead of hiding a clock read in the middle of a query.
 */
function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

function isoMinutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireOfficeUser('/admin/leads');

  const sp = await searchParams;
  const one = (key: string): string | undefined => {
    const value = sp[key];
    return typeof value === 'string' && value ? value : undefined;
  };

  const status = TABS.some((t) => t.value === one('status')) ? one('status') : undefined;
  const source = SOURCES.includes(one('bron') ?? '') ? one('bron') : undefined;
  const postcode = one('pc')?.toUpperCase().replace(/\s+/g, '').slice(0, 6);
  const range = one('dagen') && one('dagen')! in RANGES ? one('dagen')! : '30';
  const search = sanitiseSearch(one('q') ?? '');
  const page = Math.max(1, Number.parseInt(one('p') ?? '1', 10) || 1);

  const currentParams = {
    status,
    bron: source,
    pc: postcode,
    dagen: range,
    q: search || undefined,
  };

  const supabase = await createSupabaseServerClient();

  const days = RANGES[range];
  const since = days ? isoDaysAgo(days) : null;

  /*
   * The same filter set is applied to the list query and to each tab's count
   * query. Supabase's builder type changes shape with every chained call, so
   * this takes it loosely typed rather than fighting the generics for no gain.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const applyFilters = (builder: any, withStatus = true): any => {
    let q = builder;
    if (status && withStatus) q = q.eq('status', status);
    if (source) q = q.eq('source', source);
    if (postcode) q = q.ilike('postcode', `${postcode}%`);
    if (since) q = q.gte('created_at', since);
    if (search) {
      const plate = search.replace(/[-\s]/g, '');
      q = q.or(
        [
          `name.ilike.%${search}%`,
          `phone.ilike.%${search}%`,
          `phone_e164.ilike.%${search}%`,
          `email.ilike.%${search}%`,
          `kenteken.ilike.%${plate}%`,
          // Plates used to be concatenated into `model`; historic rows only
          // have them there.
          `model.ilike.%${search}%`,
        ].join(',')
      );
    }
    return q;
  };

  const from = (page - 1) * PAGE_SIZE;

  const listQuery = applyFilters(
    supabase
      .from('leads')
      .select(
        'id, created_at, name, phone, phone_e164, email, postcode, location, brand, model, year, kenteken, service, source, status, sale_price, consent_marketing, first_contact_at',
        { count: 'exact' }
      )
  )
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  // Tab counts ignore the status filter but honour every other filter, so the
  // numbers describe the set you are actually looking through.
  const countQueries = TABS.filter((t) => t.value).map((tab) =>
    applyFilters(
      supabase.from('leads').select('id', { count: 'exact', head: true }),
      false
    ).eq('status', tab.value)
  );

  const [listResult, ...countResults] = await Promise.all([
    listQuery,
    ...countQueries,
  ]);

  if (listResult.error) {
    /*
     * Two different failures read almost the same to a user, so name them
     * apart. "permission denied" is a missing GRANT — Postgres refuses before
     * it evaluates any row policy. A missing policy would instead return an
     * empty list, which never reaches here.
     */
    const denied = /permission denied/i.test(listResult.error.message);

    return (
      <div className={styles.warning}>
        De leads konden niet worden geladen: {listResult.error.message}
        <br />
        {denied ? (
          <>
            De rol <code>authenticated</code> heeft geen rechten op de tabel.
            Voer <code>supabase/migrations/0003_crm_roles.sql</code> opnieuw uit
            — die is idempotent en bevat nu ook de ontbrekende{' '}
            <code>grant</code>.
          </>
        ) : (
          <>
            Controleer of <code>supabase/migrations/0003_crm_roles.sql</code> is
            uitgevoerd.
          </>
        )}
      </div>
    );
  }

  const rows = (listResult.data ?? []) as unknown as LeadRow[];
  const total = listResult.count ?? rows.length;

  const counts: Record<string, number> = {};
  TABS.filter((t) => t.value).forEach((tab, i) => {
    counts[tab.value] = countResults[i]?.count ?? 0;
  });

  /*
   * Repeat callers. Calling the same person twice about the same problem costs
   * trust, so the row has to say "this number rang before" before anyone picks
   * up the phone. One extra query for the numbers on this page only.
   */
  const phones = Array.from(
    new Set(rows.map((r) => r.phone_e164).filter((p): p is string => Boolean(p)))
  );

  const priorByPhone = new Map<string, { count: number; last: string }>();
  if (phones.length > 0) {
    const { data: history } = await supabase
      .from('leads')
      .select('id, phone_e164, created_at')
      .in('phone_e164', phones)
      .order('created_at', { ascending: false });

    const seen = new Map<string, string[]>();
    for (const item of history ?? []) {
      const key = item.phone_e164 as string;
      if (!seen.has(key)) seen.set(key, []);
      seen.get(key)!.push(item.created_at as string);
    }
    for (const [phone, dates] of seen) {
      if (dates.length > 1) {
        priorByPhone.set(phone, { count: dates.length, last: dates[1] });
      }
    }
  }

  const staleBefore = isoMinutesAgo(STALE_MINUTES);
  const lateCount = rows.filter(
    (r) => r.status === 'new' && r.created_at < staleBefore
  ).length;

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <div className={styles.head}>
        <h1 className={styles.title}>Leads</h1>
        <span className={styles.count}>
          {total} {total === 1 ? 'lead' : 'leads'}
          {range !== 'all' && ` · laatste ${range} ${range === '1' ? 'dag' : 'dagen'}`}
        </span>
        <span className={styles.hint}>
          <span className={styles.kbd}>/</span> zoeken
          <span className={styles.kbd}>j</span>
          <span className={styles.kbd}>k</span> navigeren
          <span className={styles.kbd}>e</span> bewerken
        </span>
      </div>

      {lateCount > 0 && (
        <p className={styles.warning}>
          <strong>{lateCount}</strong>{' '}
          {lateCount === 1 ? 'lead staat' : 'leads staan'} langer dan{' '}
          {STALE_MINUTES} minuten op <em>nieuw</em>. Bij spoedwerk is een late
          lead een verloren lead.
        </p>
      )}

      <nav className={styles.tabs}>
        {TABS.map((tab) => (
          <Link
            key={tab.value || 'all'}
            href={buildHref(currentParams, { status: tab.value || undefined })}
            className={
              (status ?? '') === tab.value
                ? `${styles.tab} ${styles.tabActive}`
                : styles.tab
            }
          >
            {tab.label}
            {tab.value && (
              <span className={styles.tabCount}>{counts[tab.value] ?? 0}</span>
            )}
          </Link>
        ))}
      </nav>

      <form className={styles.filters} method="get" action="/admin/leads">
        {status && <input type="hidden" name="status" value={status} />}
        <div className={`${styles.field} ${styles.fieldWide}`}>
          <label className={styles.fieldLabel} htmlFor="q">
            Zoek op naam, telefoon of kenteken
          </label>
          <input
            id="q"
            name="q"
            type="search"
            className={styles.control}
            defaultValue={search}
            placeholder="06-… · Jansen · XX-123-X"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="bron">
            Bron
          </label>
          <select id="bron" name="bron" className={styles.control} defaultValue={source ?? ''}>
            <option value="">Alle bronnen</option>
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="pc">
            Postcode
          </label>
          <input
            id="pc"
            name="pc"
            className={styles.control}
            defaultValue={postcode ?? ''}
            placeholder="3512"
            size={6}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="dagen">
            Periode
          </label>
          <select id="dagen" name="dagen" className={styles.control} defaultValue={range}>
            <option value="1">Vandaag</option>
            <option value="7">7 dagen</option>
            <option value="30">30 dagen</option>
            <option value="all">Alles</option>
          </select>
        </div>

        <button className={styles.apply} type="submit">
          Filter
        </button>
        <Link className={styles.reset} href="/admin/leads">
          Wissen
        </Link>
      </form>

      <LeadsTable
        rows={rows}
        staleBefore={staleBefore}
        repeats={Object.fromEntries(priorByPhone)}
      />

      {pages > 1 && (
        <div className={styles.pager}>
          <span>
            Pagina {page} van {pages}
          </span>
          {page > 1 && (
            <Link
              className={styles.pageLink}
              href={buildHref(currentParams, {}, page - 1)}
            >
              Vorige
            </Link>
          )}
          {page < pages && (
            <Link
              className={styles.pageLink}
              href={buildHref(currentParams, {}, page + 1)}
            >
              Volgende
            </Link>
          )}
        </div>
      )}
    </>
  );
}
