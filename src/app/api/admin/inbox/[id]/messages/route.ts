import { NextResponse } from 'next/server';
import { requireOfficeUserApi } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * One thread's messages, fetched when the office opens it.
 *
 * Lazily, rather than shipping every message of every thread with the page:
 * one ended WhatsApp conversation is twenty-odd transcript turns, so a hundred
 * threads is thousands of rows for the one thread somebody is reading. Same
 * reasoning, and the same shape, as the notes tab on a lead
 * (api/admin/leads/[id]/notes).
 *
 * Through the caller's session client, never the service-role key — the 0062
 * policies are the guard.
 */

const ID = /^[0-9a-f-]{10,40}$/i;

/* One screenful of history. A thread longer than this is a phone call. */
const LIMIT = 300;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireOfficeUserApi();
  if (response) return response;

  const { id } = await params;
  if (!ID.test(id)) {
    return NextResponse.json({ error: 'Ongeldig gespreks-id' }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('inbox_messages')
    .select('id, direction, author, body, attachments, error, created_at')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })
    .limit(LIMIT);

  if (error) {
    console.error('[inbox] berichten laden mislukt:', error.message);
    return NextResponse.json({ error: 'Laden mislukt' }, { status: 500 });
  }

  return NextResponse.json(
    { messages: data ?? [] },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
