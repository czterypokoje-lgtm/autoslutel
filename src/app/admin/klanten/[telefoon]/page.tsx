import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { slotLabel } from '@/lib/crmJobs';
import { CalendarPlus, MessageCircle, Phone } from 'lucide-react';
import { waLink } from '@/lib/whatsapp';
import { getBrandLogo } from '@/lib/brandLogos';
import { sourceLabel } from '../../overzicht/dashboardData';
import k from '../klanten-v2.module.css';
import EraseButton from './EraseButton';

export const dynamic = 'force-dynamic';

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const DATE = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Amsterdam' });

const LEAD_STATUS: Record<string, { label: string; cls: string }> = {
  new: { label: 'Nieuw', cls: 'info' },
  qualified: { label: 'Gekwalificeerd', cls: 'mute' },
  contacted: { label: 'Gebeld', cls: 'warn' },
  sold: { label: 'Verkocht', cls: 'ok' },
  rejected: { label: 'Afgewezen', cls: 'stop' },
  duplicate: { label: 'Dubbel', cls: 'mute' },
  spam: { label: 'Spam', cls: 'mute' },
};
const JOB_STATUS: Record<string, { label: string; cls: string }> = {
  gepland: { label: 'Gepland', cls: 'info' },
  onderweg: { label: 'Onderweg', cls: 'warn' },
  bezig: { label: 'Bezig', cls: 'warn' },
  afgerond: { label: 'Afgerond', cls: 'ok' },
  geannuleerd: { label: 'Geannuleerd', cls: 'mute' },
};

export default async function KlantPage({
  params,
}: {
  params: Promise<{ telefoon: string }>;
}) {
  const { telefoon } = await params;
  const phone = decodeURIComponent(telefoon);
  await requireOfficeUser(`/admin/klanten/${telefoon}`);

  const supabase = await createSupabaseServerClient();

  const [{ data: customer }, { data: vehicles }, { data: leads }, { data: jobs }] =
    await Promise.all([
      supabase
        .from('crm_customers')
        .select('*')
        .eq('phone_e164', phone)
        .maybeSingle(),
      supabase
        .from('crm_customer_vehicles')
        .select('kenteken, brand, model, year, aanvragen, last_seen')
        .eq('phone_e164', phone)
        .order('last_seen', { ascending: false }),
      supabase
        .from('leads')
        .select('id, created_at, status, source, service, brand, model, kenteken, sale_price')
        .eq('phone_e164', phone)
        .order('created_at', { ascending: false }),
      supabase
        .from('jobs')
        .select('id, status, scheduled_date, slot_start, slot_end, service_type, final_price, quoted_price')
        .eq('customer_phone', phone)
        .order('scheduled_date', { ascending: false }),
    ]);

  if (!customer) notFound();

  type Event = { key: string; at: string; kind: 'lead' | 'job'; title: string; sub: string; status: { label: string; cls: string }; href?: string };
  const events: Event[] = [
    ...(leads ?? []).map((l) => ({
      key: `l${l.id}`,
      at: String(l.created_at),
      kind: 'lead' as const,
      title: `Aanvraag · ${(l.service as string) ?? 'geen dienst'}`,
      sub: [sourceLabel(l.source as string | null), [l.brand, l.model].filter(Boolean).join(' '), l.kenteken].filter(Boolean).join(' · '),
      status: LEAD_STATUS[l.status as string] ?? { label: String(l.status), cls: 'mute' },
    })),
    ...(jobs ?? []).map((j) => ({
      key: `j${j.id}`,
      at: `${j.scheduled_date}T${String(j.slot_start ?? '12:00').slice(0, 5)}:00`,
      kind: 'job' as const,
      title: `Klus · ${(j.service_type as string) ?? 'geen dienst'}`,
      sub: [
        slotLabel(j.slot_start as string, j.slot_end as string),
        (j.final_price ?? j.quoted_price) !== null ? MONEY.format(Number(j.final_price ?? j.quoted_price)) : null,
      ]
        .filter(Boolean)
        .join(' · '),
      status: JOB_STATUS[j.status as string] ?? { label: String(j.status), cls: 'mute' },
      href: `/admin/jobs/${j.id}`,
    })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  const name = (customer.name as string) ?? 'Klant zonder naam';
  const wa = waLink(phone, `Goedendag${customer.name ? ` ${String(customer.name).split(' ')[0]}` : ''}, hier Autosleutel24. `);
  const jobsDone = (jobs ?? []).filter((j) => j.status === 'afgerond').length;

  return (
    <>
      <Link href="/admin/klanten" className={k.backLink}>‹ Alle klanten</Link>

      <header className={k.hero}>
        <span className={k.avatarBig}>
          {name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('')}
        </span>
        <div className={k.heroText}>
          <h1>{name}</h1>
          <span>
            {phone}
            {customer.postcode && ` · ${customer.postcode}`}
            {customer.email && ` · ${customer.email}`}
          </span>
        </div>
        <div className={k.heroActions}>
          <a href={`tel:${phone}`} className={k.btnGhost}><Phone size={16} /> Bellen</a>
          {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className={k.btnGhost}><MessageCircle size={16} /> WhatsApp</a>}
          <Link href="/admin/jobs/nieuw" className={k.btnPrimary}><CalendarPlus size={16} /> Klus inplannen</Link>
        </div>
      </header>

      <div className={k.stats}>
        <div><span>Klant sinds</span><b>{DATE.format(new Date(customer.first_seen as string))}</b></div>
        <div><span>Aanvragen</span><b>{(leads ?? []).length}</b></div>
        <div><span>Klussen afgerond</span><b>{jobsDone}</b></div>
        <div><span>Omzet</span><b>{MONEY.format(Number(customer.total_value ?? 0))}</b></div>
      </div>

      <div className={k.cols}>
        <section className={k.card}>
          <h2>Tijdlijn</h2>
          {events.length === 0 ? (
            <p className={k.note}>Nog geen aanvragen of klussen.</p>
          ) : (
            <ol className={k.timeline}>
              {events.map((e) => (
                <li key={e.key} className={e.kind === 'job' ? k.evJob : k.evLead}>
                  <span className={k.evDot} aria-hidden="true" />
                  <div className={k.evBody}>
                    <div className={k.evTop}>
                      {e.href ? <Link href={e.href}>{e.title}</Link> : <b>{e.title}</b>}
                      <span className={`${k.pill} ${k[e.status.cls]}`}>{e.status.label}</span>
                    </div>
                    <small>
                      {DATE.format(new Date(e.at))}
                      {e.sub && ` · ${e.sub}`}
                    </small>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        <div className={k.side}>
          <section className={k.card}>
            <h2>Auto&apos;s</h2>
            {(vehicles ?? []).length === 0 ? (
              <p className={k.note}>Nog geen kenteken bekend voor deze klant.</p>
            ) : (
              <ul className={k.cars}>
                {(vehicles ?? []).map((v) => {
                  const logo = getBrandLogo(v.brand as string | null);
                  return (
                    <li key={v.kenteken as string}>
                      {logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={logo} alt="" />
                      ) : (
                        <i aria-hidden="true" />
                      )}
                      <span>
                        <b>{[v.brand, v.model, v.year].filter(Boolean).join(' ') || 'Auto'}</b>
                        <small>
                          <span className={k.plate}>{v.kenteken as string}</span> · {v.aanvragen as number}× · laatst{' '}
                          {DATE.format(new Date(v.last_seen as string))}
                        </small>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className={k.card}>
            <h2>Privacy (AVG)</h2>
            <p className={k.note}>
              Marketing:{' '}
              <span className={`${k.pill} ${customer.consent_marketing ? k.ok : k.mute}`}>
                {customer.consent_marketing ? 'toestemming' : 'geen toestemming'}
              </span>
              {customer.consent_at && <> sinds {DATE.format(new Date(customer.consent_at as string))}</>}
            </p>
            <p className={k.note}>Zet deze klant alleen op een mailinglijst als hier &ldquo;toestemming&rdquo; staat.</p>
          </section>

          <section className={`${k.card} ${k.danger}`}>
            <h2>Gegevens wissen</h2>
            <p className={k.note}>
              Verwijdert alle aanvragen van dit nummer en haalt naam, telefoon, adres en notities van de klussen af. De klussen
              zelf blijven bestaan voor de administratie (7 jaar). Dit kan niet ongedaan worden gemaakt.
            </p>
            <EraseButton phone={phone} />
          </section>
        </div>
      </div>
    </>
  );
}
