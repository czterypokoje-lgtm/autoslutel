import { NextResponse } from 'next/server';
import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { aiReaderConfigured, normaliseImage, scanReceipt } from '@/lib/receiptScan';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/heic': 'heic', 'image/heif': 'heif', 'application/pdf': 'pdf' };
const MAX_BYTES = 12 * 1024 * 1024;

/**
 * Step one of a new expense: store the bon or factuur in the private
 * `facturen` bucket, read it, and hand the form a draft to confirm. The file
 * is kept even when the reading fails — the proof is what cannot be redone.
 * Path `<technician_id | user id>/<uuid>.<ext>`, the layout the bucket
 * policies and the Telegram bot already use.
 */
export async function POST(request: Request) {
  const user = await requireCrmUser();
  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'Geen bestand ontvangen' }, { status: 400 });
  const ext = EXT[file.type];
  if (!ext) return NextResponse.json({ error: 'Stuur een foto (jpg, png, heic) of een pdf.' }, { status: 415 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'Het bestand is groter dan 12 MB.' }, { status: 413 });

  const supabase = await createSupabaseServerClient();
  const { data: me } = user.role === 'monteur' ? await supabase.from('technicians').select('id').eq('user_id', user.id).maybeSingle() : { data: null };
  const owner = me?.id ?? user.id;

  let bytes: Uint8Array = new Uint8Array(await file.arrayBuffer());
  let mimeType = file.type;
  if (mimeType !== 'application/pdf') {
    try { ({ bytes, mimeType } = await normaliseImage(bytes, mimeType)); } catch (e) { console.warn('[receipt-scan] image conversion failed', e); }
  }
  const objectPath = `${owner}/${crypto.randomUUID()}.${mimeType === 'image/jpeg' ? 'jpg' : ext}`;
  const admin = createSupabaseAdminClient();
  const { error: storeError } = await admin.storage.from('facturen').upload(objectPath, bytes, { contentType: mimeType, upsert: false });
  if (storeError) return NextResponse.json({ error: `Opslaan mislukt: ${storeError.message}` }, { status: 500 });

  const reading = await scanReceipt(bytes, mimeType);
  return NextResponse.json({
    receipt_url: objectPath,
    reading,
    note: reading ? null : aiReaderConfigured() ? 'Het document kon niet worden gelezen; vul de velden zelf in. De bon is wel opgeslagen.' : 'Automatisch lezen staat uit (ANTHROPIC_API_KEY ontbreekt); vul de velden zelf in.',
  });
}
