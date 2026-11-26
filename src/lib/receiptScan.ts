import 'server-only';
import Anthropic from '@anthropic-ai/sdk';

/**
 * Read a bon or factuur (photo or PDF) into the fields of an expense.
 *
 * Claude reads the file directly — images as image blocks, PDFs as document
 * blocks — and answers in a fixed JSON shape. Nothing is saved here; the
 * caller stores the file first and shows the result for a human to confirm.
 * A reading that fails returns null and the expense is typed by hand, as
 * before. Model: Sonnet is plenty for a receipt and a third of the price.
 */

export const EXPENSE_CATEGORY_IDS = ['fuel', 'parking', 'toll', 'meals', 'vehicle_maintenance', 'tool_subscription', 'phone', 'advertising', 'supplier', 'office', 'insurance', 'rent', 'training', 'other'] as const;
export type ExpenseCategoryId = (typeof EXPENSE_CATEGORY_IDS)[number];

export interface ReceiptReading {
  supplier: string | null;
  /** yyyy-mm-dd */
  date: string | null;
  /** Total paid, VAT included, in euro. */
  total: number | null;
  vatAmount: number | null;
  vatRate: number | null;
  invoiceNumber: string | null;
  category: ExpenseCategoryId;
  /** One line for the expense list, Dutch. */
  description: string;
  /** 0..1, the model's own confidence in the total and date. */
  confidence: number;
  /** The readable text of the document, for search. */
  text: string;
}

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
type ImageType = (typeof IMAGE_TYPES)[number];
/** Anthropic's limits: 5 MB per image, 32 MB per PDF. */
const MAX_IMAGE = 5 * 1024 * 1024;
const MAX_PDF = 32 * 1024 * 1024;

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['supplier', 'date', 'total', 'vat_amount', 'vat_rate', 'invoice_number', 'category', 'description', 'confidence', 'text'],
  properties: {
    supplier: { type: ['string', 'null'], description: 'Name of the shop or company that was paid' },
    date: { type: ['string', 'null'], description: 'Purchase or invoice date as YYYY-MM-DD' },
    total: { type: ['number', 'null'], description: 'Total amount paid including VAT, in euro' },
    vat_amount: { type: ['number', 'null'] },
    vat_rate: { type: ['number', 'null'], description: 'VAT percentage, e.g. 21 or 9' },
    invoice_number: { type: ['string', 'null'] },
    category: { type: 'string', enum: [...EXPENSE_CATEGORY_IDS] },
    description: { type: 'string', description: 'Short Dutch line: what was bought and where, max 80 characters' },
    confidence: { type: 'number' },
    text: { type: 'string', description: 'All readable text of the document, plain, max 4000 characters' },
  },
} as const;

const SYSTEM = `Je leest kassabonnen, facturen en betaalbewijzen voor de administratie van een Nederlands autosleutelbedrijf (monteurs aan huis, webshop, kantoor).
Haal de velden uit het document. Bedragen in euro met punt als decimaalteken. Datum als YYYY-MM-DD; staat er geen jaartal, neem het huidige jaar.
Categorieën: fuel (brandstof), parking, toll, meals (eten en drinken), vehicle_maintenance (auto onderhoud, banden, wasstraat), tool_subscription (software, abonnementen, hosting, gereedschap), phone, advertising (Google, Meta, Microsoft advertenties), supplier (onderdelen, sleutels, leveranciers, verzendkosten), office (kantoorartikelen, porto), insurance, rent, training, other.
Is iets niet leesbaar, geef null. Verzin niets. confidence is jouw zekerheid over totaal en datum, 0 tot 1.`;

export function aiReaderConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** HEIC/HEIF from an iPhone becomes JPEG; everything else passes through. */
export async function normaliseImage(bytes: Uint8Array, mimeType: string): Promise<{ bytes: Uint8Array; mimeType: string }> {
  if (mimeType === 'image/heic' || mimeType === 'image/heif') {
    const convert = (await import('heic-convert')).default;
    const out = await convert({ buffer: Buffer.from(bytes) as unknown as ArrayBuffer, format: 'JPEG', quality: 0.82 });
    return { bytes: new Uint8Array(out as ArrayBuffer), mimeType: 'image/jpeg' };
  }
  return { bytes, mimeType };
}

export async function scanReceipt(bytes: Uint8Array, mimeType: string): Promise<ReceiptReading | null> {
  if (!aiReaderConfigured()) return null;
  const isPdf = mimeType === 'application/pdf';
  if (!isPdf && !IMAGE_TYPES.includes(mimeType as ImageType)) return null;
  if (bytes.byteLength > (isPdf ? MAX_PDF : MAX_IMAGE)) return null;

  const data = Buffer.from(bytes).toString('base64');
  const block = isPdf
    ? { type: 'document' as const, source: { type: 'base64' as const, media_type: 'application/pdf' as const, data } }
    : { type: 'image' as const, source: { type: 'base64' as const, media_type: mimeType as ImageType, data } };

  const client = new Anthropic({ timeout: 60_000, maxRetries: 1 });
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 3_000,
      system: SYSTEM,
      messages: [{ role: 'user', content: [block, { type: 'text', text: `Vandaag is ${new Date().toISOString().slice(0, 10)}. Lees dit document.` }] }],
      output_config: { format: { type: 'json_schema', schema: SCHEMA as unknown as Record<string, unknown> } },
    });
    const text = response.content.find((b) => b.type === 'text')?.text ?? '';
    const p = JSON.parse(text) as Record<string, unknown>;
    const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v * 100) / 100 : null);
    const str = (v: unknown, max: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);
    const date = str(p.date, 10);
    return {
      supplier: str(p.supplier, 120),
      date: date && /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date)) ? date : null,
      total: num(p.total),
      vatAmount: num(p.vat_amount),
      vatRate: num(p.vat_rate),
      invoiceNumber: str(p.invoice_number, 60),
      category: (EXPENSE_CATEGORY_IDS as readonly string[]).includes(String(p.category)) ? (p.category as ExpenseCategoryId) : 'other',
      description: str(p.description, 120) ?? '',
      confidence: Math.max(0, Math.min(1, num(p.confidence) ?? 0)),
      text: str(p.text, 4000) ?? '',
    };
  } catch (error) {
    console.error('[receipt-scan] reading failed:', error instanceof Error ? error.message : error);
    return null;
  }
}
