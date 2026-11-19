/**
 * A draft invoice as the office assistant asks for one.
 *
 * Totals are worked out here, never taken from the request. The assistant passes
 * on the prices the owner said, and whether those include btw, so no model ever
 * does the arithmetic.
 */

export const MAX_LINES = 20;
const VAT_RATES = [0, 9, 21];

export interface DraftLine {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
}

export interface Draft {
  client: {
    name: string;
    street: string | null;
    postcode: string | null;
    city: string | null;
    email: string | null;
    phone: string | null;
    btw: string | null;
  };
  notes: string | null;
  lines: DraftLine[];
  subtotal: number;
  vatTotal: number;
  total: number;
}

const round = (value: number) => Math.round(value * 100) / 100;

function text(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function amount(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(n) && n > 0 && n < 1_000_000 ? n : null;
}

export function readDraft(body: Record<string, unknown>): { draft: Draft } | { error: string } {
  const name = text(body.client_name, 200);
  if (!name) return { error: 'Naam van de klant is verplicht' };

  if (typeof body.prices_include_vat !== 'boolean') {
    return { error: 'Zeg of de prijzen inclusief of exclusief btw zijn' };
  }

  const raw = Array.isArray(body.lines) ? body.lines : [];
  if (!raw.length || raw.length > MAX_LINES) return { error: `Geef 1 tot ${MAX_LINES} regels` };

  const lines: DraftLine[] = [];
  for (const item of raw) {
    const r = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
    const description = text(r.description, 300);
    const quantity = r.quantity === undefined ? 1 : amount(r.quantity);
    const price = amount(r.price);
    const vatRate = r.vat_rate === undefined ? 21 : Number(r.vat_rate);

    if (!description || !quantity || !price) {
      return { error: 'Elke regel heeft een omschrijving en een prijs nodig' };
    }
    if (!VAT_RATES.includes(vatRate)) return { error: 'Btw moet 0, 9 of 21 zijn' };

    const unitPrice = body.prices_include_vat ? round(price / (1 + vatRate / 100)) : round(price);
    lines.push({ description, quantity, unitPrice, vatRate });
  }

  const subtotal = round(lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0));
  const vatTotal = round(lines.reduce((sum, l) => sum + l.quantity * l.unitPrice * (l.vatRate / 100), 0));

  return {
    draft: {
      client: {
        name,
        street: text(body.client_street, 200),
        postcode: text(body.client_postcode, 20),
        city: text(body.client_city, 100),
        email: text(body.client_email, 200),
        phone: text(body.client_phone, 40),
        btw: text(body.client_btw, 40),
      },
      notes: text(body.notes, 500),
      lines,
      subtotal,
      vatTotal,
      total: round(subtotal + vatTotal),
    },
  };
}
