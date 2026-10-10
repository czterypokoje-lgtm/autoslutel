import { NextResponse } from 'next/server';
import { CITIES } from '@/config/cities';
import { formatAddress, partnerFor } from '@/config/partners';

/**
 * A static Google map of the service area, as a single image.
 *
 * WHY THIS EXISTS
 *
 * The My Maps embed on the home page costs 1.4 MB decoded across 22 requests,
 * 733 KB of it JavaScript — measured by loading the embed on its own and
 * reading its resource timings. That is a Maps application booting inside an
 * iframe to draw pins on a section most visitors only glance at.
 *
 * The Static Maps API draws the same thing as one image, typically well under
 * 100 KB, with no script at all. The interactive embed still loads, but only
 * when somebody taps the map and asks for it.
 *
 * WHY IT IS PROXIED INSTEAD OF LINKED DIRECTLY FROM <img src>
 *
 * A Static Maps URL carries the API key, and putting it in the page's HTML
 * publishes it. GOOGLE_MAPS_API_KEY is the same server-side key used for
 * geocoding, postcode lookup and distance matrix, so a leak is somebody else's
 * quota spent on our bill. Fetching it here keeps the key on the server and the
 * browser only ever sees /api/service-map.
 */

/** Marker cap: the URL has an 8192-character limit and a crowded map reads as mush. */
const MAX_MARKERS = 18;

export async function GET(request: Request) {
  const key = process.env.GOOGLE_MAPS_API_KEY;

  /*
   * When the map is unavailable — no key, the Maps Static API not enabled on
   * the Cloud project, Google having a bad day — answer 204.
   *
   * Deliberately not a redirect to some other map we happen to own: showing
   * the wrong picture of the service area is worse than showing none. The
   * browser cannot decode an empty body, so the <img> fires onError and the
   * facade falls back to its own branded panel.
   *
   * Short cache so the section starts working the moment the API is switched
   * on, without a redeploy.
   */
  const unavailable = () =>
    new NextResponse(null, {
      status: 204,
      headers: { 'Cache-Control': 'public, max-age=300' },
    });

  if (!key) return unavailable();

  /*
   * ?partner=<citySlug> draws one address instead of the whole service area.
   *
   * THE SLUG IS LOOKED UP, NEVER PASSED THROUGH. An `?address=` parameter
   * would turn this route into an open proxy for the Static Maps API on our
   * key and our bill, which is the exact thing the comment above about not
   * putting the key in the HTML exists to prevent. Only a slug that resolves
   * to an entry in PARTNER_LOCATIONS produces a map; anything else falls
   * through to the service-area map.
   *
   * Google resolves the address string itself, so no geocoding call and no
   * stored coordinates are needed. `geo` is used when the entry has it,
   * because a looked-up coordinate beats a text match.
   */
  const partnerSlug = new URL(request.url).searchParams.get('partner');
  const partner = partnerSlug ? partnerFor(partnerSlug) : null;

  const url = new URL('https://maps.googleapis.com/maps/api/staticmap');
  url.searchParams.set('scale', '2');          // sharp on the phone screens this is for
  url.searchParams.set('maptype', 'roadmap');
  url.searchParams.set('language', 'nl');
  url.searchParams.set('region', 'NL');

  if (partner) {
    const at = partner.geo ? `${partner.geo.lat},${partner.geo.lng}` : formatAddress(partner);
    /*
     * 4:3 to match the figure's aspect-ratio, and a zoom that shows the
     * surrounding streets: the point is "this is a real place in this part of
     * town", which a pin at maximum zoom does not convey.
     */
    url.searchParams.set('size', '640x480');
    url.searchParams.set('zoom', '15');
    url.searchParams.set('center', at);
    url.searchParams.set('markers', `size:mid|color:0xea580c|${at}`);
  } else {
    /*
     * Busiest cities first, so if the cap bites it drops Woerden rather than
     * Amsterdam. nlSearches is real search volume already in the config.
     *
     * No center and no zoom on purpose: given only markers, the API frames
     * them itself, so the map stays correct if we add a city tomorrow.
     */
    const pins = [...CITIES]
      .sort((a, b) => (b.nlSearches ?? 0) - (a.nlSearches ?? 0))
      .slice(0, MAX_MARKERS)
      .map((c) => `${c.geo.lat},${c.geo.lng}`);

    url.searchParams.set('size', '640x640');
    url.searchParams.set('markers', `size:small|color:0x1d4ed8|${pins.join('|')}`);
  }

  url.searchParams.set('key', key);

  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return unavailable();

    const body = await res.arrayBuffer();
    return new NextResponse(body, {
      headers: {
        'Content-Type': res.headers.get('content-type') ?? 'image/png',
        /*
         * A day. Google permits temporary caching for performance, and the
         * service area does not change hourly — but this is deliberately not
         * written to disk as a permanent asset.
         */
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
      },
    });
  } catch {
    return unavailable();
  }
}
