import 'server-only';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { fetchAll } from '@/lib/kfcOrders';

/*
 * Numbers for the Leads dashboard (Studio Admin crm-v1 port). One query for
 * the last twelve months of leads, everything else derived here so the
 * client components only draw.
 */

export interface LeadLite {
  id: string; created_at: string; updated_at: string | null; name: string | null; phone_e164: string | null;
  brand: string | null; model: string | null; service: string | null; location: string | null; postcode: string | null;
  source: string | null; status: string; sale_price: number | string | null; quoted_price: number | string | null; first_contact_at: string | null;
}

export interface LeadsDashboard {
  newLeads: { buckets: { date: string; newLeads: number; disqualified: number }[]; total: number; change: number | null };
  quotes: { buckets: { date: string; proposalsSent: number }[]; total: number };
  revenue6m: { amount: number; change: number | null };
  won6m: { count: number; change: number | null };
  revenueByMonth: { month: string; revenue: number }[];
  revenueYoy: number | null;
  bySource: { source: string; leads: number }[];
  byService: { name: string; actual: number; remaining: number }[];
  funnel: { stage: string; value: number }[];
  regions: { region: string; sales: number; percentage: number; growth: number | null }[];
  actions: { staleNew: number; noContact: number; quietQuotes: number };
  /** Last 15 leads, with the relative time rendered here so server and client agree. */
  recent: (LeadLite & { lastActivity: string })[];
  monthLabel: string;
}

const DAY = 86_400_000;
const num = (v: number | string | null) => { const n = Number(v ?? 0); return Number.isFinite(n) ? n : 0; };
const pct = (now: number, before: number) => (before > 0 ? Math.round(((now - before) / before) * 1000) / 10 : null);
const isDisqualified = (s: string) => s === 'rejected' || s === 'duplicate';

/** "30 min geleden", "2 u geleden", "3 d geleden". */
export function relative(iso: string, now: number) {
  const min = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60_000));
  if (min < 60) return `${min} min geleden`;
  if (min < 24 * 60) return `${Math.round(min / 60)} u geleden`;
  return `${Math.round(min / (24 * 60))} d geleden`;
}

export async function leadsDashboard(now = new Date()): Promise<LeadsDashboard> {
  const supabase = await createSupabaseServerClient();
  // Reach back to 1 Jan last year so the YoY comparison has last year's full Jan-to-now span, not just its tail.
  const since = new Date(now.getFullYear() - 1, 0, 1).toISOString();
  const leads = await fetchAll<LeadLite>((a, b) =>
    supabase.from('leads')
      .select('id, created_at, updated_at, name, phone_e164, brand, model, service, location, postcode, source, status, sale_price, quoted_price, first_contact_at')
      .gte('created_at', since).order('created_at', { ascending: false }).range(a, b),
  );
  const t = now.getTime();
  const ageDays = (l: LeadLite) => (t - new Date(l.created_at).getTime()) / DAY;
  /* Every metric except YoY stays scoped to the trailing 365 days, as before `since` reached back further. */
  const year = leads.filter((l) => ageDays(l) < 365);
  const within = (from: number, to: number) => year.filter((l) => { const d = ageDays(l); return d >= from && d < to; });

  /* 30 days in six 5-day buckets, oldest first, like the template's "1-5 … 26-30". */
  const last30 = within(0, 30);
  const prev30 = within(30, 60);
  const bucketOf = (l: LeadLite) => Math.min(5, Math.floor((30 - ageDays(l)) / 5));
  const labels = ['1-5', '6-10', '11-15', '16-20', '21-25', '26-30'];
  const newBuckets = labels.map((date) => ({ date, newLeads: 0, disqualified: 0 }));
  const quoteBuckets = labels.map((date) => ({ date, proposalsSent: 0 }));
  for (const l of last30) {
    const b = newBuckets[bucketOf(l)];
    if (isDisqualified(l.status)) b.disqualified += 1; else b.newLeads += 1;
    if (l.quoted_price != null) quoteBuckets[bucketOf(l)].proposalsSent += 1;
  }

  const sold = (list: LeadLite[]) => list.filter((l) => l.status === 'sold');
  /* A sale without a recorded sale price counts for its quote; otherwise sold work vanishes from revenue. */
  const price = (l: LeadLite) => num(l.sale_price) || num(l.quoted_price);
  const revenue = (list: LeadLite[]) => sold(list).reduce((s, l) => s + price(l), 0);
  const last6 = within(0, 183);
  const prev6 = within(183, 366);

  /* Twelve calendar months, oldest first. */
  const months: { key: string; month: string; revenue: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, month: d.toLocaleDateString('nl-NL', { month: 'short', year: 'numeric' }), revenue: 0 });
  }
  const byKey = new Map(months.map((m) => [m.key, m]));
  for (const l of sold(year)) {
    const d = new Date(l.created_at);
    const m = byKey.get(`${d.getFullYear()}-${d.getMonth()}`);
    if (m) m.revenue += price(l);
  }
  const ytd = months.filter((m) => m.key.startsWith(`${now.getFullYear()}-`)).reduce((s, m) => s + m.revenue, 0);
  /* YoY needs last year's full span, so this one reads from the full `leads` (back to 1 Jan last year), not `year`. */
  const lastYearSameSpan = revenue(leads.filter((l) => { const d = new Date(l.created_at); return d.getFullYear() === now.getFullYear() - 1 && d.getMonth() <= now.getMonth(); }));

  const count = (list: LeadLite[], key: (l: LeadLite) => string | null | undefined) => {
    const m = new Map<string, number>();
    for (const l of list) { const k = key(l) || 'unknown'; m.set(k, (m.get(k) ?? 0) + 1); }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };
  const sources = count(last30, (l) => l.source);
  const bySource = sources.slice(0, 4).map(([source, leads]) => ({ source, leads }));
  const rest = sources.slice(4).reduce((s, [, n]) => s + n, 0);
  if (rest > 0) bySource.push({ source: 'other', leads: rest });

  const byService = count(year, (l) => l.service).slice(0, 6).map(([name, total]) => {
    const actual = year.filter((l) => (l.service || 'unknown') === name && l.status === 'sold').length;
    return { name: name.length > 22 ? `${name.slice(0, 21)}…` : name, actual, remaining: total - actual };
  });

  const n = (s: string[]) => year.filter((l) => s.includes(l.status)).length;
  const funnel = [
    { stage: 'Leads', value: year.length },
    { stage: 'Gekwalificeerd', value: n(['qualified', 'contacted', 'sold']) },
    { stage: 'Gebeld', value: n(['contacted', 'sold']) },
    { stage: 'Verkocht', value: n(['sold']) },
  ];

  const regionKey = (l: LeadLite) => (l.location || l.postcode?.slice(0, 2) || 'Onbekend').trim();
  const regionNow = new Map<string, number>();
  for (const l of sold(last6)) regionNow.set(regionKey(l), (regionNow.get(regionKey(l)) ?? 0) + price(l));
  const regionBefore = new Map<string, number>();
  for (const l of sold(prev6)) regionBefore.set(regionKey(l), (regionBefore.get(regionKey(l)) ?? 0) + price(l));
  const regionTotal = [...regionNow.values()].reduce((s, v) => s + v, 0);
  const regions = [...regionNow.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([region, sales]) => ({
    region, sales, percentage: regionTotal > 0 ? Math.round((sales / regionTotal) * 100) : 0, growth: pct(sales, regionBefore.get(region) ?? 0),
  }));

  const hours = (iso: string | null) => (iso ? (t - new Date(iso).getTime()) / 3_600_000 : Infinity);
  const actions = {
    staleNew: year.filter((l) => l.status === 'new' && hours(l.created_at) > 1).length,
    noContact: year.filter((l) => (l.status === 'new' || l.status === 'qualified') && !l.first_contact_at && hours(l.created_at) > 24).length,
    quietQuotes: year.filter((l) => l.quoted_price != null && (l.status === 'qualified' || l.status === 'contacted') && hours(l.updated_at ?? l.created_at) > 24 * 7).length,
  };

  return {
    newLeads: { buckets: newBuckets, total: last30.length, change: pct(last30.length, prev30.length) },
    quotes: { buckets: quoteBuckets, total: last30.filter((l) => l.quoted_price != null).length },
    revenue6m: { amount: revenue(last6), change: pct(revenue(last6), revenue(prev6)) },
    won6m: { count: sold(last6).length, change: pct(sold(last6).length, sold(prev6).length) },
    revenueByMonth: months.map(({ month, revenue }) => ({ month, revenue })),
    revenueYoy: pct(ytd, lastYearSameSpan),
    bySource,
    byService,
    funnel,
    regions,
    actions,
    recent: year.slice(0, 15).map((l) => ({ ...l, lastActivity: relative(l.updated_at ?? l.created_at, t) })),
    monthLabel: new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleDateString('nl-NL', { month: 'long' }),
  };
}
