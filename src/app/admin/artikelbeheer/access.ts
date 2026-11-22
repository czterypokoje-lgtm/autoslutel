import 'server-only';
import { notFound } from 'next/navigation';
import { WAREHOUSE } from '@/config/install';
import { CRM_PREVIEW } from '@/lib/supabase/env';
import { requireOfficeUser } from '@/lib/crmSession';

/**
 * Artikelbeheer (product master data) is office-only: the grid, the import
 * and the export all carry purchase prices. Warehouse installs only; the
 * local preview has no database behind it.
 */
export async function requireMasterDataUser(path: string) {
  if (!WAREHOUSE || CRM_PREVIEW) notFound();
  return requireOfficeUser(path);
}
