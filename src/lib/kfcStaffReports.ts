import 'server-only';

import { reviewAgentIds } from '../../supabase/functions/_shared/kfcCallReview';
import { DEMO_BOT_AGENT } from '@/lib/kfcDemoBotRules';
import { fetchAll } from '@/lib/kfcOrders';
import { addDays, periodBounds, type StaffFulfilment, type StaffPeriod, type StaffQuery, type StaffTopic } from '@/lib/kfcStaffFilters';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/*
 * Read-only reports for the staff assistant. Every query here is a fixed
 * PostgREST call with fixed columns; filters arrive already parsed and are
 * either enums or matched against CRM values first. Nothing writes.
 */

export const reportIntents = ['order_report', 'stock_report', 'finance_report', 'customer_report', 'conversation_report'] as const;
export type ReportIntent = typeof reportIntents[number];
export const topicReport: Record<StaffTopic, ReportIntent> = {
  orders: 'order_report', stock: 'stock_report', finance: 'finance_report', customers: 'customer_report', conversations: 'conversation_report',
};

type Filter = 'period' | 'shop' | 'fulfilment' | 'sku' | 'category' | 'channel';
const supported: Record<ReportIntent, Filter[]> = {
  order_report: ['period', 'shop', 'fulfilment', 'sku', 'category'],
  stock_report: ['category'],
  finance_report: ['period'],
  customer_report: ['period'],
  conversation_report: ['period', 'channel'],
};
const filterNames: Record<Filter, [string, string]> = {
  period: ['period', 'periode'], shop: ['store', 'winkel'], fulfilment: ['order status', 'bestelstatus'],
  sku: ['SKU', 'SKU'], category: ['category', 'categorie'], channel: ['channel', 'kanaal'],
};
const reportNames: Record<ReportIntent, [string, string]> = {
  order_report: ['order report', 'bestelrapport'], stock_report: ['stock report', 'voorraadrapport'],
  finance_report: ['finance report', 'financieel overzicht'], customer_report: ['customer count', 'klantentelling'],
  conversation_report: ['conversation report', 'gespreksrapport'],
};
const statusNames: Record<StaffFulfilment, [string, string]> = {
  open: ['open (not picked)', 'open (niet verzameld)'], picked: ['picked', 'verzameld'],
  shipped: ['marked as shipped in CRM', 'in CRM als verzonden gemarkeerd'], cancelled: ['cancelled', 'geannuleerd'],
  external: ['completed in the webshop', 'afgerond in de webshop'],
};
const channelNames = { phone: ['phone calls', 'telefoongesprekken'], whatsapp: ['WhatsApp chats', 'WhatsApp-gesprekken'], email: ['emails', 'e-mails'], web: ['web chats', 'webchats'] } as const;

type Result = { text: string; href?: string };
type Db = ReturnType<typeof createSupabaseAdminClient>;

/** Exact (case-insensitive) category match, else a unique partial match. Several candidates → ask. */
async function resolveCategory(db: Db, term: string): Promise<{ category: string } | { options: string[] }> {
  const rows = await fetchAll<{ category: string }>((from, to) => db.from('kfc_articles').select('category').neq('category', '').order('code').range(from, to));
  const all = [...new Set(rows.map((row) => row.category))];
  const wanted = term.toLocaleLowerCase('nl');
  const exact = all.find((name) => name.toLocaleLowerCase('nl') === wanted);
  if (exact) return { category: exact };
  const partial = all.filter((name) => name.toLocaleLowerCase('nl').includes(wanted)).sort((a, b) => a.length - b.length || a.localeCompare(b));
  return partial.length === 1 ? { category: partial[0] } : { options: partial.slice(0, 6) };
}

async function categoryCodes(db: Db, category: string) {
  const rows = await fetchAll<{ code: string }>((from, to) => db.from('kfc_articles').select('code').eq('category', category).order('code').range(from, to));
  return rows.map((row) => row.code);
}

const chunks = <T,>(items: T[], size = 150) => Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, (i + 1) * size));
const likeExact = (value: string) => value.replace(/[\\%_]/g, (c) => '\\' + c);

export async function readStaffReport(intent: ReportIntent, english: boolean, office: boolean, query: StaffQuery, today: string): Promise<Result> {
  const say = (en: string, nl: string) => english ? en : nl;
  const pick = (pair: readonly [string, string] | readonly string[]) => english ? pair[0] : pair[1];
  if (!office && intent !== 'stock_report') {
    return { text: say('This report is available to office staff.', 'Dit rapport is beschikbaar voor kantoormedewerkers.') };
  }

  const present: Filter[] = (['period', 'shop', 'fulfilment', 'sku', 'category', 'channel'] as const)
    .filter((key) => key === 'period' ? !!(query.period || query.periodIssue) : !!query[key]);
  const unsupported = present.filter((key) => !supported[intent].includes(key));
  if (unsupported.length) {
    const names = unsupported.map((key) => pick(filterNames[key])).join(', ');
    const snapshot = intent === 'stock_report' && unsupported.includes('period')
      ? say(' Stock is a current snapshot.', ' Voorraad is een actuele stand.') : '';
    return { text: say(
      `The ${pick(reportNames[intent])} cannot be filtered by ${names}.${snapshot} Ask again without it, or open the CRM screen.`,
      `Het ${pick(reportNames[intent])} kan niet gefilterd worden op ${names}.${snapshot} Vraag het opnieuw zonder die filter, of open het CRM-scherm.`,
    ) };
  }

  const locale = english ? 'en-GB' : 'nl-NL';
  const number = (value: number) => new Intl.NumberFormat(locale).format(value);
  const money = (cents: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(cents / 100);
  const date = (value: string) => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value + 'T00:00:00Z'));
  const span = (period: StaffPeriod) => period.from === period.to ? date(period.from) : `${date(period.from)} – ${date(period.to)}`;
  const meta = (source: string, period: string | null, extra: string[] = []) =>
    [say('Source: ', 'Bron: ') + source, ...(period ? [say('Period: ', 'Periode: ') + period] : []), ...extra].join(' · ');
  const db = createSupabaseAdminClient();

  if (intent === 'order_report') {
    const period = query.period ?? { from: addDays(today, -6), to: today };
    const periodText = query.period ? span(period) : say('last 7 calendar days, ', 'afgelopen 7 kalenderdagen, ') + span(period) + say(' (no period given)', ' (geen periode opgegeven)');
    const { from, until } = periodBounds(period);
    let category: string | undefined;
    if (query.category) {
      const found = await resolveCategory(db, query.category);
      if ('options' in found) return { text: found.options.length
        ? say(`Which category do you mean: ${found.options.join(', ')}?`, `Welke categorie bedoel je: ${found.options.join(', ')}?`)
        : say(`No category matches “${query.category}”.`, `Geen categorie komt overeen met “${query.category}”.`) };
      category = found.category;
    }

    const byStatus = new Map<StaffFulfilment, number>();
    let total = 0;
    if (query.sku || category) {
      const codes = category ? await categoryCodes(db, category) : [];
      const orders = new Map<string, StaffFulfilment>();
      for (const part of category ? chunks(codes) : [null]) {
        const rows = await fetchAll<{ order_id: string; kfc_shop_orders: { fulfilment: StaffFulfilment } | { fulfilment: StaffFulfilment }[] }>((a, b) => {
          let lines = db.from('kfc_shop_order_lines').select('order_id, kfc_shop_orders!inner(fulfilment)')
            .gte('kfc_shop_orders.created_at', from.toISOString()).lt('kfc_shop_orders.created_at', until.toISOString());
          if (query.shop) lines = lines.eq('kfc_shop_orders.shop', query.shop);
          if (query.sku) lines = lines.ilike('sku', likeExact(query.sku));
          if (part) lines = lines.in('article_code', part);
          return lines.order('id').range(a, b);
        });
        for (const row of rows) {
          const parent = Array.isArray(row.kfc_shop_orders) ? row.kfc_shop_orders[0] : row.kfc_shop_orders;
          if (parent) orders.set(row.order_id, parent.fulfilment);
        }
      }
      total = orders.size;
      for (const value of orders.values()) byStatus.set(value, (byStatus.get(value) ?? 0) + 1);
    } else {
      const count = (status?: StaffFulfilment) => {
        let orders = db.from('kfc_shop_orders').select('id', { count: 'exact', head: true })
          .gte('created_at', from.toISOString()).lt('created_at', until.toISOString());
        if (query.shop) orders = orders.eq('shop', query.shop);
        if (status) orders = orders.eq('fulfilment', status);
        return orders;
      };
      const statuses: StaffFulfilment[] = ['open', 'picked', 'shipped', 'cancelled', 'external'];
      const results = await Promise.all([count(), ...statuses.map((status) => count(status))]);
      if (results.some((result) => result.error)) throw Error('Order counts unavailable');
      total = results[0].count ?? 0;
      statuses.forEach((status, i) => byStatus.set(status, results[i + 1].count ?? 0));
    }

    const n = (status: StaffFulfilment) => byStatus.get(status) ?? 0;
    const extra = [
      ...(query.shop ? [say('Store: ', 'Winkel: ') + query.shop] : []),
      ...(query.sku ? ['SKU: ' + query.sku] : []),
      ...(category ? [say('Category: ', 'Categorie: ') + category] : []),
    ];
    const params = new URLSearchParams({ ...(query.shop ? { shop: query.shop } : {}), ...(query.fulfilment?.length === 1 && query.fulfilment[0] === 'shipped' ? { status: 'dispatched' } : {}) });
    const href = '/admin/orders' + (params.size ? '?' + params : '');
    let sentence: string;
    if (query.fulfilment) {
      const awaiting = query.fulfilment.length === 2 && query.fulfilment.includes('open') && query.fulfilment.includes('picked');
      const label = awaiting ? say('awaiting dispatch', 'wachten op verzending') : query.fulfilment.map((status) => pick(statusNames[status])).join(say(' or ', ' of '));
      const matched = query.fulfilment.reduce((sum, status) => sum + n(status), 0);
      sentence = say(`${number(matched)} of ${number(total)} orders: ${label}.`, `${number(matched)} van ${number(total)} bestellingen: ${label}.`);
    } else {
      sentence = say(
        `${number(total)} orders received, ${number(n('open') + n('picked'))} awaiting dispatch, ${number(n('shipped'))} marked as shipped.`,
        `${number(total)} bestellingen ontvangen, ${number(n('open') + n('picked'))} wachten op verzending, ${number(n('shipped'))} staan als verzonden geregistreerd.`,
      );
    }
    return { text: sentence + '\n' + meta(say('CRM orders (order date, Amsterdam time)', 'CRM-bestellingen (besteldatum, Amsterdamse tijd)'), periodText, extra), href };
  }

  if (intent === 'stock_report') {
    if (query.category) {
      const found = await resolveCategory(db, query.category);
      if ('options' in found) return { text: found.options.length
        ? say(`Which category do you mean: ${found.options.join(', ')}?`, `Welke categorie bedoel je: ${found.options.join(', ')}?`)
        : say(`No category matches “${query.category}”.`, `Geen categorie komt overeen met “${query.category}”.`), href: '/admin/voorraad' };
      const codes = await categoryCodes(db, found.category);
      let positive = 0;
      for (const part of chunks(codes)) {
        const { count, error } = await db.from('kfc_stock_position').select('article_code', { count: 'exact', head: true }).in('article_code', part).gt('available', 0);
        if (error) throw Error('Stock counts unavailable');
        positive += count ?? 0;
      }
      return { text: say(
        `Category “${found.category}”: ${number(codes.length)} article records, ${number(positive)} with positive available stock.`,
        `Categorie “${found.category}”: ${number(codes.length)} artikelen, bij ${number(positive)} is voorraad beschikbaar.`,
      ) + '\n' + meta(say('CRM inventory (current stock position)', 'CRM-voorraad (actuele stand)'), null), href: '/admin/voorraad' };
    }
    const [items, positions] = await Promise.all([
      db.from('kfc_articles').select('code', { count: 'exact', head: true }),
      db.from('kfc_stock_position').select('article_code', { count: 'exact', head: true }).gt('available', 0),
    ]);
    if (items.error || positions.error) throw Error('Stock counts unavailable');
    return { text: say(
      `Inventory contains ${number(items.count ?? 0)} article records. ${number(positions.count ?? 0)} have positive available stock.`,
      `De voorraadadministratie bevat ${number(items.count ?? 0)} artikelen. Bij ${number(positions.count ?? 0)} artikelen is voorraad beschikbaar.`,
    ) + '\n' + meta(say('CRM inventory (current stock position)', 'CRM-voorraad (actuele stand)'), null), href: '/admin/voorraad' };
  }

  if (intent === 'customer_report') {
    let customers = db.from('kfc_customers').select('id', { count: 'exact', head: true }).is('merged_into', null).is('anonymised_at', null);
    if (query.period) {
      const { from, until } = periodBounds(query.period);
      customers = customers.gte('created_at', from.toISOString()).lt('created_at', until.toISOString());
    }
    const { count, error } = await customers;
    if (error) throw Error('Customer counts unavailable');
    return { text: (query.period
      ? say(`${number(count ?? 0)} customer accounts were created.`, `Er zijn ${number(count ?? 0)} klantaccounts aangemaakt.`)
      : say(`There are ${number(count ?? 0)} customer accounts.`, `Er zijn ${number(count ?? 0)} klantaccounts.`))
      + '\n' + meta(say('CRM customer accounts', 'CRM-klantaccounts'), query.period ? span(query.period) : say('all', 'alles')), href: '/admin/klanten' };
  }

  if (intent === 'finance_report') {
    const session = await createSupabaseServerClient();
    const period = query.period ?? { from: today.slice(0, 7) + '-01', to: today };
    const [invoices, expenses] = await Promise.all([
      fetchAll<{ open_cents: number; due_date: string | null }>((from, to) => {
        let rows = db.from('kfc_invoice_open').select('open_cents,due_date').eq('entry_type', 'invoice').gt('open_cents', 0);
        if (query.period) rows = rows.gte('entry_date', period.from).lte('entry_date', period.to);
        return rows.order('entry_id').range(from, to);
      }),
      fetchAll<{ amount: number }>((from, to) => session.from('expenses').select('amount').eq('status', 'paid').gte('date_incurred', period.from).lte('date_incurred', period.to).order('id').range(from, to)),
    ]);
    if (invoices.length >= 50000 || expenses.length >= 50000) throw Error('Finance query reached its row limit');
    const overdue = invoices.filter((row) => row.due_date && row.due_date < today);
    const open = invoices.reduce((sum, row) => sum + Number(row.open_cents), 0);
    const late = overdue.reduce((sum, row) => sum + Number(row.open_cents), 0);
    const paid = expenses.reduce((sum, row) => sum + Math.round(Number(row.amount) * 100), 0);
    const invoiceScope = query.period ? say(' dated in this period', ' gedateerd in deze periode') : '';
    return { text: say(
      `${number(invoices.length)} open customer invoices${invoiceScope} (${money(open)}), including ${number(overdue.length)} overdue today (${money(late)}). Expenses paid by expense date: ${money(paid)}.`,
      `${number(invoices.length)} openstaande klantfacturen${invoiceScope} (${money(open)}), waarvan ${number(overdue.length)} vandaag vervallen (${money(late)}). Betaalde uitgaven op uitgavedatum: ${money(paid)}.`,
    ) + '\n' + meta(say('CRM invoices and expenses', 'CRM-facturen en uitgaven'), query.period ? span(period) : say('month to date, ', 'deze maand tot nu, ') + span(period)), href: '/admin/financien' };
  }

  const agents = reviewAgentIds(process.env.KFC_REVIEW_AGENT_IDS);
  if (process.env.KFC_DEMO_MODE === '1') agents.push(DEMO_BOT_AGENT);
  const bounds = query.period ? periodBounds(query.period) : null;
  const countChannel = (channel: keyof typeof channelNames) => {
    let rows = db.from('agent_conversations').select('conversation_id', { count: 'exact', head: true })
      .in('metadata->kfc_call_review->>agent_id', agents).eq('channel', channel);
    if (bounds) rows = rows.gte('created_at', bounds.from.toISOString()).lt('created_at', bounds.until.toISOString());
    return rows;
  };
  const channels: (keyof typeof channelNames)[] = query.channel ? [query.channel] : ['phone', 'whatsapp'];
  const counts = await Promise.all(channels.map(countChannel));
  if (counts.some((result) => result.error)) throw Error('Conversation counts unavailable');
  const parts = channels.map((channel, i) => `${number(counts[i].count ?? 0)} ${pick(channelNames[channel])}`).join(say(' and ', ' en '));
  const href = '/admin/bot-conversations' + (query.channel === 'phone' || query.channel === 'whatsapp' ? '?channel=' + query.channel : '');
  return { text: say(`Saved conversations: ${parts}.`, `Opgeslagen gesprekken: ${parts}.`)
    + '\n' + meta(say('saved bot conversations (start date, Amsterdam time)', 'opgeslagen botgesprekken (startdatum, Amsterdamse tijd)'), query.period ? span(query.period) : say('all saved', 'alle opgeslagen')), href };
}
