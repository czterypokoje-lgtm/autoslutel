import 'server-only';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { findProfile, type ProductProfileData } from '@/lib/productProfiles';

/**
 * Product profiles for shelf labels and the product view, with the CRM's own
 * data first: specs (kfc_article_specs) and vehicle fitments
 * (kfc_article_fitments) replace what the supplier catalogue says, field by
 * field. What the CRM does not have yet still comes from the catalogue, so a
 * label never loses information; correcting an article in the CRM corrects
 * its label.
 *
 * A fitment from the CRM is marked `text: 'crm'`: it is printed as entered,
 * without the catalogue's plausibility filter.
 */

const KIND: Record<string, string> = {
  housing: 'Behuizing', transponder: 'Transpondersleutel', chip: 'Transponderchip',
  remote: 'Sleutel / afstandsbediening', smart: 'Sleutel / afstandsbediening', flip: 'Sleutel / afstandsbediening',
};

type Specs = { article_code: string; key_type: string | null; frequency: string | null; chip: string | null; buttons: number | null; blade: string | null };
type Fitment = { article_code: string; make: string; model: string; year_from: number | null; year_to: number | null };

const empty = (sku: string, name: string): ProductProfileData => ({
  sku, name, nameNl: name, image: '', imageLarge: '', brand: '',
  facts: { kind: '', chips: [], frequency: [], blade: [], buttons: '' }, specs: [], fits: [], links: [], ean: [],
});

export async function labelProfiles(skus: string[]): Promise<Record<string, ProductProfileData | null>> {
  const result: Record<string, ProductProfileData | null> = Object.fromEntries(skus.map((sku) => [sku, findProfile(sku) ?? null]));
  const wanted = [...new Set(skus.map((sku) => sku.trim().toUpperCase()).filter(Boolean))];
  if (!wanted.length) return result;
  try {
    const db = createSupabaseAdminClient();
    const { data: articles, error } = await db.from('kfc_articles').select('code, sku, name').in('sku', wanted);
    if (error) throw error;
    // A SKU on several articles cannot pick one: it keeps the catalogue profile.
    const bySku = new Map<string, { code: string; name: string }[]>();
    for (const article of (articles ?? []) as { code: string; sku: string; name: string }[]) {
      const key = article.sku.trim().toUpperCase();
      bySku.set(key, [...(bySku.get(key) ?? []), article]);
    }
    const codes = [...bySku.values()].filter((list) => list.length === 1).map(([article]) => article.code);
    if (!codes.length) return result;
    const [specs, fitments] = await Promise.all([
      db.from('kfc_article_specs').select('article_code, key_type, frequency, chip, buttons, blade').in('article_code', codes),
      db.from('kfc_article_fitments').select('article_code, make, model, year_from, year_to').in('article_code', codes).order('make').order('model'),
    ]);
    if (specs.error || fitments.error) throw specs.error ?? fitments.error;
    const specByCode = new Map(((specs.data ?? []) as Specs[]).map((row) => [row.article_code, row]));
    const fitsByCode = new Map<string, Fitment[]>();
    for (const row of (fitments.data ?? []) as Fitment[]) fitsByCode.set(row.article_code, [...(fitsByCode.get(row.article_code) ?? []), row]);

    for (const sku of skus) {
      const list = bySku.get(sku.trim().toUpperCase());
      if (list?.length !== 1) continue;
      const [article] = list;
      const spec = specByCode.get(article.code);
      const fits = fitsByCode.get(article.code) ?? [];
      if (!spec && !fits.length) continue;
      const base = result[sku] ?? empty(sku, article.name);
      result[sku] = {
        ...base,
        facts: {
          kind: (spec?.key_type && KIND[spec.key_type]) || base.facts.kind,
          chips: spec?.chip ? [spec.chip] : base.facts.chips,
          frequency: spec?.frequency ? [spec.frequency] : base.facts.frequency,
          blade: spec?.blade ? [spec.blade] : base.facts.blade,
          buttons: spec?.buttons != null ? String(spec.buttons) : base.facts.buttons,
        },
        fits: fits.length
          ? fits.map((fit) => ({ text: 'crm', vehicle: `${fit.make} ${fit.model}`.trim(), from: fit.year_from, to: fit.year_to }))
          : base.fits,
      };
    }
  } catch (error) {
    // The CRM tables cannot be read: labels fall back to the catalogue rather than fail.
    console.error('[labels] CRM specs/fitments unavailable', error);
  }
  return result;
}
