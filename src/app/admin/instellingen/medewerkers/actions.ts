'use server';

import { headers } from 'next/headers';
import { WAREHOUSE } from '@/config/install';
import { getCrmUser, type CrmUser } from '@/lib/crmSession';
import { CRM_PREVIEW } from '@/lib/supabase/env';
import {
  inviteStaff, resendInvite, setStaffDisabled, setStaffPrices, setStaffRole, StaffError, type Invite,
} from '@/lib/kfcStaff';

/*
 * Owner-only staff actions. Each re-checks the session (server actions are
 * plain POST endpoints) and the library refuses anything that would lock the
 * owner out.
 */

export type StaffResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

async function run<T>(work: (user: CrmUser) => Promise<T>): Promise<StaffResult<T>> {
  if (!WAREHOUSE || CRM_PREVIEW) return { ok: false, error: 'Niet beschikbaar op deze installatie.' };
  const user = await getCrmUser();
  if (user?.role !== 'owner') return { ok: false, error: 'Alleen de eigenaar beheert medewerkers.' };
  try {
    return { ok: true, data: await work(user) };
  } catch (error) {
    if (error instanceof StaffError) return { ok: false, error: error.message };
    console.error('Medewerkers:', error);
    return { ok: false, error: 'Er ging iets mis. Probeer het opnieuw.' };
  }
}

/** Where the invite link lands: this CRM's own origin (Supabase checks it against its redirect allow-list). */
async function origin(): Promise<string> {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  if (host) return `${h.get('x-forwarded-proto') ?? 'https'}://${host}`;
  return process.env.NEXT_PUBLIC_SITE_URL ?? '';
}

export async function inviteStaffAction(input: { email: string; role: string; password?: string; prices?: boolean }) {
  return run<Invite>(async (user) => inviteStaff(input, user, await origin()));
}

export async function setRoleAction(input: { id: string; role: string }) {
  return run((user) => setStaffRole(input, user));
}

export async function setPricesAction(input: { id: string; prices: boolean }) {
  return run((user) => setStaffPrices(input, user));
}

export async function setDisabledAction(input: { id: string; disabled: boolean }) {
  return run((user) => setStaffDisabled(input, user));
}

export async function resendInviteAction(input: { id: string }) {
  return run(async (user) => resendInvite(input, user, await origin()));
}
