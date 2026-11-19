export const inventoryViews = {
  products: 'Artikelen',
  reorder: 'Bestelvoorstel',
  reports: 'Voorraadrapporten',
  journal: 'Voorraadlogboek',
} as const;

export type InventoryView = keyof typeof inventoryViews;

export function inventoryView(value: string | null | undefined): InventoryView {
  return value && Object.hasOwn(inventoryViews, value) ? value as InventoryView : 'products';
}

export function inventoryHref(view: InventoryView, demo = false) {
  const query = new URLSearchParams();
  if (view !== 'products') query.set('view', view);
  if (demo) query.set('demo', '1');
  return '/admin/voorraad' + (query.size ? `?${query}` : '');
}
