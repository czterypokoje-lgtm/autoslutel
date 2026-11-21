import 'server-only';
import type { User } from '@supabase/supabase-js';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { IS_KEYFORCARS } from '@/config/install';
import { CRM_ROLES, type CrmRole, type CrmUser } from '@/lib/crmSession';

/*
 * Staff accounts for the warehouse installs (Instellingen › Medewerkers).
 *
 * A role lives in auth app_metadata.role (read by crmSession.ts), so only the
 * service-role key can set it and a user can never change their own. The
 * page is office-readable; every write here is owner-only and the caller
 * passes the signed-in owner so these functions can refuse to lock that
 * owner out (no self-demotion, no self-disable, never zero active owners).
 *
 * Monteur accounts are Autosleutel24's technician network: they are made and
 * linked on /admin/monteurs, never here, and KeyForCars has none.
 */

/** Roles an owner may hand out on this screen. */
export const STAFF_ROLES: readonly CrmRole[] = ['owner', 'kantoor', 'magazijn', 'inpak'];

export const ROLE_INFO: Record<CrmRole, { label: string; does: string }> = {
  owner: { label: 'Eigenaar', does: 'Alles, inclusief medewerkers, rollen en AI-budget.' },
  kantoor: { label: 'Kantoor', does: 'Alles behalve medewerkers beheren: bestellingen, klanten, inkoop, prijzen, rapporten.' },
  magazijn: { label: 'Magazijn', does: 'Voorraad, tellen, ontvangen, montage, kassa en retouren. Inkoopprijzen alleen als dat aan staat.' },
  inpak: { label: 'Inpak', does: 'Picklijst en verzenden. Geen prijzen.' },
  monteur: { label: 'Monteur', does: 'Eigen klussen en bus (alleen Autosleutel24; beheer via Monteurs).' },
};

export type StaffMember = {
  id: string; email: string; role: CrmRole | null; pricesAllowed: boolean; disabled: boolean;
  invited: boolean; lastSignIn: string | null; createdAt: string;
};

export class StaffError extends Error {
  constructor(message: string, readonly status = 400) { super(message); }
}

const auth = () => createSupabaseAdminClient().auth.admin;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const roleOf = (user: User): CrmRole | null => {
  const raw = user.app_metadata?.role;
  return typeof raw === 'string' && (CRM_ROLES as readonly string[]).includes(raw) ? (raw as CrmRole) : null;
};
const isDisabled = (user: User) => !!user.banned_until && new Date(user.banned_until).getTime() > Date.now();

function toMember(user: User): StaffMember {
  return {
    id: user.id, email: user.email ?? '', role: roleOf(user), pricesAllowed: user.app_metadata?.prices === true,
    disabled: isDisabled(user), invited: !user.last_sign_in_at && !user.email_confirmed_at,
    lastSignIn: user.last_sign_in_at ?? null, createdAt: user.created_at,
  };
}

async function allUsers(): Promise<User[]> {
  const users: User[] = [];
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await auth().listUsers({ page, perPage: 1000 });
    if (error) throw new StaffError(`Medewerkers ophalen mislukt: ${error.message}`, 500);
    users.push(...data.users);
    if (data.users.length < 1000) break;
  }
  return users;
}

/** Everyone with a CRM role (or none yet), monteurs only on Autosleutel24. */
export async function listStaff(): Promise<StaffMember[]> {
  return (await allUsers())
    .map(toMember)
    .filter((m) => m.email && (m.role === null || m.role !== 'monteur' || !IS_KEYFORCARS))
    .sort((a, b) => (STAFF_ROLES.indexOf(a.role ?? 'monteur') - STAFF_ROLES.indexOf(b.role ?? 'monteur')) || a.email.localeCompare(b.email));
}

function requireOwner(actor: CrmUser) {
  if (actor.role !== 'owner') throw new StaffError('Alleen de eigenaar beheert medewerkers.', 403);
}

async function target(id: unknown, actor: CrmUser): Promise<User> {
  if (typeof id !== 'string' || !UUID.test(id)) throw new StaffError('Onbekende medewerker.', 404);
  if (id === actor.id) throw new StaffError('Je kunt je eigen account hier niet wijzigen.', 409);
  const { data, error } = await auth().getUserById(id);
  if (error || !data.user) throw new StaffError('Onbekende medewerker.', 404);
  if (roleOf(data.user) === 'monteur') throw new StaffError('Monteurs worden beheerd onder Monteurs.', 409);
  return data.user;
}

async function activeOwners(): Promise<number> {
  return (await allUsers()).filter((u) => roleOf(u) === 'owner' && !isDisabled(u)).length;
}

function parseRole(value: unknown): CrmRole {
  if (typeof value !== 'string' || !(STAFF_ROLES as readonly string[]).includes(value)) throw new StaffError('Kies een geldige rol.');
  return value as CrmRole;
}

export type Invite = { member: StaffMember; link: string | null };

/**
 * Invite link (to send over WhatsApp, as the technician invite does) or, when
 * the owner types one, a password: generateLink needs no mail delivery.
 */
export async function inviteStaff(input: { email: unknown; role: unknown; password?: unknown; prices?: unknown }, actor: CrmUser, origin: string): Promise<Invite> {
  requireOwner(actor);
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) throw new StaffError('Vul een geldig e-mailadres in.');
  const role = parseRole(input.role);
  const password = typeof input.password === 'string' ? input.password : '';
  if (password && (password.length < 10 || password.length > 72)) throw new StaffError('Een wachtwoord heeft 10 tot 72 tekens.');
  const app_metadata = { role, prices: role === 'magazijn' && input.prices === true };

  let user: User;
  let link: string | null = null;
  if (password) {
    const { data, error } = await auth().createUser({ email, password, email_confirm: true, app_metadata });
    if (error || !data.user) throw new StaffError('Uitnodigen mislukt. Bestaat dit e-mailadres al?', 409);
    user = data.user;
  } else {
    const { data, error } = await auth().generateLink({ type: 'invite', email, options: { redirectTo: `${origin}/admin/auth/callback` } });
    if (error || !data.user) throw new StaffError('Uitnodigen mislukt. Bestaat dit e-mailadres al?', 409);
    user = data.user;
    link = data.properties?.action_link ?? null;
    const { data: updated, error: roleError } = await auth().updateUserById(user.id, { app_metadata });
    if (roleError || !updated.user) {
      await auth().deleteUser(user.id);
      throw new StaffError('Rol toekennen mislukt.', 500);
    }
    user = updated.user;
  }
  return { member: toMember(user), link };
}

export async function setStaffRole(input: { id: unknown; role: unknown }, actor: CrmUser) {
  requireOwner(actor);
  const user = await target(input.id, actor);
  const role = parseRole(input.role);
  if (roleOf(user) === 'owner' && role !== 'owner' && (await activeOwners()) <= 1) throw new StaffError('Er moet minstens één eigenaar overblijven.', 409);
  const prices = role === 'magazijn' && user.app_metadata?.prices === true;
  const { error } = await auth().updateUserById(user.id, { app_metadata: { ...user.app_metadata, role, prices } });
  if (error) throw new StaffError('Rol wijzigen mislukt.', 500);
}

export async function setStaffPrices(input: { id: unknown; prices: unknown }, actor: CrmUser) {
  requireOwner(actor);
  const user = await target(input.id, actor);
  if (roleOf(user) !== 'magazijn') throw new StaffError('Inkoopprijzen aanzetten kan alleen voor magazijn; kantoor en eigenaar zien ze al, inpak nooit.', 409);
  const { error } = await auth().updateUserById(user.id, { app_metadata: { ...user.app_metadata, prices: input.prices === true } });
  if (error) throw new StaffError('Opslaan mislukt.', 500);
}

/**
 * Disable = a ban: the user cannot sign in or refresh a session. An access
 * token already issued stays valid until it expires (at most an hour), but
 * getCrmUser revalidates with the Auth server on every request.
 */
export async function setStaffDisabled(input: { id: unknown; disabled: unknown }, actor: CrmUser) {
  requireOwner(actor);
  const user = await target(input.id, actor);
  const disable = input.disabled === true;
  if (disable && roleOf(user) === 'owner' && (await activeOwners()) <= 1) throw new StaffError('Er moet minstens één actieve eigenaar overblijven.', 409);
  const { error } = await auth().updateUserById(user.id, { ban_duration: disable ? '876000h' : 'none' });
  if (error) throw new StaffError(disable ? 'Uitschakelen mislukt.' : 'Inschakelen mislukt.', 500);
}

/** A fresh one-time link for someone who never signed in or lost the first one. */
export async function resendInvite(input: { id: unknown }, actor: CrmUser, origin: string): Promise<string | null> {
  requireOwner(actor);
  const user = await target(input.id, actor);
  if (!user.email) throw new StaffError('Deze medewerker heeft geen e-mailadres.');
  const type = user.last_sign_in_at || user.email_confirmed_at ? 'recovery' : 'invite';
  const { data, error } = await auth().generateLink({ type, email: user.email, options: { redirectTo: `${origin}/admin/auth/callback` } });
  if (error) throw new StaffError('Nieuwe link maken mislukt.', 500);
  return data.properties?.action_link ?? null;
}
