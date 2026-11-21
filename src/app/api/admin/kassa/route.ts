import { getCrmUser } from '@/lib/crmSession';
import { WAREHOUSE } from '@/config/install';
import { CRM_READONLY } from '@/lib/readonly';
import { StockError } from '@/lib/kfcInventory';
import { euroToCents } from '@/lib/money';
import {
  canManagePos, canUsePos, cashMove, closeSession, findReturnable, listClosedSessions, openSession, parseCashMove,
  parseReturn, parseSale, receipt, returnLocations, returnSale, searchArticles, searchCustomers, sell, sessionSummary,
  startSession, storedZReport,
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

/** Integer cents from the body: a number, or a Dutch amount string read by euroToCents. */
function centsField(value: unknown, max: number, message: string): number {
  const n = typeof value === 'string' ? euroToCents(value) : value;
  if (typeof n !== 'number' || !Number.isInteger(n) || n < 0 || n > max) throw new StockError(message);
  return n;
}

/**
 * GET ?q=…            article search / scan
 * GET ?klant=…        customer search
 * GET ?bon=<uuid>     receipt (reprint, also of a return)
 * GET ?retour=…       a till receipt by number / scan, with what can still go back (office only)
 * GET ?locaties=1     locations a return can go to (office only)
 * GET ?sessies=<page> closed sessions with Z-number and differences
 * GET ?z=<sessionId>  one stored Z-report
 * GET                 the open session + its totals (null when the till is closed)
 */
export async function GET(request: Request) {
  const auth = await access();
  if (auth.response) return auth.response;
  const params = new URL(request.url).searchParams;
  const office = canManagePos(auth.user);
  try {
    if (params.has('q')) return Response.json(await searchArticles(params.get('q') ?? ''), { headers: NO_STORE });
    if (params.has('klant')) return Response.json({ customers: await searchCustomers(params.get('klant') ?? '') }, { headers: NO_STORE });
    if (params.has('bon')) return Response.json(await receipt(params.get('bon') ?? ''), { headers: NO_STORE });
    if (params.has('retour') || params.has('locaties')) {
      if (!office) throw new StockError('Een retour mag alleen door kantoor of de eigenaar worden gedaan.', 403);
      if (params.has('locaties')) return Response.json({ locations: await returnLocations() }, { headers: NO_STORE });
      return Response.json(await findReturnable(params.get('retour') ?? ''), { headers: NO_STORE });
    }
    if (params.has('sessies')) {
      const page = Number.parseInt(params.get('sessies') ?? '1', 10);
      return Response.json(await listClosedSessions(Number.isFinite(page) ? page : 1), { headers: NO_STORE });
    }
    if (params.has('z')) return Response.json({ zReport: await storedZReport(params.get('z') ?? '') }, { headers: NO_STORE });
    const session = await openSession();
    return Response.json({ summary: session ? await sessionSummary(session) : null }, { headers: NO_STORE });
  } catch (cause) {
    return failure(cause);
  }
}

/**
 * POST { action: 'open', floatCents }
 * POST { action: 'sell', sessionId, key, lines, payments, customerId?, clientName? }
 * POST { action: 'return', sessionId, key, invoiceId, lines: [{ lineId, quantity }], method, locationId, reason? }  (office)
 * POST { action: 'cash', sessionId, key, direction: 'in' | 'out', amountCents, reason }                      (out: office)
 * POST { action: 'close', sessionId, countedCents, countedPinCents, note? }  → the stored Z-report
 */
export async function POST(request: Request) {
  const auth = await access();
  if (auth.response) return auth.response;
  if (CRM_READONLY) return Response.json({ error: 'Alleen-lezen kopie: de kassa is uitgeschakeld.' }, { status: 423 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body.action !== 'string') return Response.json({ error: 'Ongeldig verzoek' }, { status: 400 });
  const sessionId = typeof body.sessionId === 'string' ? body.sessionId : '';
  const fresh = async () => {
    const session = await openSession();
    return session ? await sessionSummary(session) : null;
  };
  try {
    if (body.action === 'open') {
      const floatCents = centsField(body.floatCents, 10_000_000, 'Ongeldig startbedrag.');
      const session = await startSession(floatCents, auth.user);
      return Response.json({ summary: await sessionSummary(session) }, { headers: NO_STORE });
    }
    if (body.action === 'sell') {
      const result = await sell(sessionId, parseSale(body), auth.user);
      return Response.json({ receipt: result, summary: await fresh() }, { headers: NO_STORE });
    }
    if (body.action === 'return') {
      if (!canManagePos(auth.user)) throw new StockError('Een retour mag alleen door kantoor of de eigenaar worden gedaan.', 403);
      const result = await returnSale(sessionId, parseReturn(body), auth.user);
      return Response.json({ receipt: result, summary: await fresh() }, { headers: NO_STORE });
    }
    if (body.action === 'cash') {
      const input = parseCashMove(body);
      if (input.direction === 'out' && !canManagePos(auth.user)) {
        throw new StockError('Geld uit de kassa halen mag alleen kantoor of de eigenaar.', 403);
      }
      await cashMove(sessionId, input, auth.user);
      return Response.json({ summary: await fresh() }, { headers: NO_STORE });
    }
    if (body.action === 'close') {
      const counted = centsField(body.countedCents, 100_000_000, 'Ongeldig geteld bedrag.');
      const countedPin = centsField(body.countedPinCents, 100_000_000, 'Vul het totaal van de pinautomaat in (0 als er niet gepind is).');
      const note = typeof body.note === 'string' ? body.note.slice(0, 500) : '';
      const closed = await closeSession(sessionId, counted, countedPin, note, auth.user);
      return Response.json({ zReport: await storedZReport(closed.id) }, { headers: NO_STORE });
    }
    return Response.json({ error: 'Onbekende actie' }, { status: 400 });
  } catch (cause) {
    return failure(cause);
  }
}
