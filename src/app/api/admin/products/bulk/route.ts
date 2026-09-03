import { NextResponse } from 'next/server';
import { requireOfficeUserApi } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getProducts } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

/**
 * Publish or hide every product in a set of categories at once.
 *
 * Hiding, never deleting. The catalogue is regenerated from the supplier feed,
 * so a deletion would come straight back on the next import — and would not be
 * reversible in the meantime. An override row is both: gone from the shop, one
 * click from returning.
 */
export async function POST(request: Request) {
  const { response } = await requireOfficeUserApi();
  if (response) return response;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 });
  }

  const published = body.published === true;
  const all = [...getProducts('public'), ...getProducts('trade')];

  /*
   * Two ways to select.
   *
   * `scope: 'non-akey'` is the one that matters day to day: hide everything
   * that is not from the current supplier. Selecting by category alone could
   * not express that — un-hiding "afstandsbedieningen" to bring back A-Key
   * keys also resurrected the old English feed in the same category, and the
   * shop ended up showing both at once.
   */
  let slugs: string[];

  {
    const categories = Array.isArray(body.categories)
      ? body.categories.filter((c): c is string => typeof c === 'string')
      : [];
    if (categories.length === 0) {
      return NextResponse.json({ error: 'Kies minstens één categorie' }, { status: 400 });
    }

    const wanted = new Set(categories);
    slugs = all
      .filter((p) => wanted.has(p.category ?? 'geen'))
      .map((p) => p.slug);
  }

  if (slugs.length === 0) {
    return NextResponse.json({ error: 'Geen producten in die categorieën' }, { status: 400 });
  }

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: 'CRM is niet geconfigureerd' }, { status: 503 });
  }

  /*
   * Chunked: a thousand-row upsert in one request is the kind of thing that
   * works locally and times out on a cold connection. Failing halfway is
   * survivable here — the operation is idempotent, so running it again finishes
   * the job rather than doubling it.
   */
  let done = 0;
  for (let i = 0; i < slugs.length; i += 200) {
    const chunk = slugs.slice(i, i + 200).map((slug) => ({ slug, published }));
    const { error } = await supabase
      .from('product_overrides')
      .upsert(chunk, { onConflict: 'slug' });

    if (error) {
      console.error('Bulk publish failed:', error.message);
      return NextResponse.json(
        { error: `Opslaan mislukt na ${done} producten. Probeer opnieuw.` },
        { status: 500 }
      );
    }
    done += chunk.length;
  }

  return NextResponse.json({ updated: done, published });
}
