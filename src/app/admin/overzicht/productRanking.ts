import type { SampleOrder, Shop } from '@/lib/kfcSampleOrders';

export function rankProducts(orders: SampleOrder[], least = false) {
  const products = new Map<string, { sku: string; name: string; units: number; minPrice: number; maxPrice: number; stores: Map<Shop, number> }>();
  for (const order of orders) {
    for (const line of order.lines) {
      const product = products.get(line.sku) ?? {
        sku: line.sku, name: line.name, units: 0, minPrice: line.unitIncl, maxPrice: line.unitIncl, stores: new Map<Shop, number>(),
      };
      product.units += line.quantity;
      product.minPrice = Math.min(product.minPrice, line.unitIncl);
      product.maxPrice = Math.max(product.maxPrice, line.unitIncl);
      product.stores.set(order.shop, (product.stores.get(order.shop) ?? 0) + line.quantity);
      products.set(line.sku, product);
    }
  }
  return [...products.values()].sort((a, b) =>
    (least ? a.units - b.units : b.units - a.units) || a.sku.localeCompare(b.sku),
  );
}
