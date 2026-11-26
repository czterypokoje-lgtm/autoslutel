import * as XLSX from 'xlsx';
import { BRAND, WAREHOUSE } from '@/config/install';
import { requireOfficeUserApi } from '@/lib/crmSession';
import { CRM_PREVIEW } from '@/lib/supabase/env';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { fetchAll } from '@/lib/kfcInventory';
import { exportArticles, MasterError } from '@/lib/kfcProductMaster';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/**
 * The whole stock as one Excel file: a backup to keep outside the database,
 * and the paper trail an accountant asks for at year end.
 *
 * Four sheets — the articles with their totals, the quantity on every shelf
 * and in every van, every movement with its reason, and the locations
 * themselves. Together they are enough to rebuild the stock by hand if the
 * database is ever lost.
 *
 * Reads only: no row is written, changed or deleted, and running it twice
 * changes nothing. Office roles only, because it carries purchase prices,
 * and 404 on an install without the stock ledger.
 */

type LocationRow = { id: string; warehouse: string; shelf: string; box: string; kind: string };
type LevelRow = { article_code: string; location_id: string; quantity: number; minimum: number; last_counted_at: string | null };
type MoveRow = {
  created_at: string; article_code: string; location_id: string | null; delta: number;
  quantity_after: number | null; unit_cost_cents: number | null; reason: string; note: string | null;
};
type ArticleRow = { code: string; name: string; sku: string | null };

const REASON: Record<string, string> = {
  count: 'telling', sale: 'verkoop', return: 'retour', received: 'ontvangen',
  transfer: 'verplaatsing', correction: 'correctie', issue: 'uitgifte',
};

/** "main A-01 B1", the label the stock screens use; quarantine says so. */
const label = (l: LocationRow | undefined) =>
  l ? `${[l.warehouse, l.shelf, l.box].filter(Boolean).join(' ').trim()}${l.kind === 'quarantine' ? ' (quarantaine)' : ''}` : '—';

/** Amsterdam time as a plain string, so Excel shows what the CRM showed. */
const stamp = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam', dateStyle: 'short', timeStyle: 'short' }) : '';

export async function GET() {
  if (!WAREHOUSE || CRM_PREVIEW) return new Response(null, { status: 404 });
  const { response } = await requireOfficeUserApi();
  if (response) return response;

  const supabase = await createSupabaseServerClient();
  try {
    const [articles, locations, levels, moves, master] = await Promise.all([
      fetchAll<ArticleRow>((from, to) =>
        supabase.from('kfc_articles').select('code, name, sku').order('code').range(from, to)),
      fetchAll<LocationRow>((from, to) =>
        supabase.from('kfc_locations').select('id, warehouse, shelf, box, kind').order('warehouse').order('shelf').order('box').range(from, to)),
      fetchAll<LevelRow>((from, to) =>
        supabase.from('kfc_stock_levels').select('article_code, location_id, quantity, minimum, last_counted_at').order('article_code').range(from, to)),
      fetchAll<MoveRow>((from, to) =>
        supabase.from('kfc_stock_moves')
          .select('created_at, article_code, location_id, delta, quantity_after, unit_cost_cents, reason, note')
          .order('created_at', { ascending: false }).order('id', { ascending: false }).range(from, to)),
      // The article master is a bonus sheet: a failure there must not cost the stock itself.
      exportArticles({}).catch((error: unknown) => { console.warn('[voorraad-backup] article master skipped:', error); return null; }),
    ]);

    const nameOf = new Map(articles.map((a) => [a.code, a.name]));
    const skuOf = new Map(articles.map((a) => [a.code, a.sku ?? '']));
    const locOf = new Map(locations.map((l) => [l.id, l]));
    const perLocation = new Map<string, number>();
    for (const l of levels) perLocation.set(l.location_id, (perLocation.get(l.location_id) ?? 0) + 1);

    const book = XLSX.utils.book_new();
    const sheet = (name: string, rows: Record<string, unknown>[]) =>
      XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(rows), name);

    /* 1. The article master, in the shape the import wizard reads back. */
    if (master?.length) sheet('Artikelen', master as unknown as Record<string, unknown>[]);

    /* 2. What lies where, at this moment. */
    sheet('Voorraad per locatie', levels.map((l) => ({
      artikelcode: l.article_code,
      sku: skuOf.get(l.article_code) ?? '',
      artikel: nameOf.get(l.article_code) ?? '',
      locatie: label(locOf.get(l.location_id)),
      aantal: l.quantity,
      minimum: l.minimum,
      laatst_geteld: stamp(l.last_counted_at),
    })));

    /* 3. Every movement: the trail behind the numbers above. */
    sheet('Mutaties', moves.map((m) => ({
      datum: stamp(m.created_at),
      artikelcode: m.article_code,
      artikel: nameOf.get(m.article_code) ?? '',
      locatie: m.location_id ? label(locOf.get(m.location_id)) : '—',
      mutatie: m.delta,
      stand_na: m.quantity_after ?? '',
      reden: REASON[m.reason] ?? m.reason,
      inkoopprijs: m.unit_cost_cents == null ? '' : m.unit_cost_cents / 100,
      notitie: m.note ?? '',
    })));

    /* 4. The locations themselves, so an empty shelf is still a known shelf. */
    sheet('Locaties', locations.map((l) => ({
      magazijn: l.warehouse,
      stelling: l.shelf,
      bak: l.box,
      soort: l.kind === 'quarantine' ? 'quarantaine' : 'schap',
      artikelen: perLocation.get(l.id) ?? 0,
    })));

    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Amsterdam' });
    const file = `voorraad-backup-${BRAND.name.toLowerCase().replace(/\s+/g, '-')}-${today}.xlsx`;
    return new Response(new Uint8Array(XLSX.write(book, { type: 'buffer', bookType: 'xlsx' }) as Buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${file}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const message = error instanceof MasterError || error instanceof Error ? error.message : 'onbekende fout';
    console.error('[voorraad-backup] failed:', message);
    return Response.json({ error: `Back-up mislukt: ${message}` }, { status: 500 });
  }
}
