/* Dutch labels for the raw lead values; unknown values pass through. */
export const SOURCE_LABELS: Record<string, string> = {
  hero_wizard: 'Website wizard', kenteken_form: 'Kentekenformulier', hero_form: 'Websiteformulier', city_form: 'Stadspagina',
  contact_form: 'Contactformulier', webshop_service: 'Webshop', phone: 'Telefoon', whatsapp: 'WhatsApp', agent: 'Belagent',
  other: 'Overig', unknown: 'Onbekend',
};
export const STATUS_LABELS: Record<string, string> = {
  new: 'Nieuw', qualified: 'Gekwalificeerd', contacted: 'Gebeld', sold: 'Verkocht', rejected: 'Afgewezen', duplicate: 'Dubbel', spam: 'Spam',
};
export const sourceLabel = (s: string | null) => SOURCE_LABELS[s ?? 'unknown'] ?? s ?? 'Onbekend';
export const statusLabel = (s: string) => STATUS_LABELS[s] ?? s;
export const MONEY0 = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
export const signed = (n: number | null) => (n === null ? '—' : `${n > 0 ? '+' : ''}${n.toLocaleString('nl-NL')}%`);
