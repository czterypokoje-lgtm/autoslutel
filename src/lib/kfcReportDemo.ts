import type { reports } from './kfcReports';

export function webshopReportDemo(): Awaited<ReturnType<typeof reports>> {
  // Amounts are in cents, excluding VAT unless explicitly marked otherwise.
  const sales = [
    { month: '2026-11', date: '2026-11-12T10:00:00Z', shop: 'Demo Noord', orderId: 'demo-104', number: 'D-104', sku: 'DEMO-CORSA', name: 'Opel Corsa sleutel', units: 4, revenue: 24000, cost: 8800 },
    { month: '2026-11', date: '2026-11-09T10:00:00Z', shop: 'Demo Zuid', orderId: 'demo-103', number: 'D-103', sku: 'DEMO-POLO', name: 'Volkswagen Polo sleutel', units: 3, revenue: 18000, cost: 6600 },
    { month: '2026-10', date: '2026-10-22T10:00:00Z', shop: 'Demo Noord', orderId: 'demo-102', number: 'D-102', sku: 'DEMO-CORSA', name: 'Opel Corsa sleutel', units: 3, revenue: 18000, cost: 6600 },
    { month: '2026-10', date: '2026-10-15T10:00:00Z', shop: 'Demo Zuid', orderId: 'demo-101', number: 'D-101', sku: 'DEMO-POLO', name: 'Volkswagen Polo sleutel', units: 2, revenue: 12000, cost: null },
  ];
  const refundDetails = [
    { id: 'demo-refund', orderId: 'demo-104', number: 'D-104', shop: 'Demo Noord', date: '2026-11-18T10:00:00Z', amount: 7260, subtotal: 6000 },
  ];
  const margin = sales.map((sale) => ({
    month: sale.month, shop: sale.shop, revenue_cents: sale.revenue, units: sale.units,
    cost_cents: sale.cost ?? 0, priced_revenue_cents: sale.cost === null ? 0 : sale.revenue,
    missing_cost_rows: sale.cost === null ? 1 : 0,
    refunds_cents: sale.orderId === 'demo-104' ? 6000 : 0,
    returned_cost_cents: sale.orderId === 'demo-104' ? 2200 : 0,
  }));
  return {
    sales, margin, refundDetails,
    stock: { value_cents: 0, articles_with_stock: 0, unpriced: 0, catalogue: 0, dead: [], dead_units: 0 },
    aging: { open: 0, overdue: 0, not_due: 0, d1_30: 0, d31_60: 0, d61_90: 0, d90p: 0 },
  };
}
