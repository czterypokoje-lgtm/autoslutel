import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { getCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Job photos, straight from a phone camera.
 *
 * Deliberately not /api/upload: that route is the public customer one, capped
 * at ten uploads an hour per IP. A monteur doing four jobs with a before and an
 * after shot each would be throttled halfway through the afternoon, and a whole
 * team behind one mobile network shares an address.
 *
 * The same safety constraints still apply — image content types only, a hard
 * size cap, and a server-generated filename. Who may write is decided by the
 * RLS policy on job_photos, which follows the job.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_BYTES = 12 * 1024 * 1024; // 12 MB — modern phone photos are large

const ALLOWED: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

const KINDS = new Set(['before', 'after', 'damage']);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCrmUser();
  if (!user?.role) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
  }

  const { id } = await params;
  if (!UUID.test(id)) {
    return NextResponse.json({ error: 'Ongeldig job-id' }, { status: 400 });
  }

  const url = new URL(request.url);
  const kind = url.searchParams.get('kind') ?? 'after';
  if (!KINDS.has(kind)) {
    return NextResponse.json({ error: 'Onbekend soort foto' }, { status: 400 });
  }

  const contentType = (request.headers.get('content-type') || '')
    .split(';')[0]!
    .trim()
    .toLowerCase();
  const extension = ALLOWED[contentType];
  if (!extension) {
    return NextResponse.json({ error: 'Alleen afbeeldingen' }, { status: 415 });
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
    // Fail closed rather than pretending the photo was stored.
    return NextResponse.json(
      { error: 'Foto-opslag is niet geconfigureerd' },
      { status: 503 }
    );
  }

  let blobUrl: string;
  try {
    const blob = await put(`jobs/${id}/${kind}-${Date.now()}.${extension}`, body, {
      access: 'public',
      contentType,
      token: process.env.bbauto_READ_WRITE_TOKEN,
    });
    blobUrl = blob.url;
  } catch (error) {
    console.error('Job photo upload failed:', error);
    return NextResponse.json({ error: 'Uploaden mislukt' }, { status: 500 });
  }

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: 'CRM is niet geconfigureerd' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('job_photos')
    .insert({ job_id: id, url: blobUrl, kind, created_by: user.id })
    .select('id, url, kind, created_at')
    .single();

  if (error) {
    console.error('Job photo insert failed:', error.message);
    return NextResponse.json({ error: 'Opslaan mislukt' }, { status: 500 });
  }

  return NextResponse.json({ photo: data }, { status: 201 });
}
