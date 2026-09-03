import Link from 'next/link';
import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import styles from './klanten.module.css';

export const dynamic = 'force-dynamic';

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const DATE = new Intl.DateTimeFormat('nl-NL', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'Europe/Amsterdam',
});

interface CustomerRow {
  phone_e164: string;
  name: string | null;
  email: string | null;
  first_seen: string;
  last_seen: string;
  lead_count: number;
  sold_count: number;
  total_value: number | string;
  consent_marketing: boolean | null;
  postcode: string | null;
}

export default async function KlantenPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireOfficeUser('/admin/klanten');

  const { q } = await searchParams;
  const search = (q ?? '').replace(/[,()%*\\]/g, ' ').trim().slice(0, 60);

  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from('crm_customers')
    .select(
      'phone_e164, name, email, first_seen, last_seen, lead_count, sold_count, total_value, consent_marketing, postcode'
    )
    .order('last_seen', { ascending: false })
    .limit(200);

  if (search) {
    query = query.or(
      [
        `name.ilike.%${search}%`,
        `email.ilike.%${search}%`,
        `phone_e164.ilike.%${search}%`,
        `postcode.ilike.%${search}%`,
      ].join(',')
    );
  }

  const { data, error } = await query;

  if (error) {
    const missing = /does not exist|relation|permission denied/i.test(error.message);
    return (
      <div className={styles.warning}>
        Klanten konden niet worden geladen: {error.message}
        {missing && (
          <>
            <br />
            Voer <code>supabase/migrations/0006_customers_reports.sql</code> uit.
          </>
        )}
      </div>
    );
  }

  const rows = (data ?? []) as unknown as CustomerRow[];

  return (
    <>
      <div className={styles.head}>
        <h1 className={styles.title}>Klanten</h1>
        <span className={styles.count}>
          {rows.length} {rows.length === 1 ? 'klant' : 'klanten'}
          {search && ' gevonden'}
        </span>
        <form className={styles.search} method="get" action="/admin/klanten">
          <input
            className={styles.control}
            type="search"
            name="q"
            defaultValue={search}
            placeholder="naam, telefoon, postcode"
          />
          <button className={styles.apply} type="submit">
            Zoek
          </button>
        </form>
      </div>

      {rows.length === 0 ? (
        <div className={styles.wrap}>
          <p className={styles.empty}>
            {search ? 'Geen klant gevonden.' : 'Nog geen klanten met een telefoonnummer.'}
          </p>
        </div>
      ) : (
        <div className={styles.wrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Klant</th>
                <th>Plaats</th>
                <th>Aanvragen</th>
                <th>Verkocht</th>
                <th style={{ textAlign: 'right' }}>Omzet</th>
                <th>Laatste</th>
                <th>Marketing</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.phone_e164}>
                  <td>
                    <Link
                      className={`${styles.strong} ${styles.link}`}
                      href={`/admin/klanten/${encodeURIComponent(c.phone_e164)}`}
                    >
                      {c.name ?? 'geen naam'}
                    </Link>
                    <span className={styles.sub}>{c.phone_e164}</span>
                  </td>
                  <td>{c.postcode ?? '—'}</td>
                  <td>{c.lead_count}</td>
                  <td>{c.sold_count}</td>
                  <td className={styles.money}>
                    {MONEY.format(Number(c.total_value ?? 0))}
                  </td>
                  <td>{DATE.format(new Date(c.last_seen))}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        c.consent_marketing ? styles.ok : styles.no
                      }`}
                    >
                      {c.consent_marketing ? 'ja' : 'nee'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
