/**
 * The shape every country's site config must have.
 *
 * Written to match nl.ts, which is the reference: the Dutch site is the one
 * that works, so the other two are held to its shape rather than to a new
 * abstraction invented alongside them.
 *
 * Fields are `string` rather than literals on purpose. nl.ts keeps its own
 * narrow types through `as const`, and SITE_CONFIG is typed as this interface
 * because SITE_ID is only known at build time — there is nothing for the
 * compiler to narrow to.
 */
export interface SiteConfig {
  readonly name: string;
  readonly fullName: string;
  readonly tagline: string;
  /** Primary origin, no trailing slash. Feeds metadataBase and every canonical. */
  readonly domain: string;

  readonly phone: string;
  readonly phoneTel: string;
  readonly whatsapp: string;
  readonly email: string;

  readonly address: {
    readonly street: string;
    readonly city: string;
    readonly region: string;
    readonly postal: string;
    readonly country: string;
  };
  readonly geo: { readonly lat: string; readonly lng: string };
  readonly serviceArea: {
    readonly lat: string;
    readonly lng: string;
    readonly radiusMeters: string;
  };
  readonly serviceAreaString: string;

  readonly prices: {
    readonly unlock: string;
    readonly transponder: string;
    readonly klapsleutel: string;
    readonly remote: string;
    readonly smartKey: string;
    readonly allKeysLost: string;
    readonly casing: string;
    readonly ignition: string;
    readonly exVatDisclaimer: string;
  };

  readonly siteId: string;
  /** ISO country of the market this build serves. Filters CITIES. */
  readonly country: 'NL' | 'BE' | 'DE';
  /** Value for <html lang>. */
  readonly htmlLang: string;
  readonly hreflang: string;
  /** Exactly one site in the cluster is the x-default. */
  readonly isXDefault: boolean;
  /** Leading digits of a postcode here: 4 in NL/BE, 5 in DE. */
  readonly postcodeDigits: 4 | 5;
  readonly vat: { readonly rate: number; readonly pricesAreGross: boolean };
  /** Value for the `geo.region` meta tag: an ISO country or region code. */
  readonly geoRegion: string;
  /** The country's name in this site's own language, for `geo.placename`. */
  readonly countryName: string;
  /** Open Graph locale, e.g. nl_NL. */
  readonly ogLocale: string;
  /** Languages a customer can be served in here, for schema availableLanguage. */
  readonly availableLanguage: readonly string[];
  /** The service-area map this site embeds, or null when it has none yet. */
  readonly serviceAreaMapUrl: string | null;
  /** The business description in the LocalBusiness node, in this site's language. */
  readonly schemaDescription: string;
  /**
   * The cities named in schema `areaServed`, on top of the regions.
   *
   * Hand-curated rather than derived from CITIES, because this list answers
   * "where does the Google Business Profile say we work" and CITIES answers
   * "what pages exist" — they are close but they are not the same question,
   * and the GBP one is the one a crawler should be told.
   */
  readonly areaServedCities: readonly { readonly name: string; readonly sameAs?: string }[];
  /** Source for a RegExp that a valid VAT id here must match. */
  readonly vatNumberPattern: string;
  readonly paymentAccepted: readonly string[];

  readonly hours: string;
  readonly hoursShort: string;
  readonly responseTime: string;

  readonly kvk: string;
  readonly btw: string;
  readonly iban: string;
  readonly rating: string;
  readonly reviewCount: string;

  readonly social: {
    readonly facebook: string;
    readonly instagram: string;
    readonly google: string;
    readonly marktplaats: string;
  };

  readonly blobStorageDomain: string;
}

/**
 * Stands in for a value only the office can supply — a consumer price, a VAT
 * id, a registered address.
 *
 * Not a guess and not an empty string: both of those ship. A build that would
 * put one of these in front of a customer refuses to start instead, the same
 * way src/proxy.ts refuses to serve an unconfigured CRM rather than serving an
 * unguarded one. Grep for it to see what a country is still missing.
 */
export const TBD = '__TBD__';

/** Every string field still holding TBD, as dotted paths. */
export function missingFields(site: SiteConfig): string[] {
  const out: string[] = [];
  const walk = (value: unknown, path: string) => {
    if (value === TBD) {
      out.push(path);
      return;
    }
    if (value && typeof value === 'object') {
      for (const [k, v] of Object.entries(value)) {
        walk(v, path ? `${path}.${k}` : k);
      }
    }
  };
  walk(site, '');
  return out;
}

/**
 * Refuses a build that would serve placeholders to customers.
 *
 * Called from ./index.ts for whichever site SITE_ID selects. A missing price
 * or VAT number is not something to render as a dash and fix later — in
 * Germany a price shown without MwSt is an Abmahnung and a wrong USt-IdNr. on
 * an invoice is somebody else's tax problem, so the deploy fails here, by
 * name, where it is cheap.
 */
export function assertSiteComplete(site: SiteConfig): void {
  const missing = missingFields(site);
  if (missing.length === 0) return;
  throw new Error(
    `Site "${site.siteId}" is not ready to build. The office still has to supply:\n` +
      missing.map((f) => `  - ${f}`).join('\n') +
      `\n\nSee EXPANSION-BE-DE-PLAN.md section 10.`
  );
}
