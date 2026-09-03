import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { requireOfficeUserApi } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getProductBySlug } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

/**
 * Upload a product photo.
 *
 * `?main=1` replaces the main image; otherwise it is appended to the gallery.
 * A supplier render of a blank key sells nothing — a photo of the actual part
 * on the workbench does, and this is how one gets there.
 */

const MAX_BYTES = 12 * 1024 * 1024;
const MAX_GALLERY = 12;

const ALLOWED: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { response } = await requireOfficeUserApi();
  if (response) return response;

  const { slug } = await params;
  if (!getProductBySlug(slug)) {
    return NextResponse.json({ error: 'Onbekend product' }, { status: 404 });
  }

  const isMain = new URL(request.url).searchParams.get('main') === '1';

  const contentType = (request.headers.get('content-type') || '')
    .split(';')[0]!
    .trim()
    .toLowerCase();
  const extension = ALLOWED[contentType];
  if (!extension) {
    return NextResponse.json(
      { error: 'Alleen JPG, PNG, WebP of AVIF' },
      { status: 415 }
    );
  }

  const body = await request.arrayBuffer();
  if (body.byteLength === 0 || body.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: 'Bestand is te groot of leeg' }, { status: 413 });
  }

  if (!process.env.bbauto_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: 'Foto-opslag is niet geconfigureerd' },
      { status: 503 }
    );
  }

  let url: string;
  try {
    const blob = await put(`producten/${slug}/${Date.now()}.${extension}`, body, {
      access: 'public',
      contentType,
      token: process.env.bbauto_READ_WRITE_TOKEN,
    });
    url = blob.url;
  } catch (error) {
    console.error('Product image upload failed:', error);
    return NextResponse.json({ error: 'Uploaden mislukt' }, { status: 500 });
  }

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: 'CRM is niet geconfigureerd' }, { status: 503 });
  }

  // Read-modify-write on the gallery: the row may not exist yet, and appending
  // needs what is already there.
  const { data: existing } = await supabase
    .from('product_overrides')
    .select('images')
    .eq('slug', slug)
    .maybeSingle();

  const gallery: string[] = Array.isArray(existing?.images)
    ? (existing.images as unknown[]).filter((u): u is string => typeof u === 'string')
    : [];

  // Both shapes in one declared type, so the union does not confuse the
  // upsert's generics into demanding fields the other branch never sets.
  const patch: { slug: string; image_override?: string; images?: string[] } = isMain
    ? { slug, image_override: url }
    : { slug, images: [...gallery, url].slice(0, MAX_GALLERY) };

  const { error } = await supabase
    .from('product_overrides')
    .upsert(patch, { onConflict: 'slug' });

  if (error) {
    console.error('Product image save failed:', error.message);
    return NextResponse.json({ error: 'Opslaan mislukt' }, { status: 500 });
  }

  return NextResponse.json({ url, main: isMain }, { status: 201 });
}

/** Remove one gallery image, or clear the main one. */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { response } = await requireOfficeUserApi();
  if (response) return response;

  const { slug } = await params;
  const target = new URL(request.url).searchParams.get('url');

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: 'CRM is niet geconfigureerd' }, { status: 503 });
  }

  if (!target) {
    // No url means: drop the main override and fall back to the feed photo.
    const { error } = await supabase
      .from('product_overrides')
      .upsert({ slug, image_override: null }, { onConflict: 'slug' });
    if (error) {
      return NextResponse.json({ error: 'Verwijderen mislukt' }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  const { data: existing } = await supabase
    .from('product_overrides')
    .select('images')
    .eq('slug', slug)
    .maybeSingle();

  const gallery: string[] = Array.isArray(existing?.images)
    ? (existing.images as unknown[]).filter((u): u is string => typeof u === 'string')
    : [];

  const { error } = await supabase
    .from('product_overrides')
    .upsert(
      { slug, images: gallery.filter((u) => u !== target) },
      { onConflict: 'slug' }
    );

  if (error) {
    return NextResponse.json({ error: 'Verwijderen mislukt' }, { status: 500 });
  }

  // The blob itself is left in place: it may still be referenced by an older
  // order confirmation or a cached page, and storage is cheap next to a broken
  // image on a customer's screen.
  return NextResponse.json({ ok: true });
}
