import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { parseInvoiceText, readInvoiceHeader } from '@/lib/invoiceLines';

export const dynamic = 'force-dynamic';
/** pdf-parse is a Node library; it cannot run on the edge runtime. */
export const runtime = 'nodejs';

const MAX_BYTES = 12 * 1024 * 1024;

const ALLOWED: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

/**
 * A purchase invoice, and the stock it proposes.
 *
 * The file is always kept — it is the proof behind every number that follows.
 * A PDF with a text layer (which is what every supplier portal produces) is
 * read into candidate lines; a photograph is stored and its lines are typed,
 * because guessing at a picture is exactly the kind of confidence this feature
 * must not have.
 *
 * Nothing here touches stock. Lines arrive unconfirmed, and only
 * crm_confirm_invoice() — after a person has ticked them — moves anything.
 */
export async function POST(request: Request) {
  const user = await requireCrmUser();

  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Geen bestand ontvangen' }, { status: 400 });
  }

  const extension = ALLOWED[file.type];
  if (!extension) {
    return NextResponse.json(
      { error: 'Alleen een PDF of een foto (JPG, PNG, HEIC).' },
      { status: 415 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Bestand is groter dan 12 MB.' }, { status: 413 });
  }

  const supabase = await createSupabaseServerClient();

  /*
   * Whose van this stocks. The office may file an invoice on someone's behalf;
   * a monteur may only file their own, and the id is read from their session
   * rather than taken from the form.
   */
  let technicianId: string | null = null;
  if (user.role === 'monteur') {
    const { data } = await supabase
      .from('technicians')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (!data) {
      return NextResponse.json({ error: 'Uw login is niet aan een monteur gekoppeld.' }, { status: 400 });
    }
    technicianId = data.id;
  } else {
    const asked = form?.get('technician_id');
    technicianId = typeof asked === 'string' && asked ? asked : null;
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  /* ── read it, if it can be read ── */
  let text = '';
  if (file.type === 'application/pdf') {
    try {
      // pdf-parse v2 is a class, not the callable default of v1.
      const { PDFParse } = await import('pdf-parse');
      const parser = new PDFParse({ data: new Uint8Array(bytes) });
      const parsed = await parser.getText();
      text = parsed?.text ?? '';
      await parser.destroy();
    } catch (error) {
      // A scanned PDF has no text layer. Not a failure: the file is still
      // stored and the lines get typed, same as a photograph.
      console.warn('PDF text extraction failed:', error instanceof Error ? error.message : error);
    }
  }

  const lines = text ? parseInvoiceText(text) : [];
  const header = text ? readInvoiceHeader(text) : { invoiceNumber: null, invoiceDate: null, supplier: null };

  /* ── keep the paper ── */
  let fileUrl: string;
  try {
    const blob = await put(`facturen/${crypto.randomUUID()}.${extension}`, bytes, {
      access: 'public',
      contentType: file.type,
    });
    fileUrl = blob.url;
  } catch (error) {
    console.error('Invoice upload failed:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Opslaan van het bestand mislukt.' }, { status: 502 });
  }

  const { data: invoice, error } = await supabase
    .from('purchase_invoices')
    .insert({
      technician_id: technicianId,
      uploaded_by: user.id,
      supplier: header.supplier,
      invoice_number: header.invoiceNumber,
      invoice_date: header.invoiceDate,
      file_url: fileUrl,
      file_type: file.type,
      status: lines.length ? 'gelezen' : 'nieuw',
      extracted: text ? { lines, header } : null,
    })
    .select('id, status')
    .single();

  if (error || !invoice) {
    return NextResponse.json(
      {
        error: /does not exist|relation/i.test(error?.message ?? '')
          ? 'Voer supabase/migrations/0019_purchase_invoices.sql uit.'
          : `Opslaan mislukt: ${error?.message ?? 'onbekend'}`,
      },
      { status: 500 }
    );
  }

  if (lines.length) {
    const { error: lineError } = await supabase.from('purchase_invoice_lines').insert(
      lines.map((line, index) => ({
        invoice_id: invoice.id,
        line_no: index,
        description: line.description,
        article_code: line.articleCode,
        quantity: line.quantity,
        unit_price: line.unitPrice,
        matched_slug: line.matchedSlug,
        /*
         * Never pre-ticked, not even on an exact article-number match. The
         * whole safety of this feature is that a person looked at the list.
         */
        confirmed: false,
      }))
    );
    if (lineError) console.error('Invoice lines insert failed:', lineError.message);
  }

  return NextResponse.json(
    {
      id: invoice.id,
      lines: lines.length,
      supplier: header.supplier,
      invoiceNumber: header.invoiceNumber,
      say: lines.length
        ? `${lines.length} regel(s) gelezen. Controleer ze en vink aan wat klopt.`
        : 'Bestand opgeslagen. Er kon geen tekst uit gelezen worden — voeg de regels handmatig toe.',
    },
    { status: 201 }
  );
}
