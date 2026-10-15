import Image from 'next/image';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';
import { formatAddress, partnerFor } from '@/config/partners';
import PartnerMap from './PartnerMap';
import styles from './PartnerLocation.module.css';

/**
 * Where the technician for this city is based.
 *
 * WHY A CITY PAGE NEEDS ONE
 *
 * Every page on this site, and every page every competitor has, says "wij komen
 * naar u toe". A street the reader can look up says something none of them say.
 * It is also the only thing on a city page that a template cannot generate:
 * 71 of the 75 city pages are three interchangeable paragraphs with the name
 * swapped, and an address is the one block that is true of exactly one of them.
 *
 * WHAT IT DOES NOT DO
 *
 * It does not claim a branch. SITE_CONFIG.address stays Bussum — that is the
 * address on the Business Profile, and a second one on a city page is how a
 * crawler comes to believe there are two businesses. This section describes a
 * place where the work happens; the business doing it is still the single node
 * under BIZ_ID.
 *
 * Nothing renders for a city with no entry in PARTNER_LOCATIONS, so a page
 * never half-states a presence that is not there.
 *
 * THE PHONE NUMBER IS OURS
 *
 * Deliberately. The occupant's own number belongs on the occupant's own site;
 * putting it here would hand away the enquiry this page exists to capture, and
 * would also read as though the two businesses were one.
 */
export default function PartnerLocation({ citySlug, cityName }: { citySlug: string; cityName: string }) {
  const partner = partnerFor(citySlug);
  if (!partner) return null;

  const address = formatAddress(partner);
  const area = partner.district ?? partner.city;
  const caption = partner.businessName
    ? `${partner.businessName} — ${address}`
    : `${address} — ${area}`;

  /*
   * Two sentences for two different true things.
   *
   * With a name, this is a partnership and saying so is both accurate and
   * checkable. Without one, the honest subject is our own technician and where
   * he is based — which is what public_technicians already records — and not
   * the premises, because the premises are not ours to describe as ours.
   */
  const intro = partner.businessName
    ? `Onze monteur in ${cityName} werkt vanuit ${partner.businessName} aan de ${partner.street} in ${area}. Sleutelwerk voeren wij daar op locatie uit — of onze monteur komt naar u toe.`
    : `Onze monteur voor ${cityName} is gevestigd in ${area}, aan de ${partner.street}. Sleutelwerk voeren wij daar op locatie uit — of onze monteur komt naar u toe: thuis, op het werk of in de parkeergarage.`;

  return (
    <div className={styles.root}>
      <div>
        <h2 className={styles.heading}>Onze monteur in {area}</h2>
        <p className={styles.body}>{intro}</p>

        {partner.credentials && partner.credentials.length > 0 && (
          <ul className={styles.credentials}>
            {partner.credentials.map((c) => (
              <li key={c} className={styles.credential}>{c}</li>
            ))}
          </ul>
        )}

        {/*
          * Real text in an <address>, not only a pin inside a map.
          *
          * An embedded map is an iframe, and a crawler attributes nothing
          * inside it to this page — a page whose only address sits in the
          * embed has, as far as search is concerned, no address at all.
          */}
        <address className={styles.address}>
          <span className={styles.addressLabel}>Adres</span>
          {partner.street}
          <br />
          {partner.postalCode} {partner.city}
        </address>

        <div className={styles.actions}>
          <a className={styles.primary} href={WHATSAPP_URL}>
            WhatsApp ons
          </a>
          <a className={styles.secondary} href={`tel:${SITE_CONFIG.phoneTel}`}>
            {SITE_CONFIG.phone}
          </a>
        </div>
      </div>

      {/*
        * A photo when there is one, otherwise the map — and nothing at all
        * when the map cannot be drawn, which PartnerMap decides for itself.
        * The grid is auto-fit, so the text simply takes the full width rather
        * than sitting beside a gap.
        */}
      {partner.photo ? (
        <figure className={styles.media}>
          <Image
            className={styles.photo}
            src={partner.photo.src}
            alt={partner.photo.alt}
            width={1200}
            height={900}
            sizes="(min-width: 860px) 45vw, 100vw"
          />
          <figcaption className={styles.caption}>{caption}</figcaption>
        </figure>
      ) : (
        <PartnerMap citySlug={citySlug} address={address} caption={caption} />
      )}
    </div>
  );
}
