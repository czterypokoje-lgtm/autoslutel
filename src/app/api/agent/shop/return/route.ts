import { asText, checkShopAgent } from '@/lib/agentAuth';
import { toE164NL } from '@/lib/phone';
import { sendMail } from '@/lib/email';
import {
  NOT_FOUND, RETURN_LABEL, asCondition, decideReturn, normEmail, orderItems, orderNumberCandidates, ownsOrder, returnConfirmationMail,
} from '@/lib/shopAgent';
import { conversationId, findOrder, json, markReturnRequested, readBody, tellOffice, withinLimits } from '@/lib/shopAgentServer';

export const dynamic = 'force-dynamic';

/**
 * Tool `request_return` of the webshop agent.
 *
 * Body: { order_number, email?, postcode?, condition, reason, items?, customer_name?, customer_phone?, conversation_id, dry_run? }
 * condition is one of ongebruikt | bewerkt | defect (an enum in the tool schema).
 *
 * decideReturn sorts the request by EU/NL consumer law; the agent never
 * refuses, the office judges exceptions. A withdrawal (and every other
 * request) is put on the order, in Gesprekken and Telegram, and confirmed to
 * the order's e-mail with date and time: a withdrawal made in the chat is
 * valid (art. 11 CRD) and wants an acknowledgement on a durable medium.
 *
 * A defect is not a withdrawal: it does not set return_requested_at, so an
 * earlier return never blocks a later warranty report; its own bucket keeps a
 * retried call from reporting it twice.
 *
 * Every answer the agent should read out is a 200 with `say`.
 */
const BUSY = { registered: false, say: 'Mailt u ons op info@autosleutel24.nl met het bestelnummer, dan regelt een collega de retour.' };

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
    return json({ registered: false, say: 'Is het artikel nog ongebruikt (uitpakken en bekijken mag), heeft u het al gebruikt, laten frezen of inleren, of werkt het niet?' });
  }
  const reason = asText(body.reason, 400);
  if (!reason) return json({ registered: false, say: 'Wat is de reden dat u het wilt terugsturen?' });

  const conversation = conversationId(body);
  const allowed = await withinLimits([
    ...(conversation ? [[`return-conv:${conversation}`, 3, 3600] as [string, number, number]] : []),
    ['return-all', 60, 3600],
  ]);
  if (!allowed) return json(BUSY);

  let order;
  try {
    order = await findOrder(candidates);
    if (!order) return json({ registered: false, ...NOT_FOUND });
    if (!(await withinLimits([[`verify:${order.order_number}`, 6, 3600]]))) return json(BUSY);
    if (!ownsOrder(order, body)) return json({ registered: false, ...NOT_FOUND });
  } catch (error) {
    console.error('[shop agent] return lookup failed:', error instanceof Error ? error.message : error);
    return json({ registered: false, service_error: true, say: 'Het registreren lukt nu niet. Mailt u ons op info@autosleutel24.nl met het bestelnummer, dan regelt een collega de retour.' });
  }

  const decision = decideReturn(order, condition);
  if (!decision.register) return json({ registered: false, outcome: decision.outcome, say: decision.say });
  if (body.dry_run === true) return json({ registered: false, dry_run: true, kind: decision.kind, say: decision.say });

  /* The write that makes it a registered request. Everything after it is telling people. */
  try {
    if (decision.kind === 'garantie') {
      if (!(await withinLimits([[`garantie:${order.order_number}`, 1, 86_400]]))) {
        return json({ registered: false, outcome: 'al_aangevraagd', say: 'Deze melding heb ik vandaag al doorgegeven. Een collega neemt contact met u op.' });
      }
    } else if (!(await markReturnRequested(order.order_number, `${decision.kind}: ${condition} — ${reason}`))) {
      return json({ registered: false, outcome: 'al_aangevraagd', say: 'Voor deze bestelling is al een retourverzoek ingediend. Een collega neemt daarover contact met u op.' });
    }
  } catch (error) {
    console.error('[shop agent] return write failed:', error instanceof Error ? error.message : error);
    return json({ registered: false, service_error: true, say: 'Het registreren lukt nu niet. Mailt u ons op info@autosleutel24.nl met het bestelnummer, dan regelt een collega de retour.' });
  }

  let confirmed = false;
  try {
    const to = normEmail(order.email);
    const mail = returnConfirmationMail(order.order_number, decision.kind, new Date());
    confirmed = to ? await sendMail({ to, subject: mail.subject, text: mail.text }) : false;

    const ordered = orderItems(order.items).map((i) => `${i.quantity}× ${i.title}`).join(', ');
    const items = asText(body.items, 300);
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
        confirmed ? 'Bevestiging per e-mail verstuurd.' : 'LET OP: bevestigingsmail niet verstuurd — bevestig de ontvangst zelf per e-mail.',
      ],
      name: asText(body.customer_name, 80),
      email: normEmail(order.email),
      phone: toE164NL(asText(body.customer_phone, 40)),
      conversation,
      meta: { kind: decision.kind, order_number: order.order_number },
    });
  } catch (error) {
    /* Registered on the order (or in the warranty bucket) all the same: the promise stands. */
    console.error('[shop agent] return notify failed:', error instanceof Error ? error.message : error);
  }

  return json({
    registered: true,
    kind: decision.kind,
    say: confirmed ? `${decision.say} U ontvangt hiervan ook een bevestiging per e-mail.` : decision.say,
  });
}
