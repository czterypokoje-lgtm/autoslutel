/**
 * Authorisation for internal/admin surfaces (offline-conversions dashboard,
 * account page, lead export).
 *
 * Two accepted credentials:
 *   1. `Authorization: Bearer <EXPORT_SECRET>`  — for cron jobs and scripts.
 *   2. HTTP Basic with ADMIN_USER / ADMIN_PASSWORD — for a person in a browser.
 *
 * Basic auth is what keeps the dashboard working: once the browser has been
 * challenged for /offline-conversions it re-sends the credentials on the
 * same-origin fetch to /api/export-conversions automatically.
 *
 * Required environment variables (set these in Vercel before deploying):
 *   EXPORT_SECRET, ADMIN_USER, ADMIN_PASSWORD
 */

/** Constant-time string compare, so a wrong secret cannot be timed out byte by byte. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function isAuthorized(request: Request): boolean {
  const header = request.headers.get('authorization');
  if (!header) return false;

  if (header.startsWith('Bearer ')) {
    const secret = process.env.EXPORT_SECRET;
    if (!secret) return false;
    return safeEqual(header.slice(7), secret);
  }

  if (header.startsWith('Basic ')) {
    const user = process.env.ADMIN_USER;
    const pass = process.env.ADMIN_PASSWORD;
    if (!user || !pass) return false;
    try {
      const decoded = atob(header.slice(6));
      const sep = decoded.indexOf(':');
      if (sep === -1) return false;
      return (
        safeEqual(decoded.slice(0, sep), user) &&
        safeEqual(decoded.slice(sep + 1), pass)
      );
    } catch {
      return false;
    }
  }

  return false;
}

/** True when the deployment has credentials configured at all. */
export function adminAuthConfigured(): boolean {
  return Boolean(
    process.env.EXPORT_SECRET ||
      (process.env.ADMIN_USER && process.env.ADMIN_PASSWORD)
  );
}
