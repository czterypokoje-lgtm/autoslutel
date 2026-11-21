import { BRAND, WAREHOUSE } from '@/config/install';
import { requireOfficeUserApi } from '@/lib/crmSession';
import { CRM_PREVIEW } from '@/lib/supabase/env';
import { exportArticles, MasterError, toCsv, toXlsx, type ExportRow } from '@/lib/kfcProductMaster';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** One made-up row showing every column the import understands. */
const TEMPLATE: ExportRow[] = [{
  code: '', sku: 'VOORBEELD-01', ean: '8712345678906', naam: 'Voorbeeld klapsleutel 3 knoppen', categorie: 'Autosleutels > Volkswagen',
  status: 'voorraad', verkoopprijs: 49.95, inkoopprijs: 18.5, min_voorraad: 2, voorraad: 0, leveranciersref: 'LEV-123',
  merk: 'Volkswagen', sleuteltype: 'flip', frequentie: '433 MHz', chip: 'ID48', knoppen: 3, baard: 'HU66',
  voertuigen: 'Volkswagen|Golf|2004|2012; Volkswagen|Polo|2005|2009',
}];

/** GET ?format=csv|xlsx&category=<id>&status=held|on_demand|discontinued&template=1 */
export async function GET(request: Request) {
  if (!WAREHOUSE || CRM_PREVIEW) return new Response(null, { status: 404 });
  const { response } = await requireOfficeUserApi();
  if (response) return response;
  const params = new URL(request.url).searchParams;
  const format = params.get('format') === 'xlsx' ? 'xlsx' : 'csv';
  const category = params.get('category');
  const status = params.get('status');
  if (category && !UUID.test(category)) return new Response(null, { status: 400 });
  if (status && !['held', 'on_demand', 'discontinued'].includes(status)) return new Response(null, { status: 400 });
  const template = params.get('template') === '1';
  let rows: ExportRow[];
  try {
    rows = template ? TEMPLATE : await exportArticles({ category, status });
  } catch (error) {
    return Response.json({ error: error instanceof MasterError ? error.message : 'Export mislukt.' }, { status: 500 });
  }
  const stamp = new Date().toISOString().slice(0, 10);
  const base = template ? 'artikelen-voorbeeld' : `artikelen-${BRAND.name.toLowerCase()}-${stamp}`;
  const headers = { 'Cache-Control': 'no-store', 'Content-Disposition': `attachment; filename="${base}.${format}"` };
  if (format === 'xlsx') {
    return new Response(new Uint8Array(toXlsx(rows)), { headers: { ...headers, 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' } });
  }
  return new Response(toCsv(rows), { headers: { ...headers, 'Content-Type': 'text/csv; charset=utf-8' } });
}
