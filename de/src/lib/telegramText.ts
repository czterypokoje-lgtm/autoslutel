/**
 * Building a Telegram message that reads well on a phone.
 *
 * The bot's messages had grown into runs of text with middle dots in them,
 * which is fine for one fact and unreadable for six: a monteur glancing at a
 * job between two others should find the price without parsing a sentence.
 *
 * Telegram's HTML mode gives bold and monospace and nothing else worth
 * having. The catch is that it rejects the whole message if a stray `<` or
 * `&` appears in it — and these messages are full of customer names and
 * free-typed descriptions. So nothing here interpolates raw: every value goes
 * through esc(), and the helpers below are the only way to build a line.
 */

/** The three characters Telegram's HTML parser will choke on. */
export function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export const b = (value: unknown): string => `<b>${esc(value)}</b>`;
export const code = (value: unknown): string => `<code>${esc(value)}</code>`;

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
export const euro = (value: number | string | null | undefined): string =>
  value === null || value === undefined || value === '' ? '—' : MONEY.format(Number(value));

/**
 * A heading, then labelled lines, then whatever comes after.
 *
 * Labels are plain and values are bold, not the other way round: the eye is
 * hunting the number, and bolding the word in front of it makes every line
 * look equally important.
 */
export function block(
  title: string,
  rows: Array<[string, unknown] | string | null | false | undefined>,
  footer?: string | null
): string {
  const lines = [b(title), ''];

  for (const row of rows) {
    if (!row) continue;
    if (typeof row === 'string') {
      lines.push(esc(row));
      continue;
    }
    const [label, value] = row;
    if (value === null || value === undefined || value === '') continue;
    /* The value may already be markup (euro(), code()); labels never are. */
    lines.push(`${esc(label)}: ${typeof value === 'string' && value.startsWith('<') ? value : b(value)}`);
  }

  if (footer) {
    lines.push('', esc(footer));
  }
  return lines.join('\n');
}

/**
 * A list where each entry is one line.
 *
 * Capped, with a count of what was left off — a bot that sends forty lines
 * gets muted, and the eleventh job of the day is not read on a phone anyway.
 */
export function list(
  title: string,
  items: string[],
  options: { max?: number; empty?: string; footer?: string } = {}
): string {
  const max = options.max ?? 10;
  if (!items.length) return `${b(title)}\n\n${esc(options.empty ?? 'Niets te tonen.')}`;

  const shown = items.slice(0, max);
  const rest = items.length - shown.length;

  return [
    b(title),
    '',
    ...shown,
    rest > 0 ? `\n<i>… en nog ${rest}</i>` : null,
    options.footer ? `\n${esc(options.footer)}` : null,
  ]
    .filter((line) => line !== null)
    .join('\n');
}
