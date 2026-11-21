import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { WAREHOUSE } from '@/config/install';
import { CRM_PREVIEW } from '@/lib/supabase/env';
import { requireWarehouseUserApi, seesPrices } from '@/lib/crmSession';
import { StockError, attachPurchaseDocument, createPurchaseOrder, findArticlesByScan, listPurchaseOrders, newArticle, purchaseDocument, receivePurchaseLine, setPurchaseInvoiceRef, setPurchaseOrderStatus } from '@/lib/kfcInventory';

export const runtime = 'nodejs';

/**
 * Purchase orders for the KeyForCars warehouse.
 *
 * Office creates, orders and cancels; warehouse and picker may list and
 * receive. Receiving is the only path that books 'received' stock moves.
 */
const reply = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const uuid = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;

async function gate() {
  if (!WAREHOUSE || CRM_PREVIEW) return { user: undefined, response: reply({}, 404) };
  return requireWarehouseUserApi();
}

export async function GET(request: Request) {
  const { user, response } = await gate();
  if (response) return response;
  // ?scan=<barcode|SKU|code>: exact article match for a scanned label, or 404 so the screen offers a quick card.
  const photoId = new URL(request.url).searchParams.get('receiptPhoto');
  if (photoId) {
    if (!/^[0-9]{1,19}$/.test(photoId)) return reply({},400);
    const {data,error} = await createSupabaseAdminClient().from('kfc_receipt_photos').select('content,mime').eq('move_id',photoId).maybeSingle();
    if(error) return reply({},500);
    if(!data) return reply({},404);
    return new Response(Buffer.from(data.content.slice(2),'hex'), {headers:{'Content-Type':data.mime,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
  }
  const scan = new URL(request.url).searchParams.get('scan');
  if (scan !== null) {
    const articles = await findArticlesByScan(scan);
    if (articles.length > 1) return reply({ articles });
    const article = articles[0];
    return article ? reply({ article }) : reply({ error: 'Onbekend artikel.' }, 404);
  }
  // ?document=<order id>: the attached supplier invoice or receipt, office only (it carries prices).
  const documentId = new URL(request.url).searchParams.get('document');
  if (documentId !== null) {
    if (!seesPrices(user)) return reply({ error: 'Alleen kantoor ziet inkoopfacturen.' }, 403);
    if (!uuid.test(documentId)) return reply({ error: 'Ongeldige invoer.' }, 400);
    const doc = await purchaseDocument(documentId);
    if (!doc) return reply({ error: 'Geen document gekoppeld.' }, 404);
    return new Response(Buffer.from(doc.bytes), { headers: { 'Content-Type': doc.type, 'Cache-Control': 'no-store', 'Content-Disposition': 'inline' } });
  }
  try {
    return reply({ orders: await listPurchaseOrders(user) });
  } catch (error) {
    if (error instanceof StockError) return reply({ error: error.message }, error.status);
    throw error;
  }
}

export async function POST(request: Request) {
  const { user, response } = await gate();
  if (response) return response;
  const input = await request.json().catch(() => null);
  if (!input || typeof input !== 'object') return reply({ error: 'Ongeldige invoer.' }, 400);
  try {
    if (input.action === 'create') {
      if (!seesPrices(user)) return reply({ error: 'Alleen kantoor maakt inkooporders.' }, 403);
      const lines = Array.isArray(input.lines) ? input.lines : [];
      const id = await createPurchaseOrder({
        supplier: String(input.supplier ?? ''), expected_on: typeof input.expected_on === 'string' ? input.expected_on : null,
        note: typeof input.note === 'string' ? input.note : null,
        invoice_ref: typeof input.invoice_ref === 'string' ? input.invoice_ref : null,
        lines: lines.map((line: Record<string, unknown>) => ({
          article: String(line.article ?? ''), quantity: Number(line.quantity),
          unit_cost_cents: line.unit_cost_cents == null || line.unit_cost_cents === '' ? null : Number(line.unit_cost_cents),
        })),
      }, user);
      return reply({ id });
    }
    if (input.action === 'status') {
      if (!seesPrices(user)) return reply({ error: 'Alleen kantoor wijzigt inkooporders.' }, 403);
      if (typeof input.id !== 'string' || !uuid.test(input.id) || !['ordered', 'cancelled'].includes(input.status)) return reply({ error: 'Ongeldige invoer.' }, 400);
      await setPurchaseOrderStatus(input.id, input.status);
      return reply({ ok: true });
    }
    if (input.action === 'receive') {
      if (typeof input.line !== 'string' || !uuid.test(input.line) || typeof input.key !== 'string' || !uuid.test(input.key)) return reply({ error: 'Ongeldige invoer.' }, 400);
      if (input.scan) {
        if (typeof input.scan !== 'string' || input.scan.length > 80) return reply({error:'Ongeldige scan.'},400);
        const articles = await findArticlesByScan(input.scan);
        const line = await createSupabaseAdminClient().from('kfc_purchase_order_lines').select('article_code').eq('id',input.line).maybeSingle();
        if (articles.length !== 1 || articles[0].id !== line.data?.article_code) return reply({error:'Scan de unieke artikelcode van deze regel.'},409);
      }
      const photo = input.photo ?? null;
      const mime = input.mime ?? null;
      if (photo !== null) {
        if (typeof photo !== 'string' || photo.length > 2796204) return reply({error:'Foto te groot.'},400);
        const bytes = Buffer.from(photo,'base64');
        if (bytes.length > 2097152 || !(mime === 'image/png' && bytes.subarray(0,8).toString('hex') === '89504e470d0a1a0a' ||
          mime === 'image/jpeg' && bytes.subarray(0,3).toString('hex') === 'ffd8ff')) return reply({error:'Gebruik een JPG- of PNG-foto.'},400);
      }
      const move = await receivePurchaseLine(input.line, Number(input.quantity), String(input.shelf ?? '').toUpperCase(), String(input.box ?? '').toUpperCase(), input.key, user, photo, mime);
      return reply({ ok: true, move });
    }
    if (input.action === 'article') {
      // Quick card from an unknown scan while drafting an order (spec S2). Opened once: same SKU/EAN returns the existing card.
      if (!seesPrices(user)) return reply({ error: 'Alleen kantoor maakt artikelen aan.' }, 403);
      const name = typeof input.name === 'string' ? input.name.trim() : '';
      const sku = typeof input.sku === 'string' ? input.sku.trim() : '';
      const ean = typeof input.ean === 'string' && input.ean.trim() ? input.ean.trim() : null;
      if (!name || name.length > 180 || sku.length > 80) return reply({ error: 'Controleer de artikelnaam en SKU.' }, 400);
      if (ean && !/^\d{8,14}$/.test(ean)) return reply({ error: 'Een EAN is 8 tot 14 cijfers.' }, 400);
      const condition = input.condition === undefined ? 'new' : input.condition;
      if (!['new', 'opened', 'used'].includes(condition)) return reply({ error: 'Ongeldige staat.' }, 400);
      const ref = input.ref ?? '';
      const category = input.category ?? 'Werkplaats';
      const tracking = condition === 'used' ? 'serial' : input.tracking ?? 'quantity';
      const cost = input.cost ?? null;
      if (typeof ref !== 'string' || ref.length > 80 || typeof category !== 'string' || !category.trim() || category.length > 80 ||
        !['serial','quantity'].includes(tracking) || (cost !== null && (!Number.isInteger(cost) || cost < 0 || cost > 2147483647))) return reply({ error: 'Ongeldige invoer.' }, 400);
      const id = await newArticle(name, sku, ean, condition, ref.trim(), category.trim(), tracking, cost);
      return reply({ article: (await findArticlesByScan(id)).find((item) => item.id === id) ?? { id, name, sku } });
    }
    if (input.action === 'invoice_ref') {
      if (!seesPrices(user)) return reply({ error: 'Alleen kantoor wijzigt inkooporders.' }, 403);
      if (typeof input.id !== 'string' || !uuid.test(input.id) || typeof input.invoice_ref !== 'string') return reply({ error: 'Ongeldige invoer.' }, 400);
      await setPurchaseInvoiceRef(input.id, input.invoice_ref);
      return reply({ ok: true });
    }
    if (input.action === 'document') {
      if (!seesPrices(user)) return reply({ error: 'Alleen kantoor koppelt inkoopfacturen.' }, 403);
      if (typeof input.id !== 'string' || !uuid.test(input.id) || typeof input.type !== 'string' || typeof input.data !== 'string') return reply({ error: 'Ongeldige invoer.' }, 400);
      await attachPurchaseDocument(input.id, new Uint8Array(Buffer.from(input.data, 'base64')), input.type);
      return reply({ ok: true });
    }
    return reply({ error: 'Onbekende actie.' }, 400);
  } catch (error) {
    if (error instanceof StockError) return reply({ error: error.message }, error.status);
    throw error;
  }
}
