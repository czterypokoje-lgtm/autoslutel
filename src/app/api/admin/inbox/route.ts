import { NextResponse } from 'next/server';
import { requireOfficeUserApi } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { draftReply } from '@/lib/inbox/ai';
import { sendReply } from '@/lib/inbox/send';
import { addMessage, getThread, threadMessages, type AiMode } from '@/lib/inbox/store';

export const dynamic = 'force-dynamic';
/* The model call behind a draft can take a minute; the default limit would cut it off mid-reply. */
export const maxDuration = 120;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_BODY = 4000;
const MODES: AiMode[] = ['off', 'draft', 'auto'];

type Action =
  | { action: 'send'; threadId: string; text: string }
  | { action: 'draft'; threadId: string }
  | { action: 'mode'; threadId: string; mode: AiMode }
  | { action: 'status'; threadId: string; status: 'open' | 'closed' }
  | { action: 'read'; threadId: string };

/**
 * The office's side of the inbox. Reads and writes use the caller's session
 * client, so RLS (0105: owner and kantoor) is the real guard and
 * requireOfficeUserApi the fast one. Sending goes through sendReply, the one
 * place a message leaves the CRM.
 */
export async function POST(request: Request) {
  const { user, response } = await requireOfficeUserApi();
  if (response) return response;
  let body: Action;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 });
  }
  if (!body || typeof body.threadId !== 'string' || !UUID.test(body.threadId)) {
    return NextResponse.json({ error: 'Ongeldig gesprek' }, { status: 400 });
  }
  const db = await createSupabaseServerClient();
  const thread = await getThread(body.threadId, db);
  if (!thread) return NextResponse.json({ error: 'Gesprek niet gevonden' }, { status: 404 });

  switch (body.action) {
    case 'send': {
      const text = typeof body.text === 'string' ? body.text.trim() : '';
      if (!text) return NextResponse.json({ error: 'Leeg bericht' }, { status: 400 });
      if (text.length > MAX_BODY) return NextResponse.json({ error: `Bericht is te lang (max ${MAX_BODY} tekens)` }, { status: 400 });
      const sent = await sendReply(thread, text, user.email ?? 'kantoor', db);
      if (!sent.ok) return NextResponse.json({ error: sent.error }, { status: 422 });
      break;
    }
    case 'draft': {
      const draft = await draftReply(thread, await threadMessages(thread.id, db));
      if (!draft) return NextResponse.json({ error: 'Assistent niet beschikbaar (ANTHROPIC_API_KEY)' }, { status: 503 });
      await db.from('inbox_messages').delete().eq('thread_id', thread.id).eq('status', 'draft');
      if (draft.reply) {
        await addMessage(thread, { direction: 'out', author: 'ai', body: draft.reply, status: 'draft', meta: { reason: draft.reason, needsHuman: draft.needsHuman } }, db);
      }
      return NextResponse.json({ draft, messages: await threadMessages(thread.id, db) }, { headers: { 'Cache-Control': 'no-store' } });
    }
    case 'mode': {
      if (!MODES.includes(body.mode)) return NextResponse.json({ error: 'Ongeldige modus' }, { status: 400 });
      // Owner's rule (7 Nov 2026): no automatic messages to customers unless explicitly switched on.
      if (body.mode === 'auto' && process.env.INBOX_AI_AUTO !== '1') {
        return NextResponse.json({ error: 'Automatisch antwoorden staat uit. De assistent maakt alleen concepten.' }, { status: 403 });
      }
      const { error } = await db.from('inbox_threads').update({ ai_mode: body.mode }).eq('id', thread.id);
      if (error) return NextResponse.json({ error: 'Opslaan mislukt' }, { status: 500 });
      break;
    }
    case 'status': {
      if (body.status !== 'open' && body.status !== 'closed') return NextResponse.json({ error: 'Ongeldige status' }, { status: 400 });
      const { error } = await db.from('inbox_threads').update({ status: body.status, unread: 0 }).eq('id', thread.id);
      if (error) return NextResponse.json({ error: 'Opslaan mislukt' }, { status: 500 });
      break;
    }
    case 'read': {
      await db.from('inbox_threads').update({ unread: 0 }).eq('id', thread.id);
      break;
    }
    default:
      return NextResponse.json({ error: 'Onbekende actie' }, { status: 400 });
  }
  return NextResponse.json({ ok: true, thread: await getThread(thread.id, db), messages: await threadMessages(thread.id, db) }, { headers: { 'Cache-Control': 'no-store' } });
}
