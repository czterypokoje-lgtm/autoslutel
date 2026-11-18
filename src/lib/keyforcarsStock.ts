export interface StockArticle {
  id: string;
  name: string;
  sku: string;
  image: string;
  category: string;
  sources: { shop: string; url: string }[];
}

export interface StockBin {
  article: string;
  shelf: string;
  box: string;
  quantity: number;
  minimum: number;
}

export interface StockMove {
  article: string;
  operation: string;
  shelf: string;
  box: string;
  delta: number;
  after: number | null;
  time: string;
  id?: string;
  photo?: boolean;
  note?: string;
  requestFingerprint?: string;
  amountCents?: number;
  bot?: { eventId: string };
  /** Bulk count this movement belongs to. */
  batch?: string;
}

/** A saved bulk count: which photos (by SHA-256) it was made from, so they are not counted twice. */
export interface StockBatch { id: string; time: string; photos: string[]; lines: number }

export interface StockState {
  workshop: StockArticle[];
  bins: StockBin[];
  moves: StockMove[];
  photos: Record<string, string>;
  batches?: StockBatch[];
}

export const EMPTY_STOCK: StockState = { workshop: [], bins: [], moves: [], photos: {} };

export function sampleSales(catalog: StockArticle[], count: number, now: Date): StockMove[] {
  const time = now.toISOString();
  return catalog.slice(0, count).map((article, index) => {
    const quantity = index % 8 + 1;
    return {
      id: `report-sample-${article.id}`, article: article.id, operation: 'sale', shelf: '', box: '',
      delta: -quantity, after: null, time, amountCents: quantity * (1500 + (index % 10) * 500),
    };
  });
}

export const STOCK_OPERATIONS = {
  count: 'Telling',
  receive: 'Ontvangst',
  issue: 'Uitgifte',
  sale: 'Verkoop',
  return: 'Retour',
  transfer: 'Verplaatsing',
};

export const STOCK_TIME_ZONE = 'Europe/Amsterdam';
export function stockChange(move: StockMove, english = false) {
  const change = `${move.delta > 0 ? '+' : ''}${move.delta}`;
  return move.after === null
    ? `${change} · ${english ? 'balance unknown' : 'saldo onbekend'}`
    : `${change} → ${move.after} ${english ? 'units' : 'st.'}`;
}
const stockDay = new Intl.DateTimeFormat('sv-SE', {
  timeZone: STOCK_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
});

export const stockDate = (date: Date) => stockDay.format(date);

export function stockMonthRange(month: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return null;
  const last = new Date(`${month}-01T12:00:00Z`);
  last.setUTCMonth(last.getUTCMonth() + 1, 0);
  return { start: `${month}-01`, end: last.toISOString().slice(0, 10) };
}

export function stockReports(moves: StockMove[], now: Date) {
  const today = stockDate(now);
  const monday = new Date(`${today}T00:00:00Z`);
  monday.setUTCDate(monday.getUTCDate() - (monday.getUTCDay() + 6) % 7);
  const periods = [
    { title: 'Vandaag', start: today },
    { title: 'Deze week', start: monday.toISOString().slice(0, 10) },
    { title: 'Deze maand', start: `${today.slice(0, 7)}-01` },
  ];
  return periods.map(({ title, start }) => ({ title, ...stockPeriodReport(moves, now, start, today) }));
}

export function stockPeriodReport(moves: StockMove[], now: Date, start: string, end: string) {
    const report = { start, end, receive: 0, issue: 0, sale: 0, return: 0, transfer: 0, count: 0, bot: 0,
      revenueCents: 0, purchaseCents: 0, pricedSales: 0, pricedReceipts: 0, sales: 0, receipts: 0 };
    const sold = new Map<string, number>();
    for (const move of moves) {
      const instant = new Date(move.time);
      const date = stockDate(instant);
      if (date < start || date > end || instant > now) continue;
      if (move.operation === 'transfer' && move.delta >= 0) continue;
      if (move.operation === 'receive' || move.operation === 'issue' || move.operation === 'sale' || move.operation === 'return' || move.operation === 'transfer') {
        report[move.operation] += Math.abs(move.delta);
      }
      if (move.operation === 'sale') {
        sold.set(move.article, (sold.get(move.article) ?? 0) + Math.abs(move.delta));
        report.sales++;
        if (move.amountCents !== undefined) { report.revenueCents += move.amountCents; report.pricedSales++; }
      }
      if (move.operation === 'receive') {
        report.receipts++;
        if (move.amountCents !== undefined) { report.purchaseCents += move.amountCents; report.pricedReceipts++; }
      }
      if (move.operation === 'count') report.count++;
      if (move.bot) report.bot++;
    }
    const rankedSales = [...sold].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    return { ...report, rankedSales, topSales: rankedSales.slice(0, 5) };
}

/**
 * Reorder advice: what to order now, how many, and why.
 *
 * The shelf quantity alone cannot answer that. Sales and stock issues booked
 * without a location (webshop, counter, WhatsApp bot) are logged with
 * "saldo onbekend" and never lower a bin, so the shelf keeps showing the last
 * count while the goods are already gone. The expected quantity here is the
 * last count plus every unlocated movement booked after it.
 *
 * Demand is what actually left in the window (sales and issues to jobs).
 * Reorder point = demand during the supplier's lead time plus safety days,
 * never below the minimum set at the count. Order up to cover the lead time
 * plus the chosen number of days.
 */
export interface ReorderSettings { leadDays: number; safetyDays: number; coverDays: number; windowDays: number }
export const REORDER_DEFAULTS: ReorderSettings = { leadDays: 7, safetyDays: 3, coverDays: 30, windowDays: 30 };
export type ReorderStatus = 'order' | 'uncounted' | 'soon' | 'dead' | 'ok';

export interface ReorderLine {
  article: string;
  status: ReorderStatus;
  /** Sum of the bins as last booked; null when the article was never counted. */
  shelf: number | null;
  /** Shelf plus unlocated movements since the last count. */
  expected: number | null;
  minimum: number;
  lastCount: string | null;
  usedInWindow: number;
  perDay: number;
  coverDays: number | null;
  reorderPoint: number;
  suggest: number;
  unitCostCents: number | null;
  lastUse: string | null;
}

const DAY = 86_400_000;
const STATUS_ORDER: ReorderStatus[] = ['order', 'uncounted', 'soon', 'dead', 'ok'];

export function reorderAdvice(state: StockState, now: Date, settings: ReorderSettings = REORDER_DEFAULTS): ReorderLine[] {
  const windowStart = now.getTime() - settings.windowDays * DAY;
  const deadSince = now.getTime() - 90 * DAY;
  const ids = new Set([
    ...state.bins.map((bin) => bin.article),
    ...state.moves.filter((move) => move.operation === 'sale' || move.operation === 'issue').map((move) => move.article),
  ]);
  const lines: ReorderLine[] = [];
  for (const article of ids) {
    const bins = state.bins.filter((bin) => bin.article === article);
    const moves = state.moves.filter((move) => move.article === article && Date.parse(move.time) <= now.getTime());
    const shelf = bins.length ? bins.reduce((sum, bin) => sum + bin.quantity, 0) : null;
    const minimum = bins.reduce((sum, bin) => sum + bin.minimum, 0);
    const lastCount = moves.filter((move) => move.operation === 'count').reduce<string | null>((latest, move) => (!latest || move.time > latest ? move.time : latest), null);
    const unlocatedSinceCount = moves
      .filter((move) => !move.shelf && move.operation !== 'count' && move.operation !== 'transfer' && (!lastCount || move.time > lastCount))
      .reduce((sum, move) => sum + move.delta, 0);
    const expected = shelf === null ? null : Math.max(0, shelf + unlocatedSinceCount);
    const outflow = moves.filter((move) => move.operation === 'sale' || move.operation === 'issue');
    const usedInWindow = outflow.filter((move) => Date.parse(move.time) >= windowStart).reduce((sum, move) => sum + Math.abs(move.delta), 0);
    const perDay = usedInWindow / settings.windowDays;
    const reorderPoint = Math.max(minimum, Math.ceil(perDay * (settings.leadDays + settings.safetyDays)));
    const coverDays = expected !== null && perDay > 0 ? expected / perDay : null;
    const lastUse = outflow.reduce<string | null>((latest, move) => (!latest || move.time > latest ? move.time : latest), null);
    const receipts = moves.filter((move) => move.operation === 'receive' && move.amountCents !== undefined && move.delta > 0);
    const receivedUnits = receipts.reduce((sum, move) => sum + move.delta, 0);
    const unitCostCents = receivedUnits ? Math.round(receipts.reduce((sum, move) => sum + (move.amountCents ?? 0), 0) / receivedUnits) : null;

    let status: ReorderStatus = 'ok';
    if (expected === null) status = 'uncounted';
    else if (expected <= reorderPoint && (perDay > 0 || minimum > 0)) status = 'order';
    else if (coverDays !== null && coverDays <= settings.leadDays + settings.safetyDays + 7) status = 'soon';
    else if (expected > 0 && (!lastUse || Date.parse(lastUse) < deadSince)) status = 'dead';

    const target = Math.max(reorderPoint + 1, Math.ceil(perDay * (settings.leadDays + settings.coverDays)));
    const suggest = status === 'order' || status === 'soon' || status === 'uncounted' ? Math.max(0, target - (expected ?? 0)) : 0;
    lines.push({ article, status, shelf, expected, minimum, lastCount, usedInWindow, perDay, coverDays, reorderPoint, suggest, unitCostCents, lastUse });
  }
  return lines.sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)
    || (a.coverDays ?? Infinity) - (b.coverDays ?? Infinity) || b.usedInWindow - a.usedInWindow || a.article.localeCompare(b.article));
}
