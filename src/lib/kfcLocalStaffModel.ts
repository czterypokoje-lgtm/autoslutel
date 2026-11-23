import 'server-only';

import { reportIntents, type ReportIntent } from '@/lib/kfcStaffReports';

export type StaffIntent = 'chat' | 'order' | 'stock' | 'summary' | 'draft' | 'catalog_count' | ReportIntent;
export type StaffTurn = { role: 'user' | 'assistant'; content: string };

const intents = ['chat', 'order', 'stock', 'summary', 'draft', 'catalog_count', ...reportIntents];
const schema = {
  type: 'object',
  additionalProperties: false,
  required: ['intent', 'reference', 'text'],
  properties: {
    intent: { type: 'string', enum: intents },
    reference: { type: 'string' },
    text: { type: 'string' },
  },
};

const DUTCH = new Set(['de', 'het', 'een', 'ik', 'je', 'jij', 'niet', 'wat', 'kan', 'kun', 'met', 'voor', 'van', 'en', 'hoe', 'graag', 'helpen', 'waarmee', 'hallo', 'goedendag', 'bent', 'ben', 'wil', 'zijn', 'jou', 'u', 'uw']);
const ENGLISH = new Set(['the', 'a', 'an', 'you', 'your', 'not', 'what', 'can', 'with', 'for', 'of', 'and', 'how', 'help', 'hello', 'hi', 'am', 'are', 'i', 'would', 'like', 'today', 'it']);
/** True when a reply is clearly in the other panel language (old turns can pull the model off course). */
export function wrongLanguage(text: string, english: boolean) {
  const words = text.toLowerCase().match(/[a-zà-ÿ']+/g) ?? [];
  const dutch = words.filter((word) => DUTCH.has(word)).length;
  const englishWords = words.filter((word) => ENGLISH.has(word)).length;
  return english ? dutch >= 2 && dutch > englishWords : englishWords >= 2 && englishWords > dutch;
}

export async function askLocalStaffModel(message: string, history: unknown, english: boolean) {
  if (process.env.NODE_ENV !== 'development' && process.env.KFC_LOCAL_MODEL !== '1') return null;
  // Only turns written while the panel had the current language. Turns from before an
  // EN/NL switch (or without a language tag) would steer the reply into the old language.
  const language = english ? 'en' : 'nl';
  const turns: StaffTurn[] = Array.isArray(history) ? history.filter((turn) => turn?.lang === language).slice(-6).flatMap((turn) =>
    (turn?.role === 'user' || turn?.role === 'assistant') && typeof turn.content === 'string'
      ? [{ role: turn.role, content: turn.content.slice(0, 500) }]
      : []) : [];
  const prompt = [
    'You are KeyForCars Staff Assistant. Reply naturally and briefly in the language required below.',
    'Write the entire reply exclusively in ' + (english ? 'English' : 'Dutch (Flemish)') + ', even if the user writes in another language.',
    'Return an intent. Use order for a concrete order number, stock for a concrete product SKU, summary for a request to retrieve the latest saved conversation summary, draft for a request for a support email template, and catalog_count for overall product listing or category totals in the CRM catalog (not stock levels or counts within a specific category), otherwise chat.',
    'Use order_report for order and dispatch totals, stock_report for inventory availability, finance_report for open invoices or paid expenses, customer_report for customer account counts, and conversation_report for phone and WhatsApp counts. Periods, stores, statuses, channels and categories are applied by the CRM, so do not repeat them.',
    'For order or stock put the exact reference from the conversation in reference. Never invent a reference. For other intents reference is empty.',
    'For chat, answer greetings and questions about your functions. You have no access to CRM records yourself. Never invent facts about records, prices, stock, shipments, or claim to send messages or change any data. Ask for a reference when required.',
    'For requests routed to CRM, text is empty. Chat text should be one or two sentences.',
  ].join(' ');
  const response = await fetch('http://127.0.0.1:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    redirect: 'error',
    signal: AbortSignal.timeout(55000),
    body: JSON.stringify({
      model: 'qwen3:4b', stream: false, think: false, format: schema,
      messages: [{ role: 'system', content: prompt }, ...turns,
        { role: 'system', content: 'Reply language for this turn: ' + (english ? 'English' : 'Dutch (Flemish)') + '.' },
        { role: 'user', content: message }],
      options: { temperature: 0.2, num_ctx: 4096, num_predict: 150 },
    }),
  });
  if (!response.ok) return null;
  const body = await response.json();
  const result = JSON.parse(body.message?.content ?? '');
  if (!result || !intents.includes(result.intent) || typeof result.reference !== 'string' || typeof result.text !== 'string') return null;
  const intent = result.intent as StaffIntent;
  const reference = result.reference.trim();
  if (intent === 'order' || intent === 'stock') {
    if (!/^[a-z0-9_-]{1,40}$/i.test(reference)) return null;
    const pattern = new RegExp('(^|[^a-z0-9_-])' + reference + '(?![a-z0-9_-])', 'i');
    if (![message, ...turns.map((turn) => turn.content)].some((turn) => pattern.test(turn))) return null;
  }
  return { intent, reference, text: result.text.trim().slice(0, 600) };
}
