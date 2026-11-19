import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { getCrmUser } from '@/lib/crmSession';

export const dynamic = 'force-dynamic';

/**
 * A photo attached to a chat message.
 *
 * The client always converts to WebP before this is called (toWebp.ts), so
 * only WebP is accepted here — anything else means the client-side step was
 * skipped, not a format this app should be storing. Who may actually post it
 * into a channel is decided by chat_messages' RLS at the sendMessage() insert
 * that follows this upload, same as job photos: the blob itself is just an
 * unguessable URL, gated on nothing stronger than being a signed-in CRM user.
 */

const MAX_BYTES = 12 * 1024 * 1024; // 12 MB — modern phone photos are large

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const user = await getCrmUser();
  if (!user?.role) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
  }

  const channelId = new URL(request.url).searchParams.get('channel') ?? '';
  if (!UUID.test(channelId)) {
    return NextResponse.json({ error: 'Ongeldig kanaal' }, { status: 400 });
  }

  const contentType = (request.headers.get('content-type') || '').split(';')[0]!.trim().toLowerCase();
  if (contentType !== 'image/webp') {
    return NextResponse.json({ error: 'Alleen WebP-afbeeldingen' }, { status: 415 });
  }

  const declared = Number(request.headers.get('content-length') ?? '0');
  if (declared > MAX_BYTES) {
    return NextResponse.json({ error: 'Foto is te groot' }, { status: 413 });
  }

  const body = await request.arrayBuffer();
  if (body.byteLength === 0) {
    return NextResponse.json({ error: 'Lege upload' }, { status: 400 });
  }
  if (body.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: 'Foto is te groot' }, { status: 413 });
  }

  if (!process.env.bbauto_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: 'Foto-opslag is niet geconfigureerd' }, { status: 503 });
  }

  try {
    const blob = await put(`chat/${channelId}/${Date.now()}.webp`, body, {
      access: 'public',
      contentType,
      token: process.env.bbauto_READ_WRITE_TOKEN,
    });
    return NextResponse.json({ url: blob.url }, { status: 201 });
  } catch (error) {
    console.error('Chat photo upload failed:', error);
    return NextResponse.json({ error: 'Uploaden mislukt' }, { status: 500 });
  }
}
