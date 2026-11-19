/**
 * The shared secret between the voice agent and this API.
 *
 * ElevenLabs sends a bearer token it holds as a secret; we check it here. Not a
 * user session: the agent is not a person, it has no role, and it must never be
 * able to reach anything a signed-in employee can reach. Everything it is
 * allowed to do is the four routes under /api/agent, and each of those decides
 * for itself what it will answer.
 *
 * Failing closed matters more here than anywhere else in the app. With no
 * secret configured this returns false, so a deployment that forgot the
 * environment variable serves nobody rather than serving everybody.
 */

export type AgentAuth = { ok: true } | { ok: false; status: number; error: string };

/** Constant-time-ish compare, so a wrong token leaks no timing. */
function same(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function checkAgent(request: Request): AgentAuth {
  const secret = process.env.AGENT_API_TOKEN;
  if (!secret || secret.length < 24) {
    // Not "misconfigured" to the caller — it learns nothing about why.
    return { ok: false, status: 503, error: 'Niet beschikbaar' };
  }

  const header = request.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token || !same(token, secret)) {
    return { ok: false, status: 401, error: 'Geen toegang' };
  }

  return { ok: true };
}

/* ── reading what the agent sends ────────────────────────────────────── */

export const asText = (value: unknown, max = 80): string | null => {
  if (typeof value !== 'string') return null;
  const text = value.replace(/\s+/g, ' ').trim();
  return text && text.length <= max ? text : null;
};

export const asYear = (value: unknown): number | null => {
  const n = typeof value === 'number' ? value : Number(String(value ?? '').trim());
  if (!Number.isInteger(n)) return null;
  return n >= 1950 && n <= new Date().getFullYear() + 1 ? n : null;
};

/**
 * A spoken yes or no.
 *
 * The agent transcribes speech, so this has to survive "ja", "jawel", "klopt",
 * "nee hoor" — and an unanswered question has to stay unanswered rather than
 * defaulting to false, because false is an answer with consequences.
 */
export const asBool = (value: unknown): boolean | null => {
  if (typeof value === 'boolean') return value;
  const text = String(value ?? '').toLowerCase().trim();
  if (!text) return null;
  if (/^(ja|jawel|klopt|zeker|yes|true|1)\b/.test(text)) return true;
  if (/^(nee|neen|nope|no|false|0)\b/.test(text)) return false;
  return null;
};

/** A Dutch postcode in any of the ways someone says it. */
export const asPostcode = (value: unknown): string | null => {
  const text = String(value ?? '').toUpperCase().replace(/\s+/g, '');
  return /^\d{4}[A-Z]{0,2}$/.test(text) ? text : null;
};
