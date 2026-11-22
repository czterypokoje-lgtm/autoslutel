export const DEMO_BOT_AGENT = 'kfc-demo-support-bot';

export const demoChannels = {
  email: ['E-mail', 'Email'],
  whatsapp: ['WhatsApp', 'WhatsApp'],
  chat: ['Websitechat', 'Website Chat'],
  phone: ['Telefoon', 'Phone'],
} as const;

export type DemoChannel = keyof typeof demoChannels;

export function isDemoChannel(value: unknown): value is DemoChannel {
  return typeof value === 'string' && Object.hasOwn(demoChannels, value);
}

export function demoBotIntent(message: string, hasOrder: boolean, hasProduct: boolean) {
  if (/\b(technician|technicus|monteur|human|medewerker|callback|call me back|terugbellen|bel me terug)\b/i.test(message)) return 'technician';
  if (hasOrder || /\b(order|bestelling|tracking|track|pakket|parcel|shipment|verzending|bezorging)\b/i.test(message)) return 'order';
  if (hasProduct || /\b(product|sku|key|sleutel|compatible|compatibel|fits|past)\b/i.test(message)) return 'product';
  return 'unknown';
}

export function matchesDemoOrder(order: { ship_email: string | null; ship_postcode: string | null }, email: string, postcode: string) {
  const normalize = (value: string) => value.trim().toLowerCase();
  const postal = (value: string) => normalize(value).replaceAll(/\s/g, '');
  return Boolean(email && postcode && order.ship_email && order.ship_postcode &&
    normalize(email) === normalize(order.ship_email) && postal(postcode) === postal(order.ship_postcode));
}
