import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { getCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * The customer's signature, drawn on the monteur's phone and posted as a PNG.
 *
 * Stored on the job rather than in job_photos: there is exactly one, and the
 * invoice and any dispute refer to it directly.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_BYTES = 2 * 1024 * 1024; // a signature canvas is small; a photo is not

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

  const contentType = (request.headers.get('content-type') || '')
    .split(';')[0]!
    .trim()
    .toLowerCase();
  if (contentType !== 'image/png') {
    return NextResponse.json({ error: 'Handtekening moet PNG zijn' }, { status: 415 });
  }

  const body = await request.arrayBuffer();
  if (body.byteLength === 0 || body.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: 'Ongeldige handtekening' }, { status: 400 });
  }

  if (!process.env.bbauto_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: 'Opslag is niet geconfigureerd' },
      { status: 503 }
    );
  }

  let signatureUrl: string;
  try {
    const blob = await put(`jobs/${id}/handtekening-${Date.now()}.png`, body, {
      access: 'public',
      contentType: 'image/png',
      token: process.env.bbauto_READ_WRITE_TOKEN,
    });
    signatureUrl = blob.url;
  } catch (error) {
    console.error('Signature upload failed:', error);
    return NextResponse.json({ error: 'Uploaden mislukt' }, { status: 500 });
  }

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: 'CRM is niet geconfigureerd' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('jobs')
    .update({ signature_url: signatureUrl })
    .eq('id', id)
    .select('id, signature_url')
    .maybeSingle();

  if (error) {
    console.error('Signature save failed:', error.message);
    return NextResponse.json({ error: 'Opslaan mislukt' }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Klus niet gevonden' }, { status: 404 });
  }

  return NextResponse.json({ job: data }, { status: 201 });
}
