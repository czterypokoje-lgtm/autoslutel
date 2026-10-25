/**
 * A partner location on a real Google map.
 *
 * Loads by itself (owner's choice, 25 Oct 2026: no tap). `loading="lazy"`
 * keeps it off the critical path: the browser only fetches the Maps embed
 * when the section scrolls near the viewport, so the top of the page loads
 * as fast as before. Google's embed shows its own place card for the address.
 *
 * The keyless `output=embed` URL needs no API key and no billing; the query
 * is the partner's name and full address so Google resolves the exact place.
 */
export default function PartnerGarageMap({ query, title }: { query: string; title: string }) {
  const src = `https://www.google.com/maps?q=${encodeURIComponent(query)}&hl=nl&output=embed`;
  return (
    <iframe
      src={src}
      title={title}
      style={{ border: 0, display: 'block', width: '100%', height: '100%', minHeight: 320 }}
      allowFullScreen
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
    />
  );
}
