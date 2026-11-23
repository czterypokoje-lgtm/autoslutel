import { readStaffReport, reportIntents, topicReport, type ReportIntent } from '@/lib/kfcStaffReports';
import { parseStaffQuery } from '@/lib/kfcStaffFilters';
import { getProducts } from '@/lib/catalog';
import { reviewAgentIds } from '../../../../../supabase/functions/_shared/kfcCallReview';
import { askLocalStaffModel, wrongLanguage } from '@/lib/kfcLocalStaffModel';
import { WAREHOUSE } from '@/config/install';
import { requireWarehouseUserApi, seesPrices } from '@/lib/crmSession';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

/*
 * Staff assistant. Read-only: it looks things up and reports, it never writes
 * to the CRM or sends anything to a customer channel. Roles are checked here,
 * on the server, from the signed-in session. Filters come from the
 * deterministic parser in kfcStaffFilters.ts; the local model only picks an
 * intent or answers small talk, and its output never reaches a query.
 */
export async function POST(request: Request) {
  if (!WAREHOUSE) return new Response(null, { status: 404 });
  const { user, response } = await requireWarehouseUserApi();
  if (response) return response;
  const body = await request.json().catch(() => null);
  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  const english = body?.language === 'en';
  const say = (en: string, nl: string) => english ? en : nl;
  const reply = (text: string, href?: string) => Response.json({ text, href }, { headers: { 'Cache-Control': 'no-store' } });
  if (!message || message.length > 600) return new Response(null, { status: 400 });
  const office = seesPrices(user);
  const db = createSupabaseAdminClient();
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Amsterdam' }).format(new Date());
  const query = parseStaffQuery(message, today);

  const summary = /summary|summari[sz]e|samenvatt|görüşme|özet/i.test(message) && !query.reportCue;
  const draft = /draft|concept|taslak/i.test(message);
  const directOrder = message.match(/(?:#|\b(?:order|bestelling|sipariş)\s+#?)(\d{1,20})\b/i)?.[1];
  const directSku = (query.sku ?? (/^(?=.*[a-z])(?=.*\d)[a-z0-9_-]{2,40}$/i.test(message) ? message : '')).toUpperCase();
  const skuLookup = !!directSku && !query.topics.some((topic) => topic !== 'stock') && !query.category && !query.period && !query.periodIssue;
  const catalogCount = /\b(how many|number of|count|total|hoeveel|aantal|totaal)\b/i.test(message)
    && /\b(products?|categories|category|producten?|categorie(?:ën|en)?)\b/i.test(message)
    && (!/\b(stock|voorraad)\b/i.test(message) || /\b(not stock|geen voorraad)\b/i.test(message))
    && !directSku && !query.category && !/\b(?:in|within|per) (?:the )?(?:category|categorie)\b/i.test(message);
  const filtered = !!(query.period || query.periodIssue || query.fulfilment || query.shop || query.channel || query.category || (query.sku && !skuLookup));
  const wantsReport = !summary && !draft && !directOrder && !skuLookup && !catalogCount && query.topics.length > 0 && (query.reportCue || filtered);
  const routed = wantsReport || catalogCount || summary || draft || directOrder || skuLookup ? null :
    await askLocalStaffModel(message, body?.history, english).catch(() => null);

  try {
    const routedReport = (reportIntents as readonly string[]).includes(routed?.intent ?? '') ? routed!.intent as ReportIntent : undefined;
    if (wantsReport || routedReport) {
      if (query.topics.length > 1) {
        const names: Record<string, [string, string]> = { orders: ['orders', 'bestellingen'], stock: ['stock', 'voorraad'], finance: ['finance', 'financiën'], customers: ['customers', 'klanten'], conversations: ['conversations', 'gesprekken'] };
        const list = query.topics.map((topic) => say(...names[topic])).join(say(' or ', ' of '));
        return reply(say(`Which report do you mean: ${list}? I answer one at a time.`, `Welk rapport bedoel je: ${list}? Ik beantwoord er één tegelijk.`));
      }
      if (query.periodIssue === 'year') {
        const words = query.periodWords ?? '';
        const year = Number(today.slice(0, 4));
        return reply(say(`Which year do you mean for “${words}”: ${year} or ${year - 1}?`, `Welk jaar bedoel je bij “${words}”: ${year} of ${year - 1}?`));
      }
      if (query.periodIssue) {
        return reply(say(
          'Which period exactly? For example “October 2026”, “last 30 days” or “2026-11-01 to 2026-11-10”.',
          'Welke periode precies? Bijvoorbeeld “oktober 2026”, “afgelopen 30 dagen” of “2026-11-01 t/m 2026-11-10”.'));
      }
      const intent = query.topics.length === 1 ? topicReport[query.topics[0]] : routedReport!;
      const result = await readStaffReport(intent, english, office, query, today);
      return reply(result.text, result.href);
    }
    if (catalogCount || routed?.intent === 'catalog_count') {
      if (!office) return reply(say('Catalog totals are available to office staff.', 'Catalogustotalen zijn beschikbaar voor kantoormedewerkers.'));
      const products = getProducts('all');
      const categories = new Set(products.map((product) => product.category).filter(Boolean));
      const number = new Intl.NumberFormat(english ? 'en-GB' : 'nl-NL');
      return reply(say(
        `The CRM product catalog contains ${number.format(products.length)} product listings and ${number.format(categories.size)} categories.`,
        `De CRM-productcatalogus bevat ${number.format(products.length)} productvermeldingen en ${number.format(categories.size)} categorieën.`,
      ) + '\n' + say('Source: compiled product catalog (listings, not stock quantities)', 'Bron: gecompileerde productcatalogus (vermeldingen, geen voorraadaantallen)'), '/admin/producten');
    }
    if (summary || routed?.intent === 'summary') {
      if (!office) return reply(say('Conversation summaries are available to office staff.', 'Gesprekssamenvattingen zijn beschikbaar voor kantoormedewerkers.'));
      const agents = reviewAgentIds(process.env.KFC_REVIEW_AGENT_IDS);
      const { data, error } = await db.from('agent_conversations').select('conversation_id,summary')
        .in('metadata->kfc_call_review->>agent_id', agents).not('summary', 'is', null).order('created_at', { ascending: false }).order('id').limit(1);
      if (error) throw error;
      const latest = data?.[0];
      return latest?.summary
        ? reply(say('Latest saved conversation summary: ', 'Laatst opgeslagen gesprekssamenvatting: ') + latest.summary, '/admin/bot-conversations?call=' + encodeURIComponent(latest.conversation_id))
        : reply(say('No conversation summary is available yet.', 'Er is nog geen gesprekssamenvatting beschikbaar.'));
    }

    if (draft || routed?.intent === 'draft') {
      if (!office) return reply(say('Drafts are available to office staff.', 'Concepten zijn beschikbaar voor kantoormedewerkers.'));
      return reply(say('Subject: Your KeyForCars enquiry\n\nHello,\n\nThank you for contacting KeyForCars. Could you share your vehicle make, model, year and, if available, the SKU so we can check the options?\n\nKind regards,\nKeyForCars',
        'Onderwerp: Uw vraag aan KeyForCars\n\nGoedendag,\n\nBedankt voor uw bericht. Kunt u het merk, model, bouwjaar en eventueel de SKU doorgeven? Dan kunnen we de mogelijkheden nakijken.\n\nMet vriendelijke groet,\nKeyForCars'));
    }

    const number = directOrder ?? (routed?.intent === 'order' && /^\d{1,20}$/.test(routed.reference) ? routed.reference : '');
    if (number) {
      const { data, error } = await db.from('kfc_shop_orders').select('id,fulfilment').eq('number', number).limit(2);
      if (error) throw error;
      if (data?.length !== 1) return reply(say('I could not match this to one order. Check the number in Orders.', 'Ik kon geen unieke bestelling vinden. Controleer het nummer bij Bestellingen.'));
      const row = data[0];
      const states: Record<string, [string, string]> = {
        open: ['awaiting dispatch', 'wacht op verzending'], picked: ['items picked', 'artikelen verzameld'],
        shipped: ['marked as shipped in CRM', 'in CRM als verzonden gemarkeerd'],
        external: ['completed in the webshop', 'afgerond in de webshop'], cancelled: ['cancelled', 'geannuleerd'],
      };
      const [en, nl] = states[row.fulfilment] ?? ['status unknown', 'status onbekend'];
      return reply('#' + number + ' · ' + say(en, nl), '/admin/bestellingen/' + row.id);
    }

    const sku = (skuLookup ? directSku : '') || (routed?.intent === 'stock' && /^[a-z0-9_-]{2,40}$/i.test(routed.reference) ? routed.reference.toUpperCase() : '');
    if (sku) {
      const { data, error } = await db.from('kfc_articles')
        .select('code,name,sale_price_cents').eq('sku', sku).limit(2);
      if (error) throw error;
      if (data?.length === 1) {
        const article = data[0];
        const stock = await db.from('kfc_stock_position').select('available').eq('article_code', article.code).maybeSingle();
        const available = stock.data?.available;
        const details = typeof available === 'number' ? say('Available stock: ', 'Beschikbare voorraad: ') + available : say('No stock figure recorded.', 'Geen voorraadstand vastgelegd.');
        const price = office && typeof article.sale_price_cents === 'number' ? ' · ' + new Intl.NumberFormat(english ? 'en-GB' : 'nl-NL', { style: 'currency', currency: 'EUR' }).format(article.sale_price_cents / 100) : '';
        return reply(sku + ' · ' + article.name + price + '\n' + details, '/admin/voorraad/p/' + encodeURIComponent(article.code));
      }
      if (skuLookup) return reply(say(`I could not match SKU ${sku} to one article.`, `Ik kon SKU ${sku} niet aan één artikel koppelen.`), '/admin/voorraad');
    }

    if (routed?.intent === 'chat' && routed.text) {
      return reply(wrongLanguage(routed.text, english)
        ? say('Hello! I can look up orders, stock and reports from the CRM. What would you like to know?', 'Hallo! Ik kan bestellingen, voorraad en rapporten uit het CRM opzoeken. Wat wil je weten?')
        : routed.text);
    }
    if (!routed && !summary && !draft && !directOrder && !skuLookup) return reply(say(
      'The local chat model is temporarily unavailable. You can still ask using “Order #79214”, “SKU ALRC02” or “Order report for October 2026”.',
      'Het lokale chatmodel is tijdelijk niet beschikbaar. Gebruik intussen “Bestelling #79214”, “SKU ALRC02” of “Bestelrapport oktober 2026”.'));
    return reply(office
      ? say('Try “Order #79214”, “Stock for SKU ALRC02”, “Order report for October 2026” or “Summarize the latest conversation”.', 'Probeer “Bestelling #79214”, “Voorraad voor SKU ALRC02”, “Bestelrapport oktober 2026” of “Vat het laatste gesprek samen”.')
      : say('Try “Order #79214”, “Stock for SKU ALRC02” or “Stock report”.', 'Probeer “Bestelling #79214”, “Voorraad voor SKU ALRC02” of “Voorraadrapport”.'));
  } catch {
    return reply(say('CRM data is temporarily unavailable.', 'CRM-gegevens zijn tijdelijk niet beschikbaar.'));
  }
}
