import type { Topic } from './topics';

/*
 * Ready replies for the reply box, in the office's own wording (taken from the
 * WhatsApp history: "op locatie met 1 jaar garantie", prices incl. btw).
 *
 * {naam} {auto} {datum} {tijd} are filled from the lead and job when known.
 * [prijs], [link] and other square brackets are for a person to fill in: the
 * composer refuses to send while one is left, so a template can never go out
 * with a made-up or missing price.
 */
export interface ReplyTemplate {
  id: string;
  topic: Topic | 'algemeen';
  label: string;
  text: string;
}

export const REPLY_TEMPLATES: ReplyTemplate[] = [
  {
    id: 'gegevens',
    topic: 'aanvraag',
    label: 'Gegevens opvragen',
    text:
      'Goedendag {naam}, bedankt voor uw bericht. Om u een juiste prijs te geven: wat is het kenteken (of merk, model en bouwjaar) van de auto, heeft u nog een werkende sleutel, en waar staat de auto (postcode)?',
  },
  {
    id: 'prijs-bijmaken',
    topic: 'aanvraag',
    label: 'Prijs: extra sleutel',
    text:
      'Goedendag {naam}, een extra sleutel voor uw {auto} kost €[prijs] incl. btw. Wij komen op locatie en u krijgt 1 jaar garantie. Zal ik een afspraak voor u inplannen?',
  },
  {
    id: 'prijs-kwijt',
    topic: 'aanvraag',
    label: 'Prijs: alle sleutels kwijt',
    text:
      'Goedendag {naam}, een nieuwe sleutel voor uw {auto} als alle sleutels kwijt zijn kost €[prijs] incl. btw, op locatie en met 1 jaar garantie. Vaak kunnen we dezelfde dag nog komen. Waar staat de auto?',
  },
  {
    id: 'opvolgen',
    topic: 'aanvraag',
    label: 'Opvolgen (geen reactie)',
    text: 'Goedendag {naam}, heeft u nog interesse in de sleutel voor uw {auto}? Laat het gerust weten, dan plannen we iets in dat u uitkomt.',
  },
  {
    id: 'kunnen-niet',
    topic: 'aanvraag',
    label: 'Kunnen we niet doen',
    text: 'Goedendag {naam}, helaas kunnen wij voor uw {auto} geen sleutel maken. [reden]. Excuses voor het ongemak en veel succes.',
  },
  {
    id: 'bestelling-ontvangen',
    topic: 'bestelling',
    label: 'Bestelling ontvangen',
    text: 'Goedendag {naam}, bedankt voor uw bestelling. We gaan er direct mee aan de slag en u krijgt een bericht zodra het pakket verzonden is.',
  },
  {
    id: 'bestelling-verzonden',
    topic: 'bestelling',
    label: 'Verzonden + track & trace',
    text: 'Goedendag {naam}, uw bestelling is verzonden. U kunt het pakket volgen via: [track & trace link].',
  },
  {
    id: 'bestelnummer',
    topic: 'bestelling',
    label: 'Bestelnummer vragen',
    text: 'Goedendag {naam}, kunt u uw bestelnummer sturen? Dan zoek ik het direct voor u op.',
  },
  {
    id: 'afspraak-bevestigen',
    topic: 'afspraak',
    label: 'Afspraak bevestigen',
    text: 'Goedendag {naam}, uw afspraak voor de {auto} staat op {datum} tussen {tijd}. De monteur belt kort van tevoren. Tot dan!',
  },
  {
    id: 'onderweg',
    topic: 'afspraak',
    label: 'Monteur onderweg',
    text: 'Goedendag {naam}, de monteur is onderweg en is er over ongeveer [minuten] minuten.',
  },
  {
    id: 'klacht',
    topic: 'service',
    label: 'Klacht / garantie',
    text:
      'Goedendag {naam}, vervelend om te horen. Kunt u kort beschrijven wat er niet werkt, eventueel met een foto? U heeft 1 jaar garantie, dus we lossen het voor u op.',
  },
  {
    id: 'bedankt-review',
    topic: 'algemeen',
    label: 'Bedankt + review vragen',
    text: 'Goedendag {naam}, bedankt voor uw vertrouwen! Zou u ons een korte review willen geven? Dat helpt ons enorm: [reviewlink]',
  },
];

export interface TemplateContext {
  name: string | null;
  car: string | null;
  date: string | null;
  slot: string | null;
}

/** Fill the known placeholders; leave [brackets] for a person. */
export function fillTemplate(text: string, ctx: TemplateContext): string {
  const first = ctx.name?.trim().split(/\s+/)[0] ?? '';
  return text
    .replace(/ \{naam\}/g, first ? ` ${first}` : '')
    .replace(/\{naam\}/g, first)
    .replace(/\{auto\}/g, ctx.car?.trim() || 'auto')
    .replace(/\{datum\}/g, ctx.date ?? '[datum]')
    .replace(/\{tijd\}/g, ctx.slot ?? '[tijd]');
}

/** Square-bracket placeholders still in a text, e.g. "[prijs]". */
export const openPlaceholders = (text: string) => text.match(/\[[^\]\n]{1,40}\]/g) ?? [];
