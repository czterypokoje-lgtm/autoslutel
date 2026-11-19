import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { getCrmUser } from '@/lib/crmSession';

export const dynamic = 'force-dynamic';

/**
 * A photo on a marketplace listing. Same shape as the chat upload route —
 * WebP-only since the client always converts first, blob URL is unguessable,
 * real access control lives in marketplace_listings' RLS on the row itself.
 */

const MAX_BYTES = 12 * 1024 * 1024;

export async function POST(request: Request) {
  const user = await getCrmUser();
  if (!user?.role) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
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
    const blob = await put(`marktplaats/${user.id}/${Date.now()}.webp`, body, {
      access: 'public',
      contentType,
      token: process.env.bbauto_READ_WRITE_TOKEN,
    });
    return NextResponse.json({ url: blob.url }, { status: 201 });
  } catch (error) {
    console.error('Marketplace photo upload failed:', error);
    return NextResponse.json({ error: 'Uploaden mislukt' }, { status: 500 });
  }
}
