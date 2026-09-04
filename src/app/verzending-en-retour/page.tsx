import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_CONFIG } from '@/config/site.config';
import { SHIPPING_COST, FREE_SHIPPING_FROM, formatPrice } from '@/lib/catalog';
import { SERVICE_SURCHARGE } from '@/lib/cart';

/**
 * Shipping, returns and warranty.
 *
 * A Dutch webshop must state these before the order is placed — BW 6:230m
 * lists them among the information a consumer has to be given, and if the
 * right of withdrawal is not explained the fourteen days become twelve months
 * (BW 6:230o lid 2). The shop had none of it: no delivery times, no returns
 * address, no withdrawal form, and the checkout was already asking for money.
 *
 * The numbers come from the same constants the basket and the checkout charge,
 * so this page cannot drift away from what a customer actually pays.
 */

export const metadata: Metadata = {
  title: { absolute: 'Verzending, retour en garantie | Autosleutel24' },
  description:
    'Verzendkosten, levertijd, retourneren binnen 14 dagen en garantie op autosleutels en onderdelen van Autosleutel24.',
  alternates: { canonical: `${SITE_CONFIG.domain}/verzending-en-retour` },
};

const h2: React.CSSProperties = {
  fontSize: '1.35rem',
  fontWeight: 800,
  color: '#0f172a',
  margin: '2.5rem 0 0.75rem',
};

const p: React.CSSProperties = { color: '#334155', lineHeight: 1.7, margin: '0 0 1rem' };

export default function ShippingReturnsPage() {
  return (
    <main style={{ background: '#fff' }}>
      <section style={{ background: 'linear-gradient(135deg, #070e1a 0%, #0a1628 100%)', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h1 style={{ color: '#fff', margin: 0, fontSize: 'clamp(1.6rem, 5vw, 2.4rem)' }}>
          Verzending, retour en garantie
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.75)', maxWidth: 620, margin: '1rem auto 0', lineHeight: 1.6 }}>
          Wat u kunt verwachten als u bij ons bestelt — en wat u kunt doen als het
          onderdeel toch niet past.
        </p>
      </section>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '2.5rem 1.25rem 5rem' }}>
        <h2 style={{ ...h2, marginTop: 0 }}>Verzendkosten en levertijd</h2>
        <ul style={{ ...p, paddingLeft: '1.2rem' }}>
          <li>
            Verzending binnen Nederland: <strong>{formatPrice(SHIPPING_COST)}</strong> per bestelling.
          </li>
          <li>
            Gratis verzending vanaf <strong>{formatPrice(FREE_SHIPPING_FROM)}</strong>.
          </li>
          <li>
            Levertijd: <strong>2 tot 3 werkdagen</strong>. Onze onderdelen komen van onze
            leverancier in Duitsland; is een artikel daar niet op voorraad, dan laten wij
            u dat dezelfde werkdag weten.
          </li>
          <li>Wij verzenden op dit moment alleen binnen Nederland en België.</li>
        </ul>

        <h2 style={h2}>Monteur aan huis</h2>
        <p style={p}>
          Kiest u bij een product voor een monteurbezoek, dan komt onze monteur naar uw auto,
          freest de sleutel op uw slot en leert hem in op uw auto. Dat kost{' '}
          <strong>{formatPrice(SERVICE_SURCHARGE.mobile_tech)}</strong> bovenop de prijs van het
          onderdeel, ongeacht hoeveel sleutels in dezelfde afspraak worden gedaan. Wij vragen
          daarbij om uw kenteken, omdat de juiste uitvoering daarvan afhangt.
        </p>
        <p style={p}>
          Opsturen kan ook: u stuurt uw oude sleutel naar ons toe, wij zetten de elektronica
          over of freesen de baard, en sturen hem terug voor{' '}
          <strong>{formatPrice(SERVICE_SURCHARGE.send_in)}</strong>.
        </p>

        <h2 style={h2}>Retourneren — 14 dagen bedenktijd</h2>
        <p style={p}>
          U mag uw bestelling binnen <strong>14 dagen</strong> na ontvangst zonder opgaaf van
          reden retourneren. Meld dit binnen die termijn bij ons via{' '}
          <a href={`mailto:${SITE_CONFIG.email}`} style={{ color: '#b93c20' }}>{SITE_CONFIG.email}</a>{' '}
          of {SITE_CONFIG.phone}. Daarna heeft u nog 14 dagen om het artikel terug te sturen.
          Wij betalen binnen 14 dagen na ontvangst van uw melding terug, inclusief de
          standaard verzendkosten die u bij de bestelling betaalde.
        </p>
        <ul style={{ ...p, paddingLeft: '1.2rem' }}>
          <li>De retourkosten zijn voor uw rekening.</li>
          <li>
            Het artikel moet ongebruikt zijn en in de originele verpakking. Een sleutel die al
            op een auto is ingeleerd of waarvan de baard is gefreesd, is op maat gemaakt en kan
            niet worden teruggenomen (BW 6:230p sub f).
          </li>
          <li>
            Beschadiging door onjuiste montage of door het openen van de behuizing valt niet
            onder de bedenktijd.
          </li>
        </ul>
        <p style={p}>
          U kunt hiervoor het{' '}
          <a
            href="https://www.consuwijzer.nl/thema/modelformulier-voor-herroeping"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#b93c20' }}
          >
            modelformulier voor herroeping
          </a>{' '}
          gebruiken, maar dat hoeft niet: een e-mail waarin u aangeeft de koop te ontbinden is
          genoeg.
        </p>

        <h2 style={h2}>Garantie</h2>
        <p style={p}>
          Op alle elektronica geven wij <strong>12 maanden garantie</strong>. Werkt een sleutel,
          printplaat of transponder binnen die periode niet meer door een gebrek in het product,
          dan vervangen wij hem kosteloos. Uw wettelijke rechten (conformiteit, BW 7:17) blijven
          daarnaast onverkort gelden — die vervallen niet na een jaar.
        </p>
        <p style={p}>
          Niet onder garantie vallen: batterijen, schade door vallen of vocht, sleutels die door
          een derde onjuist zijn geprogrammeerd, en gefreesde baarden waarvan de maat door de
          klant is opgegeven.
        </p>

        <h2 style={h2}>Onderdelen zijn aftermarket</h2>
        <p style={p}>
          Onze sleutels, behuizingen en printplaten zijn aftermarket onderdelen — kwalitatief
          gelijkwaardig, maar geen originele dealeronderdelen en zonder automerk-embleem. Dat
          staat ook zo bij elk product vermeld. Werkt u liever met een origineel dealeronderdeel,
          bel ons dan even: dat kunnen wij voor u bestellen.
        </p>

        <h2 style={h2}>Klacht of vraag</h2>
        <p style={p}>
          Bel {SITE_CONFIG.phone} of mail{' '}
          <a href={`mailto:${SITE_CONFIG.email}`} style={{ color: '#b93c20' }}>{SITE_CONFIG.email}</a>.
          Wij reageren binnen twee werkdagen. Komen wij er samen niet uit, dan kunt u uw geschil
          voorleggen via het{' '}
          <a
            href="https://ec.europa.eu/consumers/odr"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#b93c20' }}
          >
            Europese ODR-platform
          </a>
          .
        </p>

        <p style={{ ...p, marginTop: '2.5rem', fontSize: '.9rem', color: '#64748b' }}>
          Zie ook onze{' '}
          <Link href="/algemene-voorwaarden" style={{ color: '#b93c20' }}>algemene voorwaarden</Link>{' '}
          en ons{' '}
          <Link href="/privacybeleid" style={{ color: '#b93c20' }}>privacybeleid</Link>.
        </p>
      </div>
    </main>
  );
}
