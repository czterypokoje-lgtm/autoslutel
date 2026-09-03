import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { getCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/** Profile photo: upload to Blob, then store the URL through the same guard. */

const MAX_BYTES = 6 * 1024 * 1024;

const ALLOWED: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
};

export async function POST(request: Request) {
  const user = await getCrmUser();
  if (!user?.role) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
  }

  const contentType = (request.headers.get('content-type') || '')
    .split(';')[0]!
    .trim()
    .toLowerCase();
  const extension = ALLOWED[contentType];
  if (!extension) {
    return NextResponse.json({ error: 'Alleen afbeeldingen' }, { status: 415 });
  }

  const body = await request.arrayBuffer();
  if (body.byteLength === 0 || body.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: 'Foto is te groot of leeg' }, { status: 413 });
  }

  if (!process.env.bbauto_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: 'Foto-opslag is niet geconfigureerd' },
      { status: 503 }
    );
  }

  let url: string;
  try {
    // Keyed on the user id, not the name: a rename must not orphan the photo.
    const blob = await put(`monteurs/${user.id}/${Date.now()}.${extension}`, body, {
      access: 'public',
      contentType,
      token: process.env.bbauto_READ_WRITE_TOKEN,
    });
    url = blob.url;
  } catch (error) {
    console.error('Profile photo upload failed:', error);
    return NextResponse.json({ error: 'Uploaden mislukt' }, { status: 500 });
  }

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: 'CRM is niet geconfigureerd' }, { status: 503 });
  }

  const { error } = await supabase.rpc('crm_update_own_profile', {
    p_photo_url: url,
  });

  if (error) {
    console.error('Profile photo save failed:', error.message);
    return NextResponse.json({ error: 'Opslaan mislukt' }, { status: 500 });
  }

  return NextResponse.json({ url }, { status: 201 });
}
