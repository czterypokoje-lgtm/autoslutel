/**
 * The partner garage on a real Google map.
 *
 * Loads by itself (owner's choice, 25 Oct 2026: no tap). `loading="lazy"`
 * keeps it off the critical path: the browser only fetches the Maps embed
 * when the section scrolls near the viewport, so the top of the page loads
 * as fast as before. Google's embed shows its own place card for the garage
 * (name, address, rating, "Openen in Maps").
 *
 * The keyless `output=embed` URL needs no API key and no billing; the query
 * is the garage's name and full address so Google resolves the exact place.
 */
const PLACE_QUERY = 'Garage NRD, Draaierweg 10, 1032 KS Amsterdam';
const EMBED_URL = `https://www.google.com/maps?q=${encodeURIComponent(PLACE_QUERY)}&hl=nl&output=embed`;

export default function PartnerGarageMap() {
  return (
    <iframe
      src={EMBED_URL}
      title="Garage NRD op Google Maps — Draaierweg 10, Amsterdam-Noord"
      style={{ border: 0, display: 'block', width: '100%', height: '100%', minHeight: 320 }}
      allowFullScreen
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
    />
  );
}
