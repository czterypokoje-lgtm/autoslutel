import 'server-only';
import { toE164NL } from '@/lib/phone';
import { afterInbound } from './handleInbound';
import { addMessage, formThread, normaliseEmail } from './store';

/**
 * A website form submission becomes a thread so the office can answer it from
 * the same screen as WhatsApp and e-mail. Called from /api/leads after the
 * lead is committed; the lead alert has already gone out, so no second ping.
 */
export async function recordFormSubmission(input: {
  leadId: string | null;
  source: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  fields: Record<string, string | null | undefined>;
}): Promise<void> {
  const lines = Object.entries(input.fields)
    .filter(([, v]) => typeof v === 'string' && v.trim())
    .map(([k, v]) => `${k}: ${String(v).trim()}`);
  if (!lines.length) return;
  const thread = await formThread({
    leadId: input.leadId,
    phone: toE164NL(input.phone),
    email: normaliseEmail(input.email),
    name: input.name,
    subject: `Formulier: ${input.source}`,
  });
  const message = await addMessage(thread, {
    direction: 'in',
    author: 'customer',
    body: lines.join('\n'),
    external_id: input.leadId ? `lead:${input.leadId}` : null,
    meta: { source: input.source },
  });
  if (message) await afterInbound(thread, message, { notify: false });
}
