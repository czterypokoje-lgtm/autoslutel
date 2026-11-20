import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

/*
 * The inbox tables (0105), read and written with the service role because the
 * writers are webhooks. The office's own actions go through the session
 * client in /api/admin/inbox, where RLS is the guard.
 */

export type Channel = 'whatsapp' | 'email' | 'form';
export type AiMode = 'off' | 'draft' | 'auto';

export interface Thread {
  id: string;
  channel: Channel;
  phone: string | null;
  email: string | null;
  name: string | null;
  subject: string | null;
  lead_id: string | null;
  status: 'open' | 'closed';
  ai_mode: AiMode;
  last_message_at: string;
  last_inbound_at: string | null;
  last_outbound_at: string | null;
  unread: number;
  external_ref: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  thread_id: string;
  direction: 'in' | 'out';
  author: string;
  body: string;
  status: 'received' | 'draft' | 'sent' | 'delivered' | 'read' | 'failed';
  external_id: string | null;
  message_id: string | null;
  error: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
}

export const THREAD_COLS =
  'id, channel, phone, email, name, subject, lead_id, status, ai_mode, last_message_at, last_inbound_at, last_outbound_at, unread, external_ref, created_at';
export const MESSAGE_COLS = 'id, thread_id, direction, author, body, status, external_id, message_id, error, meta, created_at';

const admin = () => createSupabaseAdminClient();

export const normaliseEmail = (value: string | null | undefined) => {
  const v = (value ?? '').trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? v : null;
};

/** The WhatsApp thread for a number, created on first contact. */
export async function whatsappThread(phone: string, name: string | null, waId: string): Promise<Thread> {
  const db = admin();
  const found = await db.from('inbox_threads').select(THREAD_COLS).eq('channel', 'whatsapp').eq('phone', phone).maybeSingle();
  if (found.data) {
    const t = found.data as Thread;
    /* A closed thread that gets a new message is open again; a name we did not have is worth keeping. */
    const patch: Partial<Thread> = {};
    if (t.status === 'closed') patch.status = 'open';
    if (!t.name && name) patch.name = name;
    if (Object.keys(patch).length) await db.from('inbox_threads').update(patch).eq('id', t.id);
    return { ...t, ...patch };
  }
  const created = await db
    .from('inbox_threads')
    .insert({ channel: 'whatsapp', phone, name, external_ref: waId })
    .select(THREAD_COLS)
    .single();
  if (created.error) {
    /* Two webhooks for a brand-new number can race on the unique index; the loser re-reads. */
    const again = await db.from('inbox_threads').select(THREAD_COLS).eq('channel', 'whatsapp').eq('phone', phone).single();
    if (again.error) throw new Error(`inbox thread: ${created.error.message}`);
    return again.data as Thread;
  }
  return created.data as Thread;
}

/**
 * The e-mail thread a message belongs to: the one whose messages it references,
 * else an open thread with the same sender from the last 30 days, else new.
 */
export async function emailThread(input: {
  email: string;
  name: string | null;
  subject: string | null;
  messageId: string | null;
  references: string[];
}): Promise<Thread> {
  const db = admin();
  const refs = [...new Set(input.references.filter(Boolean))];
  if (refs.length) {
    const hit = await db.from('inbox_messages').select('thread_id').in('message_id', refs).limit(1).maybeSingle();
    if (hit.data?.thread_id) {
      const t = await db.from('inbox_threads').select(THREAD_COLS).eq('id', hit.data.thread_id).maybeSingle();
      if (t.data) {
        if ((t.data as Thread).status === 'closed') await db.from('inbox_threads').update({ status: 'open' }).eq('id', t.data.id);
        return { ...(t.data as Thread), status: 'open' };
      }
    }
  }
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const recent = await db
    .from('inbox_threads')
    .select(THREAD_COLS)
    .eq('channel', 'email')
    .eq('email', input.email)
    .eq('status', 'open')
    .gte('last_message_at', since)
    .order('last_message_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (recent.data) return recent.data as Thread;
  const created = await db
    .from('inbox_threads')
    .insert({ channel: 'email', email: input.email, name: input.name, subject: input.subject, external_ref: input.messageId })
    .select(THREAD_COLS)
    .single();
  if (created.error) throw new Error(`inbox thread: ${created.error.message}`);
  return created.data as Thread;
}

/** A website form is its own thread, linked to the lead it just made. */
export async function formThread(input: {
  leadId: string | null;
  phone: string | null;
  email: string | null;
  name: string | null;
  subject: string;
}): Promise<Thread> {
  const created = await admin()
    .from('inbox_threads')
    .insert({ channel: 'form', lead_id: input.leadId, phone: input.phone, email: input.email, name: input.name, subject: input.subject })
    .select(THREAD_COLS)
    .single();
  if (created.error) throw new Error(`inbox thread: ${created.error.message}`);
  return created.data as Thread;
}

/**
 * Store one message. Returns null when the provider id was seen before (a
 * retried webhook), so the caller does nothing twice.
 */
export async function addMessage(
  thread: Pick<Thread, 'id'>,
  message: {
    direction: 'in' | 'out';
    author: string;
    body: string;
    status?: Message['status'];
    external_id?: string | null;
    message_id?: string | null;
    meta?: Record<string, unknown> | null;
  },
  db: SupabaseClient = admin()
): Promise<Message | null> {
  const { data, error } = await db
    .from('inbox_messages')
    .insert({ thread_id: thread.id, status: message.direction === 'in' ? 'received' : 'sent', ...message })
    .select(MESSAGE_COLS)
    .single();
  if (error) {
    if (error.code === '23505') return null;
    throw new Error(`inbox message: ${error.message}`);
  }
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { last_message_at: now, updated_at: now };
  if (message.direction === 'in') patch.last_inbound_at = now;
  if (message.direction === 'out' && message.status !== 'draft') {
    patch.last_outbound_at = now;
    patch.unread = 0;
  }
  await db.from('inbox_threads').update(patch).eq('id', thread.id);
  if (message.direction === 'in') {
    const bump = await admin().rpc('inbox_bump_unread', { p_thread: thread.id });
    if (bump.error) console.error('[inbox] unread bump failed:', bump.error.message);
  }
  return data as Message;
}

export async function setMessageStatus(externalId: string, status: Message['status'], error?: string | null) {
  await admin().from('inbox_messages').update({ status, error: error ?? null }).eq('external_id', externalId);
}

/** Match the thread to a lead by phone or e-mail, newest lead first. */
export async function linkLead(thread: Thread): Promise<string | null> {
  if (thread.lead_id) return thread.lead_id;
  const db = admin();
  const ors: string[] = [];
  if (thread.phone) ors.push(`phone_e164.eq.${thread.phone}`, `phone.ilike.%${thread.phone.slice(-9)}`);
  if (thread.email) ors.push(`email.ilike.${thread.email}`);
  if (!ors.length) return null;
  const { data } = await db.from('leads').select('id').or(ors.join(',')).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (!data?.id) return null;
  await db.from('inbox_threads').update({ lead_id: data.id }).eq('id', thread.id);
  return String(data.id);
}

export async function threadMessages(threadId: string, db: SupabaseClient = admin()): Promise<Message[]> {
  const { data, error } = await db.from('inbox_messages').select(MESSAGE_COLS).eq('thread_id', threadId).order('created_at', { ascending: true }).limit(500);
  if (error) throw new Error(`inbox messages: ${error.message}`);
  return (data ?? []) as Message[];
}

export async function getThread(threadId: string, db: SupabaseClient = admin()): Promise<Thread | null> {
  const { data } = await db.from('inbox_threads').select(THREAD_COLS).eq('id', threadId).maybeSingle();
  return (data as Thread | null) ?? null;
}

/** Threads for the screen, newest first, each with its messages. */
export async function listThreads(db: SupabaseClient, limit = 100): Promise<(Thread & { messages: Message[] })[]> {
  const { data, error } = await db.from('inbox_threads').select(THREAD_COLS).order('last_message_at', { ascending: false }).limit(limit);
  if (error) throw new Error(`inbox threads: ${error.message}`);
  const threads = (data ?? []) as Thread[];
  if (!threads.length) return [];
  const { data: msgs } = await db
    .from('inbox_messages')
    .select(MESSAGE_COLS)
    .in('thread_id', threads.map((t) => t.id))
    .order('created_at', { ascending: true })
    .limit(limit * 40);
  const byThread = new Map<string, Message[]>();
  for (const m of (msgs ?? []) as Message[]) {
    const list = byThread.get(m.thread_id) ?? [];
    list.push(m);
    byThread.set(m.thread_id, list);
  }
  return threads.map((t) => ({ ...t, messages: byThread.get(t.id) ?? [] }));
}
