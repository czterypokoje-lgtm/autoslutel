import { WAREHOUSE } from '@/config/install';
import { CRM_PREVIEW } from '@/lib/supabase/env';
import { requireOfficeUserApi } from '@/lib/crmSession';
import { StockError } from '@/lib/kfcInventory';
import {
  addSupplierContact, createSupplier, postSupplierEntry, removeSupplierArticle, removeSupplierContact, reverseSupplierEntry,
  saveSupplierArticle, supplierOptions, supplierPrices, updateSupplier,
} from '@/lib/kfcSuppliers';

export const runtime = 'nodejs';

/**
 * Supplier accounts (crediteuren, 0130): office only, since everything here
 * carries prices. Cards, contacts, supplier articles and prices, purchase
 * invoices, payments and reversals. Ledger writes are retry-safe on `key`.
 */
const reply = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const uuid = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
const isId = (value: unknown): value is string => typeof value === 'string' && uuid.test(value);
const optionalInt = (value: unknown) => (value == null || value === '' ? null : Number(value));
const ENTRY_TYPES = ['invoice', 'payment', 'credit_note', 'refund', 'opening', 'write_off'] as const;

async function gate() {
  if (!WAREHOUSE || CRM_PREVIEW) return { user: undefined, response: reply({}, 404) };
  return requireOfficeUserApi();
}

export async function GET(request: Request) {
  const { response } = await gate();
  if (response) return response;
  const params = new URL(request.url).searchParams;
  try {
    const prices = params.get('prices');
    if (prices !== null) {
      if (!isId(prices)) return reply({ error: 'Ongeldige leverancier.' }, 400);
      return reply({ prices: await supplierPrices(prices) });
    }
    return reply({ suppliers: await supplierOptions() });
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
    switch (input.action) {
      case 'create':
        return reply({ id: await createSupplier(input.supplier ?? {}, user) });
      case 'update':
        if (!isId(input.id)) return reply({ error: 'Ongeldige leverancier.' }, 400);
        await updateSupplier(input.id, input.supplier ?? {});
        return reply({ ok: true });
      case 'contact_add':
        if (!isId(input.supplier)) return reply({ error: 'Ongeldige leverancier.' }, 400);
        await addSupplierContact(input.supplier, input.contact ?? {});
        return reply({ ok: true });
      case 'contact_remove':
        if (!isId(input.supplier) || !isId(input.contact)) return reply({ error: 'Ongeldige invoer.' }, 400);
        await removeSupplierContact(input.supplier, input.contact);
        return reply({ ok: true });
      case 'article_save':
        if (!isId(input.supplier) || typeof input.article !== 'string') return reply({ error: 'Ongeldige invoer.' }, 400);
        await saveSupplierArticle(input.supplier, {
          article: input.article, supplier_sku: typeof input.supplier_sku === 'string' ? input.supplier_sku : null,
          price_cents: optionalInt(input.price_cents), min_qty: optionalInt(input.min_qty), lead_time_days: optionalInt(input.lead_time_days),
          preferred: input.preferred === true, note: typeof input.note === 'string' ? input.note : null,
        });
        return reply({ ok: true });
      case 'article_remove':
        if (!isId(input.supplier) || typeof input.article !== 'string' || input.article.length > 80) return reply({ error: 'Ongeldige invoer.' }, 400);
        await removeSupplierArticle(input.supplier, input.article);
        return reply({ ok: true });
      case 'entry': {
        if (!isId(input.supplier) || !isId(input.key)) return reply({ error: 'Ongeldige invoer.' }, 400);
        if (!ENTRY_TYPES.includes(input.type)) return reply({ error: 'Onbekend boekingstype.' }, 400);
        if (input.purchase_order != null && !isId(input.purchase_order)) return reply({ error: 'Ongeldige inkooporder.' }, 400);
        const allocations = Array.isArray(input.allocations)
          ? input.allocations.filter((a: unknown): a is { invoice_entry_id: number; amount_cents: number } => !!a && typeof a === 'object'
            && Number.isSafeInteger((a as Record<string, unknown>).invoice_entry_id) && Number.isSafeInteger((a as Record<string, unknown>).amount_cents))
          : null;
        const id = await postSupplierEntry({
          supplier: input.supplier, type: input.type, amount_cents: Number(input.amount_cents), key: input.key,
          entry_date: typeof input.entry_date === 'string' ? input.entry_date : null, due_date: typeof input.due_date === 'string' ? input.due_date : null,
          invoice_ref: typeof input.invoice_ref === 'string' ? input.invoice_ref : null, purchase_order: input.purchase_order ?? null,
          vat_cents: optionalInt(input.vat_cents), note: typeof input.note === 'string' ? input.note : null, allocations,
        }, user);
        return reply({ id });
      }
      case 'reverse':
        if (!Number.isSafeInteger(input.entry) || !isId(input.key)) return reply({ error: 'Ongeldige invoer.' }, 400);
        await reverseSupplierEntry(input.entry, input.key, user, typeof input.note === 'string' ? input.note : undefined);
        return reply({ ok: true });
      default:
        return reply({ error: 'Onbekende actie.' }, 400);
    }
  } catch (error) {
    if (error instanceof StockError) return reply({ error: error.message }, error.status);
    throw error;
  }
}
