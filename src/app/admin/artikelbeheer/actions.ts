'use server';

import { WAREHOUSE } from '@/config/install';
import { getCrmUser, OFFICE_ROLES, type CrmUser } from '@/lib/crmSession';
import { CRM_PREVIEW } from '@/lib/supabase/env';
import {
  createCategory, deleteCategory, MasterError, mergeCategory, moveCategory, saveArticleChanges, updateCategory,
} from '@/lib/kfcProductMaster';

/*
 * Server actions for Artikelbeheer. They are reachable by a direct POST, so
 * each one checks the session itself. Results, not throws: a thrown error is
 * masked in production and the screen would only say "something went wrong".
 */

export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

async function run<T>(work: (user: CrmUser) => Promise<T>): Promise<ActionResult<T>> {
  if (!WAREHOUSE || CRM_PREVIEW) return { ok: false, error: 'Niet beschikbaar op deze installatie.' };
  const user = await getCrmUser();
  if (!user?.role || !OFFICE_ROLES.includes(user.role)) return { ok: false, error: 'Geen toegang.' };
  try {
    return { ok: true, data: await work(user) };
  } catch (error) {
    if (error instanceof MasterError) return { ok: false, error: error.message };
    console.error('Artikelbeheer:', error);
    return { ok: false, error: 'Er ging iets mis. Probeer het opnieuw.' };
  }
}

export async function addCategoryAction(input: { name: string; parent_id: string | null }) {
  return run(() => createCategory(input));
}

export async function updateCategoryAction(input: { id: string; name?: string; vat_rate?: string | number; default_margin_pct?: string | number | null; sort?: number }) {
  return run(() => updateCategory(input));
}

export async function moveCategoryAction(input: { id: string; parent_id: string | null }) {
  return run(() => moveCategory(input));
}

export async function mergeCategoryAction(input: { from: string; into: string }) {
  return run(() => mergeCategory(input));
}

export async function deleteCategoryAction(input: { id: string }) {
  return run(() => deleteCategory(input));
}

export async function saveArticlesAction(changes: unknown) {
  return run((user) => saveArticleChanges(changes, user));
}
