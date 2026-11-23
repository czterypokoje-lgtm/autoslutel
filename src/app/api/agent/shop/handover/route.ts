import { asText, checkShopAgent } from '@/lib/agentAuth';
import { toE164NL } from '@/lib/phone';
import { ROUTES, handoverSay, isRoute, normEmail, orderNumberCandidates } from '@/lib/shopAgent';
import { json, readBody, tellOffice } from '@/lib/shopAgentServer';

export const dynamic = 'force-dynamic';

/**
 * Tool `handover` of the webshop agent: the answer is a person.
 *
 * Body: { route, summary, customer_name?, email?, customer_phone?, order_number?, dry_run? }
 * route is one of ROUTES in src/lib/shopAgent.ts. Which label the office sees
 * is decided here; nothing here rings a phone (a webshop question is never a
 * night-time emergency). Someone who needs a technician now is transferred to
 * the phone agent in the console, not through this route.
 */
export async function POST(request: Request) {
  const auth = checkShopAgent(request);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  const body = await readBody(request);
  if (!body) return json({ error: 'Ongeldige aanvraag' }, 400);
  if (!isRoute(body.route)) return json({ error: `route moet een van deze zijn: ${Object.keys(ROUTES).join(', ')}` }, 400);

  const route = body.route;
  const summary = asText(body.summary, 600) ?? 'Geen samenvatting meegegeven.';
  const name = asText(body.customer_name, 80);
  const email = normEmail(body.email);
  const phone = toE164NL(asText(body.customer_phone, 40));
  const orderNumber = orderNumberCandidates(body.order_number)[0] ?? null;

  if (!email && !phone) return json({ handed_over: false, say: handoverSay(route, false, false) });
  if (body.dry_run === true) return json({ handed_over: false, dry_run: true, label: ROUTES[route].label, say: ROUTES[route].say });

  const { reached } = await tellOffice({
    label: ROUTES[route].label,
    subject: orderNumber ? `${ROUTES[route].subject} ${orderNumber}` : ROUTES[route].subject,
    lines: [orderNumber ? `Bestelling: ${orderNumber} (niet geverifieerd)` : null, summary],
    name, email, phone,
    meta: { route, order_number: orderNumber },
  });
  return json({ handed_over: reached, say: handoverSay(route, reached, true) });
}
