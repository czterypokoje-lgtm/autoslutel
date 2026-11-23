import { asText, checkShopAgent } from '@/lib/agentAuth';
import { rateLimit } from '@/lib/rateLimit';
import { toE164NL } from '@/lib/phone';
import {
  NOT_FOUND, RETURN_LABEL, asCondition, decideReturn, normEmail, orderItems, orderNumberCandidates, ownsOrder,
} from '@/lib/shopAgent';
import { findOrder, json, markReturnRequested, readBody, tellOffice } from '@/lib/shopAgentServer';

export const dynamic = 'force-dynamic';

/**
 * Tool `request_return` of the webshop agent.
 *
 * Body: { order_number, email?, postcode?, condition, reason, items?, customer_name?, customer_phone?, dry_run? }
 *
 * Registers the request on the order (return_requested_at, return_reason) and
 * puts it in Gesprekken and Telegram. It does not accept or refuse a return
 * and it promises no refund: decideReturn sorts it into retour, garantie or
 * beoordeling, and the office answers by e-mail with the return address and
 * what happens next. dry_run checks everything and writes nothing.
 */
export async function POST(request: Request) {
  const auth = checkShopAgent(request);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  const body = await readBody(request);
  if (!body) return json({ error: 'Ongeldige aanvraag' }, 400);

  const candidates = orderNumberCandidates(body.order_number);
  if (!candidates.length || (!body.email && !body.postcode)) {
    return json({ registered: false, say: 'Ik heb het bestelnummer en het e-mailadres of de postcode van de bestelling nodig.' });
  }
  const condition = asCondition(body.condition);
  if (!condition) {
    return json({ registered: false, say: 'Is het artikel nog ongebruikt en in de verpakking, is het geopend, is het gefreesd of geprogrammeerd, of is het defect?' });
  }
  const reason = asText(body.reason, 400);
  if (!reason) return json({ registered: false, say: 'Wat is de reden dat u het wilt terugsturen?' });

  const limit = await rateLimit(`shop-order:${candidates[0]}`, 6, 3600);
  if (!limit.ok) return json({ registered: false, say: 'Mailt u ons op info@autosleutel24.nl met het bestelnummer, dan regelt een collega de retour.' });

  try {
    const order = await findOrder(candidates);
    if (!order || !ownsOrder(order, body)) return json({ registered: false, ...NOT_FOUND });

    const decision = decideReturn(order, condition);
    if (!decision.register) return json({ registered: false, outcome: decision.outcome, say: decision.say });

    const items = asText(body.items, 300);
    if (body.dry_run === true) return json({ registered: false, dry_run: true, kind: decision.kind, say: decision.say });

    const written = await markReturnRequested(order.order_number, `${decision.kind}: ${condition} — ${reason}`);
    if (!written) {
      return json({ registered: false, outcome: 'al_aangevraagd', say: 'Voor deze bestelling is al een retourverzoek ingediend. Een collega neemt daarover contact met u op.' });
    }

    const ordered = orderItems(order.items).map((i) => `${i.quantity}× ${i.title}`).join(', ');
    await tellOffice({
      label: RETURN_LABEL[decision.kind],
      subject: `Retour ${order.order_number}`,
      lines: [
        `Bestelling: ${order.order_number} (${order.status})`,
        ordered ? `Besteld: ${ordered}` : null,
        items ? `Terug: ${items}` : null,
        `Staat: ${condition}`,
        `Reden: ${reason}`,
        order.delivered_at ? `Bezorgd: ${order.delivered_at.slice(0, 10)}` : 'Bezorgdatum onbekend',
      ],
      name: asText(body.customer_name, 80),
      email: normEmail(order.email),
      phone: toE164NL(asText(body.customer_phone, 40)),
      meta: { kind: decision.kind, order_number: order.order_number },
    });
    /* The request is on the order whether or not Telegram worked: the promise stands. */
    return json({ registered: true, kind: decision.kind, say: decision.say });
  } catch (error) {
    console.error('[shop agent] return failed:', error instanceof Error ? error.message : error);
    return json({ registered: false, service_error: true, say: 'Het registreren lukt nu niet. Mailt u ons op info@autosleutel24.nl met het bestelnummer, dan regelt een collega de retour.' }, 503);
  }
}
