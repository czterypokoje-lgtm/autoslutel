export type Coordinate = [number, number];
export const shippingOrigin = { address: 'Pascalstraat 27, 1704 RE Heerhugowaard, NL', point: [52.6824279, 4.82907106] as Coordinate };

export const carriers = [
  { id: 'postnl', label: 'PostNL', portal: 'https://developer.postnl.nl/' },
  { id: 'dhl-ecommerce', label: 'DHL eCommerce', portal: 'https://developer.dhl.com/api-reference/parcel-eu' },
  { id: 'dhl-express', label: 'DHL Express', portal: 'https://developer.dhl.com/api-reference/mydhl-api-dhl-express' },
] as const;

export type CarrierId = (typeof carriers)[number]['id'];
export type TestScenario = 'label' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'no_estimate' | 'unavailable';
export type TestParcel = {
  id: string; order_id: string; parcel_no: number; service: CarrierId;
  weight_grams: number; length_cm: number; width_cm: number; height_cm: number;
  destination: string; latitude: number | null; longitude: number | null; created_at: string;
};

export const testScenarios: readonly TestScenario[] = ['label','in_transit','out_for_delivery','delivered','no_estimate','unavailable'];
export const testTrackingCode = (id: string) => 'KFC-TEST-' + id.replaceAll('-', '').toUpperCase();
export const testLabelUrl = (id: string) => '/api/admin/shipping-test/label?id=' + encodeURIComponent(id);

const cityPoints: Record<string, Coordinate> = {
  Utrecht: [52.0907, 5.1214], Eindhoven: [51.4416, 5.4697], Zwolle: [52.5168, 6.0830],
  Breda: [51.5719, 4.7683], Almere: [52.3508, 5.2647], Antwerpen: [51.2194, 4.4025],
  Gent: [51.0543, 3.7174], Leuven: [50.8798, 4.7005], Köln: [50.9375, 6.9603],
  Essen: [51.4556, 7.0116], Münster: [51.9607, 7.6261], Lille: [50.6292, 3.0573],
  Lyon: [45.7640, 4.8357], Graz: [47.0707, 15.4395], Linz: [48.3069, 14.2858],
  Poznań: [52.4064, 16.9252], Wrocław: [51.1079, 17.0385],
};
export function isLegacyCityPoint(city: string, point: Coordinate) {
  return Object.hasOwn(cityPoints, city) && point[0] === cityPoints[city][0] && point[1] === cityPoints[city][1];
}

export const examplePickupPoint = {
  address: 'PostNL · Primera Almere Buiten, Noordeinde 164, 1334 BC Almere, NL',
  point: [52.3947325, 5.2774888] as Coordinate,
};

/** Simulated carrier timeline. Do not use these events to update real order status. */
export function testTracking(parcel: TestParcel, scenario: TestScenario) {
  const state = scenario === 'no_estimate' || scenario === 'unavailable' ? 'in_transit' : scenario;
  const steps = ['label', 'in_transit', 'out_for_delivery', 'delivered'] as const;
  const events = steps.slice(0, steps.indexOf(state) + 1).map((status, index) => ({
    status, time: new Date(Date.parse(parcel.created_at) - (steps.indexOf(state) - index) * 3600000).toISOString(),
  }));
  return {
    trackingCode: testTrackingCode(parcel.id), carrier: parcel.service, events,
    lastSuccessfulCheck: events.at(-1)?.time ?? null, unavailable: scenario === 'unavailable',
    estimate: scenario === 'in_transit' || scenario === 'out_for_delivery'
      ? new Date(Date.parse(parcel.created_at) + 86400000).toISOString().slice(0, 10) : null,
  };
}
