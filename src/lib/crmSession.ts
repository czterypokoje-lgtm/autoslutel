import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * The CRM's Data Access Layer.
 *
 * Next's own guidance is that proxy.ts does an optimistic cookie check only,
 * and that real authorisation happens as close to the data as possible. This
 * module is that place: every /admin page and every /api/admin route starts
 * here.
 *
 * `supabase.auth.getUser()` — not `getSession()` — because getUser revalidates
 * the token against the Auth server. A forged or stale cookie fails here.
 */

export const CRM_ROLES = ['owner', 'kantoor', 'monteur'] as const;
export type CrmRole = (typeof CRM_ROLES)[number];

/** Roles allowed to see leads, jobs, orders and invoices. */
export const OFFICE_ROLES: readonly CrmRole[] = ['owner', 'kantoor'];

export interface CrmUser {
  id: string;
  email: string | null;
  role: CrmRole | null;
}

function readRole(appMetadata: Record<string, unknown> | undefined): CrmRole | null {
  const raw = appMetadata?.role;
  return typeof raw === 'string' && (CRM_ROLES as readonly string[]).includes(raw)
    ? (raw as CrmRole)
    : null;
}

/** The signed-in CRM user, or null. Never throws. */
export async function getCrmUser(): Promise<CrmUser | null> {
  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    // Auth not configured on this deployment. Fail closed: nobody is signed in.
    return null;
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  return {
    id: data.user.id,
    email: data.user.email ?? null,
    role: readRole(data.user.app_metadata),
  };
}

/**
 * For pages. Redirects instead of returning null.
 *
 * A signed-in user with no role, or with `monteur`, is not an error — it is
 * someone who is authenticated but not authorised for this surface. They get
 * the no-access page, not the login page, so they are not stuck in a loop.
 */
export async function requireOfficeUser(returnTo?: string): Promise<CrmUser> {
  const user = await getCrmUser();

  if (!user) {
    const next = returnTo ? `?next=${encodeURIComponent(returnTo)}` : '';
    redirect(`/admin/login${next}`);
  }

  if (!user.role || !OFFICE_ROLES.includes(user.role)) {
    redirect('/admin/geen-toegang');
  }

  return user;
}

/**
 * For pages any signed-in CRM user may open, whatever their role — the
 * monteur's own day screen being the one that matters. A user with no role at
 * all is still turned away: an account exists, but nobody decided what it is.
 */
export async function requireCrmUser(returnTo?: string): Promise<CrmUser> {
  const user = await getCrmUser();

  if (!user) {
    const next = returnTo ? `?next=${encodeURIComponent(returnTo)}` : '';
    redirect(`/admin/login${next}`);
  }

  if (!user.role) redirect('/admin/geen-toegang');

  return user;
}

/** Where a role belongs when it lands on /admin with nothing more specific. */
export function homeForRole(role: CrmRole | null): string {
  return role === 'monteur' ? '/admin/vandaag' : '/admin/leads';
}

/**
 * For route handlers. Returns a 401/403 Response instead of redirecting, so
 * fetch callers get a status code rather than an HTML login page.
 */
export async function requireOfficeUserApi(): Promise<
  { user: CrmUser; response?: never } | { user?: never; response: Response }
> {
  const user = await getCrmUser();

  if (!user) {
    return {
      response: Response.json({ error: 'Niet ingelogd' }, { status: 401 }),
    };
  }

  if (!user.role || !OFFICE_ROLES.includes(user.role)) {
    return {
      response: Response.json({ error: 'Geen toegang' }, { status: 403 }),
    };
  }

  return { user };
}
