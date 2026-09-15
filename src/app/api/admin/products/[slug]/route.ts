import { NextResponse } from 'next/server';
import { requireOfficeUserApi } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getProductBySlug } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

/**
 * Edit one webshop product.
 *
 * Writes an override row, never the feed: `catalog.json` is regenerated from
 * the supplier export and any edit made there would vanish on the next import.
 */

function money(value: unknown): number | null | 'invalid' {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  if (!Number.isFinite(n) || n < 0 || n > 99_999_999) return 'invalid';
  return Math.round(n * 100) / 100;
}

function text(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { response } = await requireOfficeUserApi();
  if (response) return response;

  const { slug } = await params;

  // The slug has to exist in the feed. An override for a product that is not
  // in the catalogue is a row nothing will ever read.
  if (!getProductBySlug(slug)) {
    // Which slug, so a stale tab or a renamed product is obvious at a glance.
    return NextResponse.json(
      { error: `Onbekend product: "${slug}" staat niet in de catalogus` },
      { status: 404 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 });
  }

  const price = money(body.price_override);
  const cost = money(body.cost_override);
  if (price === 'invalid' || cost === 'invalid') {
    return NextResponse.json({ error: 'Ongeldig bedrag' }, { status: 400 });
  }

  const stock = money(body.stock_quantity);
  const min = money(body.min_quantity);
  if (stock === 'invalid' || min === 'invalid') {
    return NextResponse.json({ error: 'Ongeldig aantal' }, { status: 400 });
  }

  const row = {
    slug,
    published: body.published === false ? false : body.published === true ? true : null,
    price_override: price,
    cost_override: cost,
    title_override: text(body.title_override, 300),
    description_override: text(body.description_override, 4000),
    excerpt_override: text(body.excerpt_override, 600),
    direct_answer_override: text(body.direct_answer_override, 600),
    meta_title_override: text(body.meta_title_override, 200),
    meta_description_override: text(body.meta_description_override, 400),
    track_stock: body.track_stock === true,
    stock_quantity: stock ?? 0,
    min_quantity: min ?? 0,
    featured: body.featured === true,
    internal_note: text(body.internal_note, 1000),
  };

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: 'CRM is niet geconfigureerd' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('product_overrides')
    .upsert(row, { onConflict: 'slug' })
    .select('*')
    .single();

  if (error) {
    console.error('Product override failed:', error.message);
    /*
     * The real reason, on screen. This route is office-only, and "Opslaan
     * mislukt" with the cause hidden in a server log nobody reads costs an
     * afternoon of guessing — as it just did.
     */
    return NextResponse.json(
      { error: `Opslaan mislukt: ${error.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ override: data }, { headers: { 'Cache-Control': 'no-store' } });
}
