import { IS_KEYFORCARS } from '@/config/install';
import { CRM_PREVIEW } from '@/lib/supabase/env';
import { requireOfficeUserApi } from '@/lib/crmSession';
import { isWooShop } from '@/lib/kfcWoo';
import { enqueueAll, previewQueue, pushNow, refreshMapping, runStockPush, setMapping } from '@/lib/kfcWooStock';

export const runtime = 'nodejs';
export const maxDuration = 300;

const reply = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const articleCode = /^[A-Z0-9][A-Z0-9-]{0,39}$/;

/**
 * Webshop stock sync, office only: refresh the product mapping of one shop,
 * link a product by hand, push one article now, queue everything, run the
 * queue once, or a dry run of the queue. Whether anything reaches a shop is
 * decided per shop by WOO_<SHOP>_STOCK_PUSH (default off), not here.
 */
export async function POST(request: Request) {
  if (!IS_KEYFORCARS || CRM_PREVIEW) return reply({}, 404);
  const { response } = await requireOfficeUserApi();
  if (response) return response;
  const input = await request.json().catch(() => null);
  if (!input || typeof input !== 'object') return reply({ error: 'Ongeldige invoer.' }, 400);
  try {
    switch (input.action) {
      case 'refresh-mapping': {
        if (typeof input.shop !== 'string' || !isWooShop(input.shop)) return reply({ error: 'Onbekende webshop.' }, 400);
        return reply(await refreshMapping(input.shop));
      }
      case 'set-mapping': {
        const { shop, product, variation } = input;
        const article = typeof input.article === 'string' && input.article.trim() ? input.article.trim().toUpperCase() : null;
        if (typeof shop !== 'string' || !isWooShop(shop) || !Number.isSafeInteger(product) || !Number.isSafeInteger(variation) || product <= 0 || variation < 0) {
          return reply({ error: 'Ongeldige invoer.' }, 400);
        }
        if (article && !articleCode.test(article)) return reply({ error: 'Ongeldige artikelcode.' }, 400);
        await setMapping(shop, product, variation, article);
        return reply({ ok: true });
      }
      case 'push-now': {
        const article = typeof input.article === 'string' ? input.article.trim().toUpperCase() : '';
        if (!articleCode.test(article)) return reply({ error: 'Ongeldige artikelcode.' }, 400);
        return reply(await pushNow(article));
      }
      case 'enqueue-all':
        return reply({ queued: await enqueueAll() });
      case 'run':
        return reply(await runStockPush({ budgetMs: 240_000 }));
      case 'preview':
        return reply({ results: await previewQueue() });
      default:
        return reply({ error: 'Onbekende actie.' }, 400);
    }
  } catch (error) {
    return reply({ error: (error as Error).message }, 500);
  }
}
