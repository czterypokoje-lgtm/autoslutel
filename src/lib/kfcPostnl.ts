import 'server-only';
import { BRAND } from '@/config/install';
import { readPhoto, writePhoto } from '@/lib/kfcStockStore';
import {
  POSTNL_BARCODE_PATH, POSTNL_HOST, POSTNL_LABEL_PATH, postnlBarcodeQuery, postnlLabelRequest, postnlProblem, postnlProduct,
  readPostnlBarcode, readPostnlLabel, type PostnlConfig, type PostnlOrder,
} from '@/lib/postnl';

/*
 * PostNL labels for web orders (the network half; the rules are in postnl.ts).
 *
 * Settings, all in the environment:
 *   POSTNL_API_KEY, POSTNL_CUSTOMER_CODE, POSTNL_CUSTOMER_NUMBER     from the PostNL contract (required)
 *   POSTNL_SENDER_STREET, POSTNL_SENDER_ZIPCODE, POSTNL_SENDER_CITY  sender on the label (required; fall back to POS_BILLER_*)
 *   POSTNL_SENDER_COMPANY, POSTNL_SENDER_COUNTRY                     default: the shop's name, NL
 *   POSTNL_COLLECTION_LOCATION                                       depot code, when PostNL gave one
 *   POSTNL_PRODUCT_NL / _BE / _EU                                    product codes; defaults 3085 / 4946 / 4952
 *   POSTNL_BARCODE_SERIE                                             default 000000000-999999999
 *   POSTNL_SANDBOX=1                                                 use PostNL's test server (labels are not valid)
 *
 * One call for a barcode, one for the label (confirmed in the same call). The
 * PDF comes back in the response, so it is kept in the CRM's own file store and
 * served from /api/admin/kfc-orders/label-file.
 */

const SETTINGS = ['POSTNL_API_KEY', 'POSTNL_CUSTOMER_CODE', 'POSTNL_CUSTOMER_NUMBER'] as const;

function read(): { key: string; host: string; config: PostnlConfig } | null {
  const env = process.env;
  const value = (name: string) => (env[name] ?? '').trim();
  const street = value('POSTNL_SENDER_STREET') || value('POS_BILLER_STREET');
  const zipcode = value('POSTNL_SENDER_ZIPCODE') || value('POS_BILLER_POSTCODE');
  const city = value('POSTNL_SENDER_CITY') || value('POS_BILLER_CITY');
  if (SETTINGS.some((name) => !value(name)) || !street || !zipcode || !city) return null;
  return {
    key: value('POSTNL_API_KEY'),
    host: value('POSTNL_SANDBOX') === '1' ? POSTNL_HOST.sandbox : POSTNL_HOST.live,
    config: {
      customerCode: value('POSTNL_CUSTOMER_CODE'), customerNumber: value('POSTNL_CUSTOMER_NUMBER'),
      collectionLocation: value('POSTNL_COLLECTION_LOCATION'),
      sender: { company: value('POSTNL_SENDER_COMPANY') || value('POS_BILLER_NAME') || BRAND.name, street, zipcode, city, country: (value('POSTNL_SENDER_COUNTRY') || 'NL').toUpperCase() },
      products: { nl: value('POSTNL_PRODUCT_NL') || '3085', be: value('POSTNL_PRODUCT_BE') || '4946', eu: value('POSTNL_PRODUCT_EU') || '4952' },
      serie: value('POSTNL_BARCODE_SERIE') || '000000000-999999999',
    },
  };
}

export const postnlConfigured = () => read() !== null;
export const postnlSandbox = () => (process.env.POSTNL_SANDBOX ?? '').trim() === '1';

/** Names of the settings still missing, for the settings screen. Never the values. */
export function postnlMissing(): string[] {
  const value = (name: string) => (process.env[name] ?? '').trim();
  return [
    ...SETTINGS.filter((name) => !value(name)),
    ...(['STREET', 'ZIPCODE', 'CITY'] as const)
      .filter((part) => !value(`POSTNL_SENDER_${part}`) && !value(`POS_BILLER_${part === 'ZIPCODE' ? 'POSTCODE' : part}`))
      .map((part) => `POSTNL_SENDER_${part}`),
  ];
}

export class PostnlError extends Error {
  constructor(message: string, readonly status = 502) { super(message); }
}

const labelFile = (orderId: string) => `label-${orderId}.pdf`;
export const readLabelFile = (orderId: string) => readPhoto(labelFile(orderId));

async function call(host: string, path: string, key: string, init: RequestInit = {}): Promise<{ status: number; json: unknown }> {
  let response: Response;
  try {
    response = await fetch(`${host}${path}`, {
      ...init, cache: 'no-store', signal: AbortSignal.timeout(20_000),
      headers: { apikey: key, Accept: 'application/json', ...(init.body ? { 'Content-Type': 'application/json' } : {}) },
    });
  } catch (error) {
    throw new PostnlError(`PostNL onbereikbaar: ${(error as Error).message}`);
  }
  return { status: response.status, json: await response.json().catch(() => null) };
}

/** A confirmed PostNL shipment for this order: the barcode, with the label PDF stored for printing. */
export async function createPostnlLabel(order: PostnlOrder & { id: string }): Promise<{ barcode: string; warnings: string[] }> {
  const settings = read();
  if (!settings) throw new PostnlError('PostNL is niet ingesteld.', 409);
  const { key, host, config } = settings;
  const product = postnlProduct(order.country, config.products);
  if (!product) {
    throw new PostnlError(`PostNL-label lukt hier alleen binnen de EU (land: ${order.country ?? '?'}). Maak deze zending in Mijn PostNL en vul de trackingcode in.`, 409);
  }

  const numbered = await call(host, `${POSTNL_BARCODE_PATH}?${postnlBarcodeQuery(config)}`, key);
  const barcode = numbered.status === 200 ? readPostnlBarcode(numbered.json) : null;
  if (!barcode) throw new PostnlError(`PostNL gaf geen barcode: ${postnlProblem(numbered.status, numbered.json)}`);

  const answer = await call(host, POSTNL_LABEL_PATH, key, { method: 'POST', body: JSON.stringify(postnlLabelRequest(order, config, barcode, product, new Date())) });
  if (answer.status !== 200) throw new PostnlError(`PostNL weigerde de zending: ${postnlProblem(answer.status, answer.json)}`, answer.status === 400 ? 409 : 502);
  const label = readPostnlLabel(answer.json);
  if ('error' in label) throw new PostnlError(`PostNL weigerde de zending: ${label.error}`, 409);

  const pdf = Buffer.from(label.pdfBase64, 'base64');
  if (pdf.subarray(0, 4).toString('latin1') !== '%PDF') throw new PostnlError('PostNL stuurde geen PDF-label terug.');
  await writePhoto(labelFile(order.id), new Uint8Array(pdf), 'application/pdf');
  return { barcode: label.barcode || barcode, warnings: label.warnings };
}
