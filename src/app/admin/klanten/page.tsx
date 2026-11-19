import Link from 'next/link';
import { MessageCircle, Phone, Search } from 'lucide-react';
import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { waLink } from '@/lib/whatsapp';
import { PageHead, Notice } from '../_ui';
import k from './klanten-v2.module.css';

export const dynamic = 'force-dynamic';

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const DATE = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Amsterdam' });

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

const initials = (name: string | null) =>
  (name ?? '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('') || '?';

/**
 * Every customer once, keyed on the phone number (crm_customers): who they
 * are, how often they asked, what they bought, and a call or WhatsApp away.
 */
export default async function KlantenPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireOfficeUser('/admin/klanten');

  const { q } = await searchParams;
  const search = (q ?? '').replace(/[,()%*\\]/g, ' ').trim().slice(0, 60);
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from('crm_customers')
    .select('phone_e164, name, email, first_seen, last_seen, lead_count, sold_count, total_value, consent_marketing, postcode')
    .order('last_seen', { ascending: false })
    .limit(200);

  if (search) {
    query = query.or(
      [`name.ilike.%${search}%`, `email.ilike.%${search}%`, `phone_e164.ilike.%${search}%`, `postcode.ilike.%${search}%`].join(',')
    );
  }

  const { data, error } = await query;

  if (error) {
    const missing = /does not exist|relation|permission denied/i.test(error.message);
    return (
      <>
        <PageHead title="Klanten" />
        <Notice tone="bad">
          Klanten konden niet worden geladen: {error.message}
          {missing && ' — voer supabase/migrations/0006_customers_reports.sql uit.'}
        </Notice>
      </>
    );
  }

  const rows = (data ?? []) as unknown as CustomerRow[];
  const buyers = rows.filter((c) => c.sold_count > 0).length;
  const turnover = rows.reduce((t, c) => t + Number(c.total_value ?? 0), 0);
  const consent = rows.filter((c) => c.consent_marketing).length;

  return (
    <>
      <PageHead
        title="Klanten"
        sub="Iedere klant één keer, herkend aan het telefoonnummer. Klik een naam voor alle aanvragen, klussen en auto's."
      />

      <form className={k.search} method="get" action="/admin/klanten" role="search">
        <Search size={18} aria-hidden="true" />
        <input type="search" name="q" defaultValue={search} placeholder="Zoek op naam, telefoon, e-mail of postcode" aria-label="Zoek klant" />
        <button type="submit">Zoeken</button>
        {search && (
          <Link href="/admin/klanten" className={k.clear}>
            Wis
          </Link>
        )}
      </form>

      <div className={k.stats}>
        <div><span>{search ? 'Gevonden' : 'Klanten'}</span><b>{rows.length}</b></div>
        <div><span>Kochten iets</span><b>{buyers}</b></div>
        <div><span>Omzet</span><b>{MONEY.format(turnover)}</b></div>
        <div><span>Mag gemaild worden</span><b>{consent}</b></div>
      </div>

      {rows.length === 0 ? (
        <p className={k.empty}>{search ? 'Geen klant gevonden met deze zoekterm.' : 'Nog geen klanten met een telefoonnummer.'}</p>
      ) : (
        <ul className={k.list}>
          {rows.map((c) => {
            const href = `/admin/klanten/${encodeURIComponent(c.phone_e164)}`;
            const wa = waLink(c.phone_e164, `Goedendag${c.name ? ` ${c.name.split(' ')[0]}` : ''}, hier Autosleutel24. `);
            return (
              <li key={c.phone_e164} className={k.row}>
                <Link href={href} className={k.who}>
                  <span className={k.avatar}>{initials(c.name)}</span>
                  <span className={k.whoText}>
                    <b>{c.name ?? 'Naam onbekend'}</b>
                    <small>
                      {c.phone_e164}
                      {c.postcode && ` · ${c.postcode}`}
                    </small>
                  </span>
                </Link>
                <span className={k.counts}>
                  <span className={k.chip}>{c.lead_count} aanvra{c.lead_count === 1 ? 'ag' : 'gen'}</span>
                  {c.sold_count > 0 && <span className={`${k.chip} ${k.chipOk}`}>{c.sold_count} verkocht</span>}
                </span>
                <span className={k.money}>{MONEY.format(Number(c.total_value ?? 0))}</span>
                <span className={k.last}>{DATE.format(new Date(c.last_seen))}</span>
                <span className={k.actions}>
                  <a href={`tel:${c.phone_e164}`} className={k.iconBtn} aria-label={`Bel ${c.name ?? c.phone_e164}`}>
                    <Phone size={16} />
                  </a>
                  {wa && (
                    <a href={wa} target="_blank" rel="noopener noreferrer" className={k.iconBtn} aria-label={`WhatsApp ${c.name ?? c.phone_e164}`}>
                      <MessageCircle size={16} />
                    </a>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
