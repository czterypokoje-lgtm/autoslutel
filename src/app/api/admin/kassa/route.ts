import { getCrmUser } from '@/lib/crmSession';
import { WAREHOUSE } from '@/config/install';
import { CRM_READONLY } from '@/lib/readonly';
import { StockError } from '@/lib/kfcInventory';
import {
  canUsePos, closeSession, getSession, openSession, parseSale, receipt, searchArticles, searchCustomers,
  sell, sessionSummary, startSession,
} from '@/lib/kfcPos';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' };

async function access() {
  if (!WAREHOUSE) return { response: new Response(null, { status: 404 }) };
  const user = await getCrmUser();
  if (!user) return { response: Response.json({ error: 'Niet ingelogd' }, { status: 401 }) };
  if (!canUsePos(user)) return { response: Response.json({ error: 'Geen toegang tot de kassa' }, { status: 403 }) };
  return { user };
}

function failure(cause: unknown) {
  if (cause instanceof StockError) return Response.json({ error: cause.message }, { status: cause.status, headers: NO_STORE });
  console.error('[kassa]', cause);
  return Response.json({ error: 'Kassa mislukt. Probeer opnieuw.' }, { status: 500, headers: NO_STORE });
}

/**
 * GET ?q=…           article search / scan
 * GET ?klant=…       customer search
 * GET ?bon=<uuid>    receipt (reprint)
 * GET                the open session + its totals (null when the till is closed)
 */
export async function GET(request: Request) {
  const auth = await access();
  if (auth.response) return auth.response;
  const params = new URL(request.url).searchParams;
  try {
    if (params.has('q')) return Response.json(await searchArticles(params.get('q') ?? ''), { headers: NO_STORE });
    if (params.has('klant')) return Response.json({ customers: await searchCustomers(params.get('klant') ?? '') }, { headers: NO_STORE });
    if (params.has('bon')) return Response.json(await receipt(params.get('bon') ?? ''), { headers: NO_STORE });
    const session = await openSession();
    return Response.json({ summary: session ? await sessionSummary(session) : null }, { headers: NO_STORE });
  } catch (cause) {
    return failure(cause);
  }
}

/**
 * POST { action: 'open', floatCents }
 * POST { action: 'sell', sessionId, key, lines, payments, customerId?, clientName? }
 * POST { action: 'close', sessionId, countedCents, note? }  → the Z-report
 */
export async function POST(request: Request) {
  const auth = await access();
  if (auth.response) return auth.response;
  if (CRM_READONLY) return Response.json({ error: 'Alleen-lezen kopie: de kassa is uitgeschakeld.' }, { status: 423 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body.action !== 'string') return Response.json({ error: 'Ongeldig verzoek' }, { status: 400 });
  const sessionId = typeof body.sessionId === 'string' ? body.sessionId : '';
  try {
    if (body.action === 'open') {
      const floatCents = body.floatCents;
      if (typeof floatCents !== 'number' || !Number.isInteger(floatCents) || floatCents < 0 || floatCents > 10_000_000) {
        throw new StockError('Ongeldig startbedrag.');
      }
      const session = await startSession(floatCents, auth.user);
      return Response.json({ summary: await sessionSummary(session) }, { headers: NO_STORE });
    }
    if (body.action === 'sell') {
      const sale = parseSale(body);
      const result = await sell(sessionId, sale, auth.user);
      const session = await openSession();
      return Response.json({ receipt: result, summary: session ? await sessionSummary(session) : null }, { headers: NO_STORE });
    }
    if (body.action === 'close') {
      const counted = body.countedCents;
      if (typeof counted !== 'number' || !Number.isInteger(counted) || counted < 0 || counted > 100_000_000) {
        throw new StockError('Ongeldig geteld bedrag.');
      }
      const note = typeof body.note === 'string' ? body.note.slice(0, 500) : '';
      const closed = await closeSession(sessionId, counted, note, auth.user);
      const fresh = await getSession(closed.id);
      return Response.json({ zReport: await sessionSummary(fresh ?? closed) }, { headers: NO_STORE });
    }
    return Response.json({ error: 'Onbekende actie' }, { status: 400 });
  } catch (cause) {
    return failure(cause);
  }
}
