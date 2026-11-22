import { WAREHOUSE } from '@/config/install';
import { requireOfficeUserApi } from '@/lib/crmSession';
import { CRM_PREVIEW } from '@/lib/supabase/env';
import { applyImport, MasterError, MAX_IMPORT_BYTES, planImport, type MatchBy } from '@/lib/kfcProductMaster';

export const dynamic = 'force-dynamic';

const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

/**
 * Article import (multipart): file, match = sku | ean, mode = plan | apply,
 * checksum (apply only: the one the dry run returned). A route handler rather
 * than a server action because files can be larger than the action body limit.
 */
export async function POST(request: Request) {
  if (!WAREHOUSE || CRM_PREVIEW) return reply({ error: 'Niet beschikbaar.' }, 404);
  const { user, response } = await requireOfficeUserApi();
  if (response) return response;
  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  if (!form || !(file instanceof File)) return reply({ error: 'Kies een bestand.' }, 400);
  if (file.size > MAX_IMPORT_BYTES) return reply({ error: 'Het bestand is groter dan 5 MB.' }, 413);
  const match: MatchBy = form.get('match') === 'ean' ? 'ean' : 'sku';
  const mode = form.get('mode') === 'apply' ? 'apply' : 'plan';
  const bytes = Buffer.from(await file.arrayBuffer());
  const name = file.name.replace(/[^\w .()\-]/g, '_').slice(0, 200) || 'import.csv';
  try {
    if (mode === 'plan') return reply({ plan: await planImport(bytes, name, match) });
    const checksum = String(form.get('checksum') ?? '');
    if (!/^[0-9a-f]{64}$/.test(checksum)) return reply({ error: 'Doe eerst een proefrun.' }, 400);
    return reply({ result: await applyImport(bytes, name, match, checksum, user) });
  } catch (error) {
    if (error instanceof MasterError) return reply({ error: error.message }, error.status);
    console.error('Artikelimport:', error);
    return reply({ error: 'De import is mislukt.' }, 500);
  }
}
