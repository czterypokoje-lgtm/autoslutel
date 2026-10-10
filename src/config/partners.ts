/*
 * Where our people actually stand, city by city.
 *
 * WHAT THIS IS FOR
 *
 * A city page says "wij komen naar u toe" and nothing else, which is true and
 * which every competitor also says. A real street in the city the reader is in
 * says something they can check, and checkable is what trust is made of.
 *
 * WHAT THIS IS NOT
 *
 * Not a branch, not an address for Autosleutel24, and never a second NAP.
 * SITE_CONFIG.address stays Bussum, because that is the address on the Google
 * Business Profile and a second one in the markup is how a crawler ends up
 * believing there are two businesses. The entry below describes *a place where
 * the work is done*; the provider of that work is still the one business in
 * LocalBusinessSchema, under BIZ_ID.
 *
 * THE RULE THAT MUST NOT BEND
 *
 * An entry here requires somebody who is genuinely there. Not "we could send
 * someone", not "we have a number for a garage in that town" — a technician
 * whose base it is. The moment that stops being true the entry is deleted, and
 * deleting it is removing one object from the array: the component renders
 * nothing for a city with no entry, and the schema drops the channel with it.
 *
 * Google's own guidance is the same rule from the other side: a Business
 * Profile may only exist at an address staffed during its stated hours. We do
 * not have one here and this file does not pretend otherwise. This is page
 * content and structured data about a place, not a listing.
 */

export type PartnerLocation = {
  /** Must match a slug in CITIES. */
  citySlug: string;

  /*
   * The name of the business whose premises these are, or null to describe the
   * location without naming it.
   *
   * NAMING IT IS THE SAFER AND USUALLY THE BETTER CHOICE, and it costs nothing
   * that matters: the `provider` in the schema, the H1, the domain, the phone
   * and the form all stay ours whether or not a partner is named. A name here
   * is a Place name, not a competing provider.
   *
   * It also tends to work better. An address with no business attached reads as
   * evasive, and the reader who types the street into Google finds the name in
   * two seconds anyway — at which point the omission is the thing they noticed.
   *
   * null is legitimate when the sentence is about where OUR technician is
   * based rather than about a partnership, which is how `public_technicians`
   * already models it (base_city, base_lat, base_lng). It is NOT legitimate as
   * a way to imply the premises are ours.
   */
  businessName: string | null;

  street: string;
  postalCode: string;
  /** The city as it is written on an envelope; may differ from CITIES.city. */
  city: string;
  /** District, when it is the part a local would recognise. */
  district?: string;

  /*
   * Third-party credentials, printed verbatim and only when verified.
   *
   * "Betrouwbare partner" is a claim about ourselves and worth nothing.
   * "RDW-erkend APK-station" is a status the RDW grants and anyone can check,
   * which is the only kind of trust line worth the space.
   *
   * VERIFY BEFORE ADDING ONE. Everything in this repo that was typed from
   * memory rather than read off a document — the btw number, the review count,
   * three invented reviews — had to be taken back out again.
   */
  credentials?: string[];

  /*
   * A photo of the place, under /public/images.
   *
   * Worth more than a map pin: a pin asserts a coordinate, a photo shows a
   * building. It is also the only one of the two that an image sitemap can
   * carry, and ours already carries 423 images.
   *
   * ONE CONSTRAINT. If `businessName` is null, the photo must not show the
   * occupant's signage. Leaving a name out of the text while it is legible in
   * the picture is not discretion, and cropping it away on purpose is worse
   * than either naming them or using a different frame.
   */
  photo?: { src: string; alt: string };

  /*
   * Coordinates, when they have been looked up properly.
   *
   * Optional on purpose: everything here works from the address alone. The
   * static map resolves the address itself and `geo` is not required by
   * schema.org. An approximate pin — the city centre, the district centroid —
   * is worse than none, because it is a wrong answer stated precisely.
   */
  geo?: { lat: string; lng: string };
};

export const PARTNER_LOCATIONS: readonly PartnerLocation[] = [
  {
    citySlug: 'amsterdam',
    /*
     * Left null at the office's instruction.
     *
     * The occupant is an APK station on the Draaierweg whose name is on the
     * front of the building, so the photo of that front cannot be used while
     * this is null — see `photo` above. Setting the name here is a one-line
     * change and it unlocks that photo, which is the strongest asset this
     * block could carry.
     */
    businessName: null,
    street: 'Draaierweg 10',
    postalCode: '1032 KS',
    city: 'Amsterdam',
    district: 'Amsterdam Noord',
    /*
     * An APK station is RDW-approved by law, and the signage on the premises
     * reads "APK STATION". CONFIRM IT AGAINST THE RDW REGISTER BEFORE THIS
     * GOES LIVE — a credential is only worth printing if it is checkable, and
     * checkable cuts both ways.
     */
    credentials: ['RDW-erkend APK-station'],
  },
] as const;

/** The location for a city, or null when we have nobody based there. */
export function partnerFor(citySlug: string): PartnerLocation | null {
  return PARTNER_LOCATIONS.find((p) => p.citySlug === citySlug) ?? null;
}

/** "Draaierweg 10, 1032 KS Amsterdam" — one line, for text and for maps. */
export function formatAddress(p: PartnerLocation): string {
  return `${p.street}, ${p.postalCode} ${p.city}`;
}
