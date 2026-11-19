'use client';

import Link from 'next/link';
import { FilePlus2, Package, Printer, Truck } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { PageHead, ui } from '../_ui';
import { usePreviewLanguage } from '../PreviewLanguage';
import styles from './shipping.module.css';

const countries = {
  NL: ['Nederland', 'Netherlands'],
  BE: ['België', 'Belgium'],
  DE: ['Duitsland', 'Germany'],
} as const;
type Country = keyof typeof countries;
type Service = { id: string; nl: string; en: string; domesticOnly?: boolean; internationalOnly?: boolean; pickup?: boolean; maxWeight?: number };
const carriers: Record<string, { name: string; services: Service[] }> = {
  dhl: { name: 'DHL eCommerce', services: [
    { id: 'home', nl: 'Pakket aan huis', en: 'Home delivery' },
    { id: 'service-point', nl: 'DHL ServicePoint', en: 'DHL ServicePoint', domesticOnly: true, pickup: true },
  ] },
  postnl: { name: 'PostNL', services: [
    { id: 'parcel', nl: 'Standaardpakket', en: 'Standard parcel' },
    { id: 'mailbox', nl: 'Brievenbuspakje+', en: 'Letterbox parcel+', domesticOnly: true, maxWeight: 2 },
  ] },
  dpd: { name: 'DPD', services: [
    { id: 'home', nl: 'DPD 2home', en: 'DPD 2home' },
    { id: 'shop', nl: 'DPD 2shop', en: 'DPD 2shop', pickup: true },
  ] },
  gls: { name: 'GLS', services: [
    { id: 'business', nl: 'BusinessParcel', en: 'BusinessParcel', domesticOnly: true },
    { id: 'euro-business', nl: 'EuroBusinessParcel', en: 'EuroBusinessParcel', internationalOnly: true },
  ] },
};
const addressFields = [
  ['name', 'Naam', 'Name', 'name'],
  ['street', 'Straat en huisnummer', 'Street and house number', 'address-line1'],
  ['postcode', 'Postcode', 'Postal code', 'postal-code'],
  ['city', 'Plaats', 'City', 'address-level2'],
] as const;
type AddressField = (typeof addressFields)[number][0];
type Address = Record<AddressField, string>;

export default function ShippingSetup() {
  const { english, t } = usePreviewLanguage();
  const local = (nl: string, en: string) => english ? en : nl;
  const countryName = (country: Country) => countries[country][english ? 1 : 0];
  const [carrierId, setCarrierId] = useState('dhl');
  const [destination, setDestination] = useState<Country>('NL');
  const [serviceId, setServiceId] = useState('');
  const [draft, setDraft] = useState<{ destination: Country; weight: number; reference: string; sender: Address; recipient: Address; carrier: string; service: Service; pickupPoint: string }>();
  const [invalidAddress, setInvalidAddress] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const preview = useRef<HTMLElement>(null);
  useEffect(() => {
    if (draft) preview.current?.focus();
  }, [draft]);
  const carrier = carriers[carrierId];
  const services = carrier.services.filter(service => destination === 'NL' ? !service.internationalOnly : !service.domesticOnly);
  const service = services.find(item => item.id === serviceId) ?? services[0];

  function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const weight = Number(values.get('weight'));
    if (!Number.isFinite(weight) || weight < 0.01 || (service.maxWeight !== undefined && weight > service.maxWeight)) return;
    const readAddress = (section: string) => Object.fromEntries(addressFields.map(([field]) =>
      [field, String(values.get(`${section}-${field}`) ?? '').trim()])) as Address;
    const sender = readAddress('sender');
    const recipient = readAddress('recipient');
    const pickupPoint = service.pickup ? String(values.get('pickup-point') ?? '').trim() : '';
    if (![...Object.values(sender), ...Object.values(recipient)].every(Boolean) || (service.pickup && !pickupPoint)) {
      setInvalidAddress(true);
      return;
    }
    setDraft({ destination, weight, reference: String(values.get('reference') ?? '').trim(), sender, recipient, carrier: carrier.name, service, pickupPoint });
  }

  return (
    <section className={styles.page}>
      <PageHead
        title={t('Verzending')}
        sub={local('Kies een vervoerder voor een zending vanuit Nederland.', 'Choose a carrier for a shipment from the Netherlands.')}
        actions={<Link href="/admin/facturen/nieuw" className={ui.btn}><FilePlus2 size={16} aria-hidden="true" />{t('Nieuwe factuur')}</Link>}
      />
      <div className={styles.grid}>
        <form ref={form} className={styles.card} onSubmit={prepare} onChange={() => { setDraft(undefined); setInvalidAddress(false); }}>
          <h2><Truck size={21} aria-hidden="true" />{local('Verzendconfiguratie', 'Shipping configuration')}</h2>
          <p>{local('Kies een vervoerder, vul de adressen in en bekijk het testlabel.', 'Choose a carrier, enter both addresses, then preview the test label.')}</p>
          <button type="button" className={ui.btn} onClick={() => {
            const example = {
              weight: '0.75', reference: 'KFC-TEST',
              'sender-name': 'KeyForCars', 'sender-street': 'Teststraat 1', 'sender-postcode': '1000 AA', 'sender-city': 'Amsterdam',
              'recipient-name': 'Testontvanger', 'recipient-street': 'Voorbeeldstraat 2',
              'recipient-postcode': { NL: '2000 AA', BE: '1000', DE: '10115' }[destination],
              'recipient-city': { NL: 'Haarlem', BE: 'Brussel', DE: 'Berlin' }[destination],
              'pickup-point': 'TEST-PUNT',
            };
            for (const [name, value] of Object.entries(example)) {
              const field = form.current?.elements.namedItem(name);
              if (field instanceof HTMLInputElement && !field.value.trim()) field.value = value;
            }
            setDraft(undefined);
            setInvalidAddress(false);
          }}>{local('Vul lege velden met een voorbeeld', 'Fill empty fields with example data')}</button>
          <fieldset className={styles.parcelFields}>
          <legend>{local('Pakket en bezorging', 'Parcel and delivery')}</legend>
          <label>{local('Vervoerder', 'Carrier')}
            <select className={ui.input} value={carrierId} onChange={event => { setCarrierId(event.target.value); setServiceId(''); }}>
              {Object.entries(carriers).map(([id, preset]) => <option key={id} value={id}>{preset.name}</option>)}
            </select>
          </label>
          <label>{local('Bestemming', 'Destination')}
            <select className={ui.input} name="destination" value={destination} onChange={event => {
              const country = event.target.value;
              if (Object.hasOwn(countries, country)) setDestination(country as Country);
            }}>
              {(Object.keys(countries) as Country[]).map(country => <option key={country} value={country}>{countryName(country)}</option>)}
            </select>
          </label>
          <label>{local('Verzendservice', 'Shipping service')}
            <select className={ui.input} value={service.id} onChange={event => setServiceId(event.target.value)}>
              {services.map(item => <option key={item.id} value={item.id}>{local(item.nl, item.en)}</option>)}
            </select>
          </label>
          {service.pickup && <label>{local('Afhaalpunt (naam of code)', 'Pickup point (name or code)')}
            <input className={ui.input} name="pickup-point" maxLength={120} required />
          </label>}
          <label>{local('Werkelijk pakketgewicht (kg)', 'Actual parcel weight (kg)')}
            <input className={ui.input} name="weight" type="number" min="0.01" max={service.maxWeight} step="0.01" required />
            {service.maxWeight && <small>{local('Maximaal', 'Maximum')} {service.maxWeight} kg</small>}
          </label>
          <label>{local('Bestelreferentie (optioneel)', 'Order reference (optional)')}
            <input className={ui.input} name="reference" maxLength={80} />
          </label>
          </fieldset>
          {(['sender', 'recipient'] as const).map(section => <fieldset key={section} className={styles.addressFields}>
            <legend>{section === 'sender' ? local('Afzender (Nederland)', 'Sender (Netherlands)') : local('Ontvanger', 'Recipient')}</legend>
            {addressFields.map(([field, nl, en, autocomplete]) => <label key={field}>{local(nl, en)}
              <input className={ui.input} name={`${section}-${field}`} autoComplete={`section-${section} ${autocomplete}`}
                defaultValue={section === 'sender' && field === 'name' ? 'KeyForCars' : undefined} maxLength={120} required />
            </label>)}
          </fieldset>)}
          {invalidAddress && <p role="alert">{local('Vul alle verplichte adres- en afhaalvelden in.', 'Complete all required address and pickup fields.')}</p>}
          <button type="submit" className={`${ui.btn} ${ui.btnPrimary}`}>{local('Testlabel tonen', 'Preview test label')}</button>
        </form>
        <article ref={preview} tabIndex={-1} aria-labelledby="shipping-preview-title" className={`${styles.card} ${styles.preview}`}>
          <h2 id="shipping-preview-title"><Package size={21} aria-hidden="true" />{local('Labelvoorbeeld', 'Label preview')}</h2>
          <p>{local('Een officieel verzendlabel vereist een actieve verbinding met de gekozen vervoerder.', 'An official shipping label requires an active connection to the selected carrier.')}</p>
          {draft && <>
            <section className={styles.printLabel} aria-live="polite">
              <strong>{local('TESTLABEL · ONGELDIG VOOR VERZENDING', 'TEST LABEL · NOT VALID FOR SHIPPING')}</strong>
              <b>{draft.carrier} · {local(draft.service.nl, draft.service.en)}</b>
              {draft.pickupPoint && <p>{local('Afhaalpunt', 'Pickup point')} · {draft.pickupPoint}</p>}
              {([['sender', draft.sender, 'NL'], ['recipient', draft.recipient, draft.destination]] as const).map(([section, address, country]) => (
                <div key={section}>
                  <b>{section === 'sender' ? local('Afzender', 'Sender') : local('Ontvanger', 'Recipient')}</b>
                  <address>{address.name}<br />{address.street}<br />{address.postcode} {address.city}<br />{countryName(country)}</address>
                </div>
              ))}
              <p>{draft.weight.toLocaleString(english ? 'en-GB' : 'nl-NL')} kg{draft.reference && ` · ${draft.reference}`}</p>
            </section>
            <button type="button" className={ui.btn} onClick={() => window.print()}>
              <Printer size={16} aria-hidden="true" />{local('Testlabel afdrukken', 'Print test label')}
            </button>
          </>}
        </article>
      </div>
    </section>
  );
}
