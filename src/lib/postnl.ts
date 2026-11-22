/*
 * PostNL Send & Track, the pure half: what goes into a request and what comes
 * out of a response. No network and no environment, so node --test runs it.
 *
 * Contract: PostNL's own OpenAPI files, read on 21 Nov 2026
 *   https://api-sandbox.postnl.nl/shipment/v1_1/barcode/swagger.json
 *   https://api-sandbox.postnl.nl/shipment/v2_2/label/swagger.json
 * The API key goes in the `apikey` header. Not in those files, and therefore
 * settings rather than facts: the product codes for Belgium and the EU, and the
 * track-and-trace address (the one PostNL's own mails use).
 */

export const POSTNL_HOST = { live: 'https://api.postnl.nl', sandbox: 'https://api-sandbox.postnl.nl' } as const;
export const POSTNL_BARCODE_PATH = '/shipment/v1_1/barcode';
export const POSTNL_LABEL_PATH = '/shipment/v2_2/label?confirm=true';

export interface PostnlConfig {
  /** Both from the PostNL contract, e.g. "DEVC" and "11223344". */
  customerCode: string;
  customerNumber: string;
  /** The depot code PostNL gave this customer; left out of the request when empty. */
  collectionLocation: string;
  sender: { company: string; street: string; zipcode: string; city: string; country: string };
  /** ProductCodeDelivery per destination. 3085 is PostNL's documented default for the Netherlands. */
  products: { nl: string; be: string; eu: string };
  /** Number range for the barcode call; nine digits fits a four-letter customer code (3S + code + 9 digits). */
  serie: string;
}

export interface PostnlOrder {
  shop: string; number: string;
  ship_name: string | null; ship_company: string | null; ship_street: string | null;
  ship_postcode: string | null; ship_city: string | null; country: string | null;
  ship_phone: string | null; ship_email: string | null; weight_grams: number | null;
}

const EU = new Set(['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE']);
const cut = (value: string | null | undefined, max: number) => (value ?? '').trim().slice(0, max);

/** The product for a destination, or null where this integration stops: outside the EU a parcel needs customs data. */
export function postnlProduct(country: string | null, products: PostnlConfig['products']): string | null {
  const code = (country || 'NL').trim().toUpperCase();
  if (code === 'NL') return products.nl;
  if (code === 'BE') return products.be;
  return EU.has(code) ? products.eu : null;
}

/** Dutch postcodes go without the space, in capitals ("1234 ab" → "1234AB"); other countries as typed. */
export const postnlZipcode = (zipcode: string | null, country: string | null) =>
  (country || 'NL').trim().toUpperCase() === 'NL' ? (zipcode ?? '').replace(/\s+/g, '').toUpperCase() : (zipcode ?? '').trim();

/** dd-MM-yyyy HH:mm:ss in Dutch time, the format the Message block asks for. */
export function postnlTimestamp(now: Date): string {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Amsterdam', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(now).map((part) => [part.type, part.value]));
  return `${parts.day}-${parts.month}-${parts.year} ${parts.hour}:${parts.minute}:${parts.second}`;
}

export const postnlBarcodeQuery = (config: PostnlConfig) =>
  new URLSearchParams({ CustomerCode: config.customerCode, CustomerNumber: config.customerNumber, Type: '3S', Serie: config.serie }).toString();

/** The body of POST /shipment/v2_2/label: one parcel, one A6 PDF label, confirmed in the same call. */
export function postnlLabelRequest(order: PostnlOrder, config: PostnlConfig, barcode: string, product: string, now: Date) {
  const country = (order.country || 'NL').trim().toUpperCase();
  const name = cut(order.ship_name, 35);
  const company = cut(order.ship_company, 35);
  const contact = { ContactType: '01', ...(cut(order.ship_email, 50) ? { Email: cut(order.ship_email, 50) } : {}), ...(cut(order.ship_phone, 17) ? { TelNr: cut(order.ship_phone, 17) } : {}) };
  return {
    Customer: {
      CustomerCode: config.customerCode,
      CustomerNumber: config.customerNumber,
      ...(config.collectionLocation ? { CollectionLocation: config.collectionLocation } : {}),
      Address: {
        AddressType: '02',
        CompanyName: cut(config.sender.company, 35),
        // One line: PostNL splits street, number and addition itself.
        StreetHouseNrExt: cut(config.sender.street, 95),
        Zipcode: postnlZipcode(config.sender.zipcode, config.sender.country),
        City: cut(config.sender.city, 35),
        Countrycode: config.sender.country,
      },
    },
    Message: {
      MessageID: String(now.getTime() % 1_000_000_000_000),
      MessageTimeStamp: postnlTimestamp(now),
      Printertype: 'GraphicFile|PDF',
    },
    Shipments: [{
      Addresses: [{
        AddressType: '01',
        ...(name ? { Name: name } : {}),
        ...(company ? { CompanyName: company } : {}),
        StreetHouseNrExt: cut(order.ship_street, 95),
        Zipcode: postnlZipcode(order.ship_postcode, country),
        City: cut(order.ship_city, 35),
        Countrycode: country,
      }],
      Barcode: barcode,
      ...(Object.keys(contact).length > 1 ? { Contacts: [contact] } : {}),
      Dimension: { Weight: Math.max(1, Math.round(order.weight_grams ?? 250)) },
      ProductCodeDelivery: product,
      Reference: cut(`${order.shop} #${order.number}`, 35),
    }],
  };
}

type Json = Record<string, unknown>;
const isObject = (value: unknown): value is Json => !!value && typeof value === 'object' && !Array.isArray(value);
const list = (value: unknown): Json[] => (Array.isArray(value) ? value.filter(isObject) : []);
const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

/** {"Barcode": "3SDEVC903942795"} → the barcode, or null. */
export const readPostnlBarcode = (json: unknown): string | null => (isObject(json) && /^[A-Z0-9]{11,15}$/.test(text(json.Barcode)) ? text(json.Barcode) : null);

/**
 * Whatever PostNL said went wrong, in one line. The API has three error
 * shapes: {Errors:[{Description}]} (label), {errors:[{ErrorMsg}]} (barcode)
 * and {message} or {fault:{faultstring}} (key, rate limit, server).
 */
export function postnlProblem(status: number, json: unknown): string {
  if (isObject(json)) {
    const parts = [
      ...list(json.Errors).map((e) => text(e.Description) || text(e.Error) || text(e.ErrorMsg)),
      ...list(json.errors).map((e) => text(e.ErrorMsg) || text(e.Description)),
      ...list(json.ResponseShipments).flatMap((s) => list(s.Errors).map((e) => text(e.Description) || text(e.Error))),
      text(json.message),
      isObject(json.fault) ? text(json.fault.faultstring) : '',
    ].filter(Boolean);
    if (parts.length) return [...new Set(parts)].join(' · ');
  }
  if (status === 401 || status === 403) return 'API-sleutel geweigerd';
  if (status === 429) return 'te veel verzoeken, probeer het zo opnieuw';
  return `HTTP ${status}`;
}

/** The label call's answer: the PDF (base64) and barcode of the one shipment, or what PostNL refused. */
export function readPostnlLabel(json: unknown): { barcode: string; pdfBase64: string; warnings: string[] } | { error: string } {
  const shipment = isObject(json) ? list(json.ResponseShipments)[0] : undefined;
  if (!shipment) return { error: postnlProblem(200, json) === 'HTTP 200' ? 'geen zending in het antwoord' : postnlProblem(200, json) };
  const errors = list(shipment.Errors).map((e) => text(e.Description) || text(e.Error)).filter(Boolean);
  if (errors.length) return { error: errors.join(' · ') };
  const label = list(shipment.Labels).find((l) => text(l.Content));
  if (!label) return { error: 'geen label in het antwoord' };
  return {
    barcode: text(shipment.Barcode),
    pdfBase64: text(label.Content),
    warnings: list(shipment.Warnings).map((w) => text(w.Description)).filter(Boolean),
  };
}

/** Where the customer and the shop follow the parcel. */
export const postnlTrackUrl = (barcode: string, country: string | null, zipcode: string | null) =>
  `https://jouw.postnl.nl/track-and-trace/${encodeURIComponent(barcode)}-${(country || 'NL').trim().toUpperCase()}-${encodeURIComponent((zipcode ?? '').replace(/\s+/g, '').toUpperCase())}`;
