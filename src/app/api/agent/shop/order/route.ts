import { checkShopAgent } from '@/lib/agentAuth';
import { NOT_FOUND, orderNumberCandidates, orderView, ownsOrder } from '@/lib/shopAgent';
import { conversationId, findOrder, json, readBody, withinLimits } from '@/lib/shopAgentServer';

export const dynamic = 'force-dynamic';

/**
 * Tool `get_order` of the webshop agent: where is my order?
 *
 * Body: { order_number, email?, postcode?, conversation_id }. The order number
 * plus the e-mail or the postcode on the order. A number that does not exist
 * and a number with the wrong e-mail get the same answer.
 *
 * Returns status, items, dates, track & trace and the return window. Never the
 * address, the phone number or what anything cost.
 */
export async function POST(request: Request) {
  const auth = checkShopAgent(request);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  const body = await readBody(request);
  if (!body) return json({ error: 'Ongeldige aanvraag' }, 400);

  const candidates = orderNumberCandidates(body.order_number);
  if (!candidates.length) {
    return json({ found: false, say: 'Wat is het bestelnummer? Het staat in de bevestigingsmail en ziet eruit als AS24-26-K7Q2XM.' });
  }
  if (!body.email && !body.postcode) {
    return json({ found: false, say: 'Om uw bestelling te bekijken heb ik ook het e-mailadres of de postcode van de bestelling nodig.' });
  }

  const conversation = conversationId(body);
  const allowed = await withinLimits([
    [`order:${candidates[0]}`, 6, 3600],
    ...(conversation ? [[`order-conv:${conversation}`, 10, 3600] as [string, number, number]] : []),
    ['order-all', 300, 3600],
  ]);
  if (!allowed) {
    return json({ found: false, say: 'Ik kan deze bestelling nu niet opzoeken. Mailt u ons op info@autosleutel24.nl met het bestelnummer, dan kijkt een collega ernaar.' });
  }

  try {
    const order = await findOrder(candidates);
    if (!order || !ownsOrder(order, body)) return json(NOT_FOUND);
    return json(orderView(order, new Date(), body.postcode));
  } catch (error) {
    console.error('[shop agent] order lookup failed:', error instanceof Error ? error.message : error);
    return json({ found: false, service_error: true, say: 'Ik kan de bestellingen op dit moment niet inzien. Zal ik een collega vragen contact met u op te nemen?' }, 503);
  }
}
