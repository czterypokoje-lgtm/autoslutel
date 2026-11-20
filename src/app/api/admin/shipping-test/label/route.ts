import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { prepareZXingModule, writeBarcode } from 'zxing-wasm/writer';
import { requireWarehouseUserApi } from '@/lib/crmSession';
import { getTestParcel, shippingTestEnabled } from '@/lib/kfcShippingTest';
import { carriers, shippingOrigin, testTrackingCode } from '@/lib/kfcShippingTestModel';

export const runtime = 'nodejs';
let writer: Promise<unknown> | undefined;

export async function GET(request: Request) {
  if (!shippingTestEnabled) return new Response(null, { status: 404 });
  const { response } = await requireWarehouseUserApi();
  if (response) return response;
  const query = new URL(request.url).searchParams;
  const parcel = await getTestParcel(query.get('id') ?? '');
  if (!parcel) return new Response(null, { status: 404 });

  const tracking = testTrackingCode(parcel.id);
  if (!writer) {
    const wasmBinary = await readFile(join(process.cwd(), 'node_modules/zxing-wasm/dist/writer/zxing_writer.wasm'));
    writer = prepareZXingModule({ overrides: { wasmBinary: new Uint8Array(wasmBinary).buffer }, fireImmediately: true });
  }
  await writer;
  const barcode = await writeBarcode(tracking, { format: 'Code128', scale: 2 });
  if (!barcode.image) return new Response('Test barcode unavailable', { status: 500 });
  const pdf = await PDFDocument.create();
  pdf.setCreationDate(new Date(parcel.created_at));
  pdf.setModificationDate(new Date(parcel.created_at));
  const thermal = query.get('format') === 'thermal';
  const mm = 72 / 25.4;
  const [width, height] = thermal ? [100 * mm, 150 * mm] : [105 * mm, 148 * mm];
  const page = pdf.addPage([width, height]);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const draw = (value: string, y: number, size = 10) => {
    // The test label uses Helvetica; transliterate accents it cannot encode.
    const printable = value.normalize('NFKD').replace(/[^\x20-\x7e]/g, '').slice(0, 85);
    page.drawText(printable, { x: 16, y, size, maxWidth: width - 32, font: size > 14 ? bold : regular, color: rgb(0.1, 0.14, 0.20) });
  };
  draw('PREVIEW - NOT VALID FOR SHIPPING', height - 32, 13);
  draw((carriers.find((carrier) => carrier.id === parcel.service)?.label ?? '') + ' / Parcel ' + parcel.parcel_no, height - 63);
  draw('Dispatch: ' + shippingOrigin.address, height - 92);
  draw('Test delivery: ' + parcel.destination, height - 118);
  draw(parcel.weight_grams + ' g / ' + parcel.length_cm + ' x ' + parcel.width_cm + ' x ' + parcel.height_cm + ' cm', height - 148);
  const image = await pdf.embedPng(await barcode.image.arrayBuffer());
  page.drawImage(image, { x: 15, y: 76, width: width - 30, height: 70 });
  draw(tracking, 56, 9);
  return new Response(new Uint8Array(await pdf.save()), {
    headers: { 'content-type': 'application/pdf', 'content-disposition': 'inline; filename="shipping-test-' + parcel.id + (thermal ? '-thermal' : '-a6') + '.pdf"', 'cache-control': 'private, no-store' },
  });
}
