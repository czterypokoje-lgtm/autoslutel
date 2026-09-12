/**
 * One rule for "this article needs attention," shared by Mijn bus and both
 * overview dashboards.
 *
 * Zero in stock is worth flagging on its own — a part nobody ever set a
 * `min_quantity` on still runs out, and the old check (`quantity <=
 * min_quantity`) said nothing about it when that threshold was 0 or unset.
 * "Op" and "bijna op" are also kept as two states rather than one "low" bucket:
 * a technician standing in a driveway with zero left needs a different
 * reaction than one with two left of a minimum of three.
 */

export interface StockLevel {
  quantity: number | string;
  min_quantity: number | string | null;
}

export type StockStatus = 'out' | 'low' | 'ok';

export function stockStatus(item: StockLevel): StockStatus {
  const quantity = Number(item.quantity) || 0;
  if (quantity <= 0) return 'out';

  const minQuantity = item.min_quantity === null ? 0 : Number(item.min_quantity) || 0;
  if (minQuantity > 0 && quantity <= minQuantity) return 'low';

  return 'ok';
}
