import Link from 'next/link';
import { PreviewText } from '@/app/admin/PreviewLanguage';
import { BRAND, WAREHOUSE } from '@/config/install';
import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { Card, CardHead, Empty, Stat, StatGrid } from '../_ui';
import { BarChart, RankedBars } from '../_ui/charts';

export const dynamic = 'force-dynamic';
export const metadata = { title: `Rapporten | ${BRAND.name}` };

/*
 * One visual reports page instead of fifteen scattered ones (spec §5): per tab a
 * few decision cards, one main chart, one ranking, and links to the detail pages
 * that hold the full tables and PDFs. Revenue is counted on the invoice date
 * (owner decision pending: switch the source in salesTab if jobs should count).
 */

const EUR = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const eur = (v: number) => EUR.format(v);
const num = (v: number) => new Intl.NumberFormat('nl-NL').format(v);
const DAY = 86_400_000;

const TABS = [
  { id: 'verkoop', label: 'Verkoop' }, { id: 'leads', label: 'Leads' }, { id: 'webshop', label: 'Webshop', warehouse: true },
  { id: 'voorraad', label: 'Voorraad', warehouse: true }, { id: 'ai', label: 'Gesprekken en AI' }, { id: 'marketing', label: 'Marketing' },
] as const;
type Tab = (typeof TABS)[number]['id'];

const LOST: Record<string, string> = {
  price_too_high: 'Te duur', unreachable: 'Niet bereikbaar', competitor: 'Concurrent', out_of_area: 'Buiten werkgebied',
  vehicle_unsupported: 'Auto niet ondersteund', customer_cancelled: 'Klant zag af',
};

/** Daily buckets for the last `days` days, oldest first, labelled d/m. */
function perDay(days: number, rows: { at: string; value: number }[]) {
  const start = Date.now() - (days - 1) * DAY;
  const buckets = Array.from({ length: days }, (_, i) => { const d = new Date(start + i * DAY); return { key: d.toISOString().slice(0, 10), label: `${d.getUTCDate()}/${d.getUTCMonth() + 1}`, value: 0 }; });
  const index = new Map(buckets.map((b, i) => [b.key, i]));
  for (const row of rows) { const i = index.get(row.at.slice(0, 10)); if (i !== undefined) buckets[i].value += row.value; }
  return buckets.map(({ label, value }) => ({ label, value }));
}
const rank = (rows: { key: string | null; value: number }[], fallback: string, top = 6) => {
  const totals = new Map<string, number>();
  for (const r of rows) totals.set(r.key || fallback, (totals.get(r.key || fallback) ?? 0) + r.value);
  return [...totals].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, top);
};

function Details({ links }: { links: [string, string][] }) {
  return (
    <p className="text-sm">
      <span className="text-muted-foreground"><PreviewText>{"Details"}</PreviewText>: </span>
      {links.map(([href, label], i) => <span key={href}>{i > 0 && ' · '}<Link className="underline underline-offset-4" href={href}><PreviewText>{label}</PreviewText></Link></span>)}
    </p>
  );
}

function Panel({ title, chart, ranking, rankingTitle, links }: { title: string; chart: { label: string; value: number }[]; ranking: { label: string; value: number }[]; rankingTitle: string; links: [string, string][]; }) {
  const fmt = (v: number) => (title.includes('€') ? eur(v) : num(v));
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card><CardHead><PreviewText>{title}</PreviewText></CardHead>{chart.some((b) => b.value) ? <BarChart reportStyle bars={chart} format={fmt} /> : <Empty><PreviewText>{"Nog geen gegevens in deze periode."}</PreviewText></Empty>}</Card>
        <Card><CardHead><PreviewText>{rankingTitle}</PreviewText></CardHead>{ranking.length ? <RankedBars rows={ranking} format={fmt} /> : <Empty><PreviewText>{"Nog geen gegevens in deze periode."}</PreviewText></Empty>}</Card>
      </div>
      <Details links={links} />
    </>
  );
}

async function salesTab(days: number) {
  const db = createSupabaseAdminClient();
  const since = new Date(Date.now() - (days - 1) * DAY).toISOString().slice(0, 10);
  const { data } = await db.from('sales_invoices').select('issue_date, subtotal, total, status').gte('issue_date', since).neq('status', 'concept');
  const rows = data ?? [];
  const invoiced = rows.reduce((s, r) => s + Number(r.subtotal ?? 0), 0);
  const paid = rows.filter((r) => r.status === 'betaald').reduce((s, r) => s + Number(r.total ?? 0), 0);
  const open = rows.filter((r) => r.status !== 'betaald').reduce((s, r) => s + Number(r.total ?? 0), 0);
  return (
    <>
      <StatGrid>
        <Stat label={<PreviewText>{"Gefactureerd excl. btw"}</PreviewText>} value={eur(invoiced)} foot={`${num(rows.length)} facturen`} />
        <Stat label={<PreviewText>{"Betaald incl. btw"}</PreviewText>} value={eur(paid)} />
        <Stat label={<PreviewText>{"Nog open incl. btw"}</PreviewText>} value={eur(open)} />
        <Stat label={<PreviewText>{"Gemiddelde factuur"}</PreviewText>} value={rows.length ? eur(invoiced / rows.length) : '—'} />
      </StatGrid>
      <Panel title="Omzet per dag (€, factuurdatum)" chart={perDay(days, rows.map((r) => ({ at: r.issue_date, value: Number(r.subtotal ?? 0) })))}
        rankingTitle="Facturen per status" ranking={rank(rows.map((r) => ({ key: r.status, value: 1 })), 'onbekend')}
        links={[['/admin/rapport/verkoop', 'Verkoop & diensten (met PDF)'], ['/admin/rapport', 'Prestaties per monteur'], ['/admin/winst', 'Winst per klus'], ['/admin/financien', 'Financieel overzicht']]} />
    </>
  );
}

async function leadsTab(days: number) {
  const db = createSupabaseAdminClient();
  const since = new Date(Date.now() - (days - 1) * DAY).toISOString();
  const { data } = await db.from('leads').select('id, created_at, status, source, lost_reason, first_contact_at').gte('created_at', since);
  const rows = data ?? [];
  const sold = rows.filter((r) => r.status === 'sold').length;
  const lost = rows.filter((r) => r.status === 'rejected');
  const contacted = rows.filter((r) => r.first_contact_at);
  const minutes = contacted.map((r) => (Date.parse(r.first_contact_at!) - Date.parse(r.created_at)) / 60_000).filter((m) => m >= 0).sort((a, b) => a - b);
  const median = minutes.length ? minutes[Math.floor(minutes.length / 2)] : null;
  // Never followed up: still 'new' after an hour, no first contact and no note.
  const stale = rows.filter((r) => r.status === 'new' && !r.first_contact_at && Date.now() - Date.parse(r.created_at) > 3_600_000);
  const { data: notes } = stale.length ? await db.from('lead_notes').select('lead_id').in('lead_id', stale.map((r) => r.id)) : { data: [] };
  const noted = new Set((notes ?? []).map((n) => n.lead_id));
  const neverFollowed = stale.filter((r) => !noted.has(r.id)).length;
  return (
    <>
      <StatGrid>
        <Stat label={<PreviewText>{"Leads binnen"}</PreviewText>} value={num(rows.length)} foot={rows.length ? `${Math.round((sold / rows.length) * 100)}% verkocht` : undefined} />
        <Stat label={<PreviewText>{"Mediaan eerste contact"}</PreviewText>} value={median === null ? '—' : median < 60 ? `${Math.round(median)} min` : `${(median / 60).toFixed(1)} u`} foot={`${num(contacted.length)} met contactmoment`} />
        <Stat label={<PreviewText>{"Nooit opgevolgd"}</PreviewText>} value={num(neverFollowed)} foot="nieuw, >1 uur, geen contact of notitie" tone={neverFollowed ? 'warn' : undefined} />
        <Stat label={<PreviewText>{"Verloren"}</PreviewText>} value={num(lost.length)} foot={`${num(lost.filter((r) => !r.lost_reason).length)} zonder reden`} />
      </StatGrid>
      <Panel title="Leads per dag" chart={perDay(days, rows.map((r) => ({ at: r.created_at, value: 1 })))}
        rankingTitle="Waarom verloren" ranking={rank(lost.map((r) => ({ key: r.lost_reason ? LOST[r.lost_reason] ?? r.lost_reason : null, value: 1 })), 'Geen reden vastgelegd')}
        links={[['/admin/leads/opvolging', 'Leadopvolging'], ['/admin/leads', 'Leads per bron'], ['/admin/rapportage', 'Rapportage (reactietijd, regio)']]} />
      <Card><CardHead><PreviewText>{"Leads per bron"}</PreviewText></CardHead><RankedBars rows={rank(rows.map((r) => ({ key: r.source, value: 1 })), 'onbekend', 8)} format={num} /></Card>
    </>
  );
}

async function webshopTab(days: number) {
  const db = createSupabaseAdminClient();
  const since = new Date(Date.now() - (days - 1) * DAY).toISOString();
  const [{ data: orders }, { data: refunds }] = await Promise.all([
    db.from('kfc_shop_orders').select('created_at, shop, status, total_excl_cents').gte('created_at', since),
    db.from('kfc_shop_order_refunds').select('amount_cents, created_at').gte('created_at', since),
  ]);
  const paid = (orders ?? []).filter((o) => ['processing', 'completed'].includes(o.status));
  const revenue = paid.reduce((s, o) => s + (o.total_excl_cents ?? 0), 0) / 100;
  const refunded = (refunds ?? []).reduce((s, r) => s + r.amount_cents, 0) / 100;
  return (
    <>
      <StatGrid>
        <Stat label={<PreviewText>{"Betaalde bestellingen"}</PreviewText>} value={num(paid.length)} />
        <Stat label={<PreviewText>{"Omzet excl. btw"}</PreviewText>} value={eur(revenue)} />
        <Stat label={<PreviewText>{"Terugbetaald"}</PreviewText>} value={eur(refunded)} />
        <Stat label={<PreviewText>{"Netto"}</PreviewText>} value={eur(revenue - refunded)} />
      </StatGrid>
      <Panel title="Webshopomzet per dag (€)" chart={perDay(days, paid.map((o) => ({ at: o.created_at, value: (o.total_excl_cents ?? 0) / 100 })))}
        rankingTitle="Omzet per webshop (€)" ranking={rank(paid.map((o) => ({ key: o.shop, value: (o.total_excl_cents ?? 0) / 100 })), 'onbekend')}
        links={[['/admin/winst/webshop', 'Webshopmarge (met kostprijs)'], ['/admin/bestellingen/picken', 'Picklijst']]} />
    </>
  );
}

async function stockTab(days: number) {
  const db = createSupabaseAdminClient();
  const since = new Date(Date.now() - (days - 1) * DAY).toISOString();
  const [{ data: levels }, { data: moves }] = await Promise.all([
    db.from('kfc_stock_levels').select('quantity, minimum, kfc_articles (purchase_price_cents)').limit(20000),
    db.from('kfc_stock_moves').select('reason, delta, created_at').gte('created_at', since).limit(20000),
  ]);
  const rows = (levels ?? []) as unknown as { quantity: number; minimum: number | null; kfc_articles: { purchase_price_cents: number | null } | null }[];
  const units = rows.reduce((s, r) => s + Math.max(r.quantity, 0), 0);
  const value = rows.reduce((s, r) => s + Math.max(r.quantity, 0) * (r.kfc_articles?.purchase_price_cents ?? 0), 0) / 100;
  const unpriced = rows.filter((r) => r.quantity > 0 && r.kfc_articles?.purchase_price_cents == null).length;
  const low = rows.filter((r) => r.minimum != null && r.quantity <= r.minimum).length;
  const label: Record<string, string> = { count: 'Telling', sale: 'Verkoop', return: 'Retour', received: 'Ontvangst', transfer: 'Verplaatsing', correction: 'Correctie', issue: 'Uitgifte', assembly: 'Montage' };
  return (
    <>
      <StatGrid>
        <Stat label={<PreviewText>{"Stuks op voorraad"}</PreviewText>} value={num(units)} />
        <Stat label={<PreviewText>{"Voorraadwaarde"}</PreviewText>} value={eur(value)} foot={unpriced ? `${num(unpriced)} zonder kostprijs (niet meegeteld)` : undefined} />
        <Stat label={<PreviewText>{"Op of onder minimum"}</PreviewText>} value={num(low)} tone={low ? 'warn' : undefined} />
        <Stat label={<PreviewText>{"Bewegingen"}</PreviewText>} value={num((moves ?? []).length)} />
      </StatGrid>
      <Panel title="Bewegingen per dag" chart={perDay(days, (moves ?? []).map((m) => ({ at: m.created_at, value: 1 })))}
        rankingTitle="Stuks per soort beweging" ranking={rank((moves ?? []).map((m) => ({ key: label[m.reason] ?? m.reason, value: Math.abs(m.delta) })), 'overig')}
        links={[['/admin/rapport/voorraad', 'Voorraadstand (met PDF)'], ['/admin/rapport/voorraadbewegingen', 'Voorraadbewegingen'], ['/admin/voorraad?view=reorder', 'Bestelvoorstel'], ['/admin/inkoop', 'Inkoop'], ['/admin/voorraad/montage', 'Montage']]} />
    </>
  );
}

/** ElevenLabs credit, read live when the key is set; null means not connected or not readable. */
async function elevenLabsCredit(): Promise<{ used: number; limit: number; tier: string } | null> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch('https://api.elevenlabs.io/v1/user/subscription', { headers: { 'xi-api-key': key }, cache: 'no-store', signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const body = await res.json();
    return { used: Number(body.character_count ?? 0), limit: Number(body.character_limit ?? 0), tier: String(body.tier ?? '') };
  } catch { return null; }
}

async function aiTab(days: number) {
  const db = createSupabaseAdminClient();
  const since = new Date(Date.now() - (days - 1) * DAY).toISOString();
  const [{ data: calls }, { data: threads }, credit] = await Promise.all([
    db.from('agent_conversations').select('channel, duration_secs, outcome, created_at').gte('created_at', since),
    db.from('inbox_threads').select('status, unread, channel'),
    elevenLabsCredit(),
  ]);
  const phone = (calls ?? []).filter((c) => c.channel === 'phone');
  const minutes = phone.reduce((s, c) => s + (c.duration_secs ?? 0), 0) / 60;
  const open = (threads ?? []).filter((t) => t.status === 'open');
  return (
    <>
      <StatGrid>
        <Stat label={<PreviewText>{"Telefoongesprekken (AI)"}</PreviewText>} value={num(phone.length)} foot={`${Math.round(minutes)} min in totaal`} />
        <Stat label={<PreviewText>{"WhatsApp-gesprekken (AI)"}</PreviewText>} value={num((calls ?? []).filter(c => c.channel === 'whatsapp').length)} />
        <Stat label={<PreviewText>{"Open in de inbox"}</PreviewText>} value={num(open.length)} foot={`${num(open.reduce((s, t) => s + (t.unread ?? 0), 0))} ongelezen`} />
        <Stat label={<PreviewText>{"ElevenLabs-tegoed"}</PreviewText>}
          value={credit ? `${num(credit.used)} / ${num(credit.limit)}` : <PreviewText>{"Niet gekoppeld"}</PreviewText>}
          foot={credit ? `${credit.limit ? Math.round((credit.used / credit.limit) * 100) : 0}% verbruikt${credit.tier ? ` · ${credit.tier}` : ''}` : 'Zet ELEVENLABS_API_KEY; dan verschijnt het tegoed hier vanzelf.'} />
      </StatGrid>
      <Panel title="AI-gesprekken per dag" chart={perDay(days, (calls ?? []).map((c) => ({ at: c.created_at, value: 1 })))}
        rankingTitle="Uitkomst van de gesprekken" ranking={rank((calls ?? []).map((c) => ({ key: c.outcome, value: 1 })), 'onbekend')}
        links={[['/admin/gesprekken', 'Gesprekken (inbox)'], ['/admin/bot-conversations', 'Botgesprekken'], ['/admin/whatsapp-analyse', 'WhatsApp-analyse'], ['/admin/instellingen/budget', 'AI-budget'], ['/admin/kantoor', 'Kantoor (AI-bureaus)'], ['/admin/live', 'Live']]} />
    </>
  );
}

async function marketingTab(days: number) {
  const db = createSupabaseAdminClient();
  const since = new Date(Date.now() - (days - 1) * DAY).toISOString();
  const [{ data: costs }, { data: visits }] = await Promise.all([
    db.from('crm_marketing_costs').select('date, source, spend, clicks').gte('date', since.slice(0, 10)),
    db.from('ad_visits').select('created_at, js_ran, webdriver').gte('created_at', since).limit(20000),
  ]);
  const spend = (costs ?? []).reduce((s, c) => s + Number(c.spend ?? 0), 0);
  const clicks = (costs ?? []).reduce((s, c) => s + (c.clicks ?? 0), 0);
  const suspicious = (visits ?? []).filter((v) => v.webdriver || v.js_ran === false).length;
  return (
    <>
      <StatGrid>
        <Stat label={<PreviewText>{"Advertentiekosten"}</PreviewText>} value={eur(spend)} />
        <Stat label={<PreviewText>{"Klikken"}</PreviewText>} value={num(clicks)} foot={clicks ? `${eur(spend / clicks)} per klik` : undefined} />
        <Stat label={<PreviewText>{"Advertentiebezoeken"}</PreviewText>} value={num((visits ?? []).length)} />
        <Stat label={<PreviewText>{"Verdacht"}</PreviewText>} value={num(suspicious)} foot="zonder browser of als robot" tone={suspicious ? 'warn' : undefined} />
      </StatGrid>
      <Panel title="Advertentiekosten per dag (€)" chart={perDay(days, (costs ?? []).map((c) => ({ at: c.date, value: Number(c.spend ?? 0) })))}
        rankingTitle="Kosten per bron (€)" ranking={rank((costs ?? []).map((c) => ({ key: c.source, value: Number(c.spend ?? 0) })), 'onbekend')}
        links={[['/admin/attributie', 'Advertentieklikken'], ['/admin/whatsapp-advertenties', 'WhatsApp en advertenties'], ['/admin/klikfraude', 'Klikfraude']]} />
    </>
  );
}

export default async function RapportenPage({ searchParams }: { searchParams: Promise<{ tab?: string; dagen?: string }> }) {
  await requireOfficeUser('/admin/rapporten');
  const params = await searchParams;
  const tabs = TABS.filter((t) => !('warehouse' in t) || WAREHOUSE);
  const tab: Tab = (tabs.find((t) => t.id === params.tab)?.id ?? 'verkoop') as Tab;
  const days = [7, 30, 90].includes(Number(params.dagen)) ? Number(params.dagen) : 30;
  const body = { verkoop: salesTab, leads: leadsTab, webshop: webshopTab, voorraad: stockTab, ai: aiTab, marketing: marketingTab }[tab](days);
  const pill = (active: boolean) => `rounded-lg border px-4 py-2 text-sm ${active ? 'border-blue-800 bg-blue-800 text-white' : 'hover:bg-accent'}`;
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight"><PreviewText>{"Rapporten"}</PreviewText></h1>
        <p className="text-muted-foreground text-sm"><PreviewText>{"Alles op één plek: kies een onderwerp en een periode."}</PreviewText></p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3">
        <nav className="flex flex-wrap gap-2" aria-label="Rapporten">
          {tabs.map((t) => <Link key={t.id} href={`?tab=${t.id}&dagen=${days}`} className={pill(t.id === tab)} aria-current={t.id === tab ? 'page' : undefined}><PreviewText>{t.label}</PreviewText></Link>)}
        </nav>
        <nav className="flex gap-2" aria-label="Periode">
          {[7, 30, 90].map((d) => <Link key={d} href={`?tab=${tab}&dagen=${d}`} className={pill(d === days)}>{d} <PreviewText>{"dagen"}</PreviewText></Link>)}
        </nav>
      </div>
      {await body}
    </div>
  );
}
