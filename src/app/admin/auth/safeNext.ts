/**
 * Only ever redirect back into the CRM.
 *
 * `next` arrives from a query string and, after the magic-link round trip, from
 * an email. Without this an attacker could mail a login link that lands the
 * user on their own domain with a fresh session in the address bar.
 */
export function safeNext(value: string | null | undefined): string {
  if (typeof value !== 'string') return '/admin/leads';
  // Reject protocol-relative (`//evil.com`) and absolute URLs outright.
  if (!value.startsWith('/admin') || value.startsWith('//')) return '/admin/leads';
  return value;
}
