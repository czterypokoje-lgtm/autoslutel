// PostNL requests and answers (src/lib/postnl.ts). Pure: no network, no database.
//   node --test tests/unit/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  postnlBarcodeQuery, postnlLabelRequest, postnlProblem, postnlProduct, postnlTimestamp, postnlTrackUrl, postnlZipcode,
  readPostnlBarcode, readPostnlLabel,
} from '../../src/lib/postnl.ts';

const CONFIG = {
  customerCode: 'DEVC', customerNumber: '11223344', collectionLocation: '123456',
  sender: { company: 'KeyForCars', street: 'Voorbeeldstraat 12a', zipcode: '1234 ab', city: 'Amsterdam', country: 'NL' },
  products: { nl: '3085', be: '4946', eu: '4952' }, serie: '000000000-999999999',
};
const ORDER = {
  shop: 'klapsleutels.nl', number: '48211', ship_name: 'J. de Vries', ship_company: null, ship_street: 'Dorpsstraat 9 bis',
  ship_postcode: '3532 va', ship_city: 'Utrecht', country: 'NL', ship_phone: '+31612345678', ship_email: 'klant@example.nl', weight_grams: 430,
};
const NOW = new Date('2026-11-21T20:15:30Z'); // 21:15:30 in Amsterdam (winter time)

test('a product per destination; outside the EU there is none', () => {
  assert.equal(postnlProduct('NL', CONFIG.products), '3085');
  assert.equal(postnlProduct(null, CONFIG.products), '3085');
  assert.equal(postnlProduct('be', CONFIG.products), '4946');
  assert.equal(postnlProduct('DE', CONFIG.products), '4952');
  assert.equal(postnlProduct('GB', CONFIG.products), null);
  assert.equal(postnlProduct('US', CONFIG.products), null);
});

test('postcode and timestamp are written the way PostNL asks', () => {
  assert.equal(postnlZipcode('3532 va', 'NL'), '3532VA');
  assert.equal(postnlZipcode(' 10115 ', 'DE'), '10115');
  assert.equal(postnlTimestamp(NOW), '21-11-2026 21:15:30');
  assert.equal(postnlTimestamp(new Date('2026-07-01T10:00:00Z')), '01-07-2026 12:00:00', 'summer time');
});

test('the barcode call asks for a 3S barcode for this customer', () => {
  assert.equal(postnlBarcodeQuery(CONFIG), 'CustomerCode=DEVC&CustomerNumber=11223344&Type=3S&Serie=000000000-999999999');
  assert.equal(readPostnlBarcode({ Barcode: '3SDEVC903942795' }), '3SDEVC903942795');
  assert.equal(readPostnlBarcode({ errors: [{ ErrorMsg: 'Too many numbers in series', ErrorNumber: '8' }] }), null);
});

test('the label request carries every field PostNL marks as required', () => {
  const body = postnlLabelRequest(ORDER, CONFIG, '3SDEVC903942795', '3085', NOW);
  assert.deepEqual(body.Customer, {
    CustomerCode: 'DEVC', CustomerNumber: '11223344', CollectionLocation: '123456',
    Address: { AddressType: '02', CompanyName: 'KeyForCars', StreetHouseNrExt: 'Voorbeeldstraat 12a', Zipcode: '1234AB', City: 'Amsterdam', Countrycode: 'NL' },
  });
  assert.equal(body.Message.MessageTimeStamp, '21-11-2026 21:15:30');
  assert.equal(body.Message.Printertype, 'GraphicFile|PDF');
  assert.ok(body.Message.MessageID.length <= 12);
  assert.equal(body.Shipments.length, 1);
  const shipment = body.Shipments[0];
  assert.deepEqual(shipment.Addresses, [{ AddressType: '01', Name: 'J. de Vries', StreetHouseNrExt: 'Dorpsstraat 9 bis', Zipcode: '3532VA', City: 'Utrecht', Countrycode: 'NL' }]);
  assert.equal(shipment.Barcode, '3SDEVC903942795');
  assert.deepEqual(shipment.Dimension, { Weight: 430 });
  assert.equal(shipment.ProductCodeDelivery, '3085');
  assert.equal(shipment.Reference, 'klapsleutels.nl #48211');
  assert.deepEqual(shipment.Contacts, [{ ContactType: '01', Email: 'klant@example.nl', TelNr: '+31612345678' }]);
});

test('missing or long order fields do not produce an invalid request', () => {
  const body = postnlLabelRequest({ ...ORDER, ship_name: 'N'.repeat(60), ship_company: 'Garage B.V.', ship_phone: null, ship_email: null, weight_grams: null, country: null }, { ...CONFIG, collectionLocation: '' }, '3SDEVC1', '3085', NOW);
  const [address] = body.Shipments[0].Addresses;
  assert.equal(address.Name.length, 35);
  assert.equal(address.CompanyName, 'Garage B.V.');
  assert.equal(address.Countrycode, 'NL');
  assert.equal('Contacts' in body.Shipments[0], false, 'no empty contact block');
  assert.equal('CollectionLocation' in body.Customer, false);
  assert.deepEqual(body.Shipments[0].Dimension, { Weight: 250 }, 'a parcel without a weight is sent as 250 g');
});

test('the label answer gives the PDF and the barcode; a refusal gives PostNL\'s reason', () => {
  const good = { MergedLabels: [], ResponseShipments: [{ Barcode: '3SDEVC903942795', ProductCodeDelivery: '3085', Errors: [], Warnings: [{ Code: '1280103', Description: 'Address is unknown' }], Labels: [{ Content: 'JVBERi0xLjQ=', Labeltype: 'Label', OutputType: 'PDF' }] }] };
  assert.deepEqual(readPostnlLabel(good), { barcode: '3SDEVC903942795', pdfBase64: 'JVBERi0xLjQ=', warnings: ['Address is unknown'] });
  assert.deepEqual(readPostnlLabel({ ResponseShipments: [{ Barcode: 'X', Errors: [{ Code: '1', Description: 'Zipcode is invalid' }], Labels: [] }] }), { error: 'Zipcode is invalid' });
  assert.deepEqual(readPostnlLabel({ ResponseShipments: [{ Barcode: 'X', Errors: [], Labels: [] }] }), { error: 'geen label in het antwoord' });
  assert.deepEqual(readPostnlLabel(null), { error: 'geen zending in het antwoord' });
});

test('every error shape PostNL documents becomes one readable line', () => {
  assert.equal(postnlProblem(400, { Errors: [{ Error: 'Validation failed for shipment: 3SDEVC949511897', Code: '1280202', Description: 'Incorrect address specified in address type Sender' }] }), 'Incorrect address specified in address type Sender');
  assert.equal(postnlProblem(400, { errors: [{ ErrorMsg: 'Too many numbers in series', ErrorNumber: '8' }] }), 'Too many numbers in series');
  assert.equal(postnlProblem(401, { message: "Failed to resolve API Key variable 'request.header.apikey'", http_status_code: 401 }), "Failed to resolve API Key variable 'request.header.apikey'");
  assert.equal(postnlProblem(401, null), 'API-sleutel geweigerd');
  assert.equal(postnlProblem(429, null), 'te veel verzoeken, probeer het zo opnieuw');
  assert.equal(postnlProblem(500, 'oops'), 'HTTP 500');
});

test('the tracking link is built from barcode, country and postcode', () => {
  assert.equal(postnlTrackUrl('3SDEVC903942795', 'NL', '3532 va'), 'https://jouw.postnl.nl/track-and-trace/3SDEVC903942795-NL-3532VA');
});
