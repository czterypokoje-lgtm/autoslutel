/**
 * The shared knowledge table every AI agent reads (agent_knowledge).
 *
 * Pure functions only, no database import: the routes do the reads and writes
 * and hand rows in, so scripts/check-agent-knowledge.mts can test all of this
 * with plain Node.
 *
 * The one rule behind everything here: an agent may state a row only when the
 * owner confirmed it. Agents and the weekly review job can report a gap, never
 * fill one.
 */

export const TOPICS = [
  'prices', 'arrival', 'payment', 'warranty', 'service_area', 'hours',
  'documents', 'duration', 'cancellation', 'discount', 'shipping',
  'returns', 'order_status', 'key_types', 'company', 'other',
] as const;
export type Topic = (typeof TOPICS)[number];

export type Status = 'confirmed' | 'proposed' | 'unknown' | 'retired';

export type KnowledgeRow = {
  key: string;
  topic: string;
  question: string;
  answer: string | null;
  rule: string | null;
  status: Status | string;
  asked_count: number;
  last_asked_at: string | null;
  example: string | null;
  source: string | null;
  approved_at: string | null;
  updated_at?: string | null;
};

/** What an agent says when the table has no confirmed answer. Fixed on purpose. */
export const SAY_WHEN_UNKNOWN = 'Dat weet ik niet zeker. Een collega neemt contact met u op.';

export const isTopic = (value: unknown): value is Topic =>
  typeof value === 'string' && (TOPICS as readonly string[]).includes(value);

const isText = (value: unknown): value is string => typeof value === 'string';

/** Stable key from a topic and a question: 'prices.what_does_a_spare_key_cost'. */
export function slugKey(topic: string, question: string): string {
  const base = (isText(question) ? question : '')
    .slice(0, 200)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48)
    .replace(/_+$/g, '');
  const head = isTopic(topic) ? topic : 'other';
  return `${head}.${base || 'item'}`;
}

/* ── redaction ───────────────────────────────────────────────────────── */

const EMAIL = /[^\s@<>()]{1,64}@[^\s@<>()]{1,255}\.[a-z]{2,}/gi;
/* International (+31 / 0031) with any separators, or a Dutch 0-number of 10 digits. */
const PHONE = /(?:\+|00)\d[\d\s\-().]{7,18}\d|\b0\d(?:[\s-]?\d){8}\b/g;

/* Dutch plate shapes as groups of letters (L) and digits (D). */
const PLATE_SHAPES: string[][] = [
  ['LL', 'DD', 'DD'], ['DD', 'LL', 'DD'], ['DD', 'DD', 'LL'],
  ['LL', 'LL', 'DD'], ['DD', 'LL', 'LL'], ['LL', 'DD', 'LL'],
  ['DD', 'LLL', 'D'], ['D', 'LLL', 'DD'], ['LL', 'DDD', 'L'], ['L', 'DDD', 'LL'],
];
const group = (g: string) => g.split('').map((c) => (c === 'L' ? '[A-Z]' : '\\d')).join('');
const plateRe = (sep: string, flags: string) =>
  new RegExp(`\\b(?:${PLATE_SHAPES.map((s) => s.map(group).join(sep)).join('|')})\\b`, flags);
/* Uppercase plates may be written loosely; lowercase ones only with dashes, so
   ordinary words between numbers ("20 de 19") are not mistaken for a plate. */
const PLATE_LOOSE = plateRe('[\\s-]?', 'g');
const PLATE_DASHED = plateRe('-', 'gi');

const LONG_DIGITS = /\d{6,}/g;

/** One short customer phrasing with nothing that identifies the customer. */
export function redactExample(text: unknown): string {
  if (!isText(text)) return '';
  /* Cap first: bounds the work on hostile input. */
  let out = text.slice(0, 2000);
  out = out.replace(EMAIL, '[email]');
  out = out.replace(PHONE, '[phone]');
  out = out.replace(PLATE_DASHED, '[plate]').replace(PLATE_LOOSE, '[plate]');
  out = out.replace(LONG_DIGITS, '[number]');
  return out.replace(/\s+/g, ' ').trim().slice(0, 200);
}

/* ── what an agent sees ──────────────────────────────────────────────── */

export type AgentFact = { topic: string; question: string; answer: string | null; rule: string | null };
export type AgentView = {
  facts: AgentFact[];
  unknown: { topic: string; question: string }[];
  say_when_unknown: string;
};

const words = (q: string) =>
  q.toLowerCase().split(/[^a-z0-9À-ɏ]+/).filter((w) => w.length >= 2).slice(0, 12);

export function forAgent(
  rows: KnowledgeRow[],
  opts: { topic?: string | null; q?: string | null } = {}
): AgentView {
  const list = Array.isArray(rows) ? rows : [];
  const inTopic = (r: KnowledgeRow) => !opts.topic || r.topic === opts.topic;

  const confirmed = list.filter((r) => r.status === 'confirmed' && inTopic(r));
  let picked = confirmed;
  const terms = isText(opts.q) ? words(opts.q.slice(0, 200)) : [];
  if (terms.length) {
    const hit = confirmed.filter((r) => {
      const hay = `${r.question} ${r.answer ?? ''} ${r.rule ?? ''}`.toLowerCase();
      return terms.some((t) => hay.includes(t));
    });
    /* A filter that hides everything would make the agent think the topic is
       empty, so fall back to the whole topic. */
    if (hit.length) picked = hit;
  }

  return {
    facts: picked.map((r) => ({ topic: r.topic, question: r.question, answer: r.answer, rule: r.rule })),
    unknown: list
      .filter((r) => (r.status === 'unknown' || r.status === 'proposed') && inTopic(r))
      .map((r) => ({ topic: r.topic, question: r.question })),
    say_when_unknown: SAY_WHEN_UNKNOWN,
  };
}

/* ── gaps reported by the weekly review ──────────────────────────────── */

export type Gap = { topic: string; example?: unknown; asked?: unknown };
export type GapUpdate = { key: string; asked_count: number; last_asked_at: string };
export type GapUpsert = {
  key: string;
  topic: string;
  question: string;
  status: 'proposed';
  asked_count: number;
  last_asked_at: string;
  example: string | null;
  source: string;
};

const askedOf = (value: unknown): number => {
  const n = typeof value === 'number' ? value : Number.NaN;
  return Number.isInteger(n) && n >= 1 ? Math.min(n, 10000) : 1;
};

export function applyGaps(
  existing: Pick<KnowledgeRow, 'key' | 'topic' | 'status' | 'asked_count'>[],
  gaps: Gap[],
  now: Date = new Date()
): { updates: GapUpdate[]; upserts: GapUpsert[] } {
  const rows = Array.isArray(existing) ? existing : [];
  const stamp = now.toISOString();

  /* Merge gaps of the same topic first, so two reports never make two rows. */
  const byTopic = new Map<Topic, { asked: number; example: string }>();
  for (const g of Array.isArray(gaps) ? gaps : []) {
    if (!g || !isTopic(g.topic)) continue;
    const slot = byTopic.get(g.topic) ?? { asked: 0, example: '' };
    slot.asked += askedOf(g.asked);
    if (!slot.example) slot.example = redactExample(g.example);
    byTopic.set(g.topic, slot);
  }

  const updates: GapUpdate[] = [];
  const upserts: GapUpsert[] = [];
  for (const [topic, { asked, example }] of byTopic) {
    const open = rows.filter((r) => r.topic === topic && (r.status === 'unknown' || r.status === 'proposed'));
    if (open.length) {
      for (const r of open) {
        updates.push({ key: r.key, asked_count: (r.asked_count || 0) + asked, last_asked_at: stamp });
      }
      continue;
    }
    const key = `gap.${topic}`;
    /* The owner retired this gap on purpose: do not bring it back. */
    if (rows.some((r) => r.key === key)) continue;
    upserts.push({
      key,
      topic,
      question: `Customers ask about ${topic} and the agent had no answer`,
      status: 'proposed',
      asked_count: asked,
      last_asked_at: stamp,
      example: example || null,
      source: 'review',
    });
  }
  return { updates, upserts };
}

/* ── the owner's decision ────────────────────────────────────────────── */

export type Decision = { decision?: unknown; answer?: unknown; rule?: unknown };

const clean = (value: unknown, max: number): string | null | 'bad' => {
  if (value === undefined || value === null) return null;
  if (!isText(value)) return 'bad';
  const t = value.trim();
  if (!t) return null;
  return t.length > max ? 'bad' : t;
};

export function decide(row: KnowledgeRow, input: Decision, now: Date = new Date()): KnowledgeRow | string {
  if (!row || typeof row !== 'object') return 'Onbekende regel';
  if (!input || typeof input !== 'object') return 'Ongeldige aanvraag';
  const day = now.toISOString().slice(0, 10);

  if (input.decision === 'retire') {
    return { ...row, status: 'retired', source: `owner ${day}`, updated_at: now.toISOString() };
  }
  if (input.decision !== 'confirm') return 'decision moet confirm of retire zijn';

  const answer = clean(input.answer, 2000);
  const rule = clean(input.rule, 2000);
  if (answer === 'bad' || rule === 'bad') return 'answer of rule is ongeldig of te lang';

  const nextAnswer = answer ?? row.answer;
  const nextRule = rule ?? row.rule;
  if (!nextAnswer && !nextRule) return 'confirm vraagt om een answer of een rule';

  return {
    ...row,
    answer: nextAnswer,
    rule: nextRule,
    status: 'confirmed',
    approved_at: now.toISOString(),
    source: `owner ${day}`,
    updated_at: now.toISOString(),
  };
}
