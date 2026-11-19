import { SITE_CONFIG } from '@/config/site.config';

/*
 * Section headings for the ServiceLayout pages, per service.
 *
 * The layout used to build every heading from the service title, which gave
 * broken Dutch on most pages: "Wanneer Heeft U Autosleutel Kwijt Nodig?",
 * "In Welke Regio's Bieden Wij Sleutel in Auto?". Search Console (Jul-Oct
 * 2026) has /autosleutel-kwijt at position ~34 for "autosleutel kwijt" while
 * Google's AI Overview quotes competitors' step lists for the same question.
 * Headings that are the questions people actually ask, in correct Dutch, are
 * what both read.
 *
 * `topic` is a lower-case noun phrase that fits "Veelgestelde vragen over …".
 */
export type ServiceHeadings = {
  when: string;
  cost: string;
  regions: string;
  topic: string;
  /** Answer-first step list, rendered as the first section (AI Overviews quote these). */
  steps?: { question: string; items: string[] };
};

export const SERVICE_HEADINGS: Record<string, ServiceHeadings> = {
  'alle-sleutels-kwijt-auto': {
    when: 'Autosleutel kwijt: wanneer komen wij?',
    cost: 'Wat kost een nieuwe autosleutel als u alles kwijt bent?',
    regions: 'Autosleutel kwijt? Hier komen wij naar u toe',
    topic: 'een verloren autosleutel',
    steps: {
      question: 'Wat moet u doen als uw autosleutel kwijt is?',
      items: [
        'Zoek eerst goed na: denk terug aan waar u de sleutel het laatst had, thuis en onderweg.',
        'Verloren op straat? Meld het bij de gemeente via verlorenofgevonden.nl. Gestolen? Doe aangifte bij de politie.',
        'Laat de auto niet naar de dealer slepen: een mobiele autosleutelspecialist maakt de sleutel bij uw auto. Dat scheelt sleepkosten en dagen wachten.',
        'Houd uw kenteken en legitimatie klaar, zodat wij kunnen controleren dat de auto van u is.',
        `De monteur maakt ter plaatse een nieuwe sleutel en wist de verloren sleutel uit het geheugen van de auto, zodat niemand er nog mee kan wegrijden. Bij ons vanaf €${SITE_CONFIG.prices.allKeysLost}.`,
      ],
    },
  },
  'auto-openen-zonder-sleutel': {
    when: 'Wanneer moet uw autodeur geopend worden?',
    cost: 'Wat kost een autodeur openen?',
    regions: 'Waar openen wij uw autodeur?',
    topic: 'autodeur openen',
  },
  'sleutel-in-auto': {
    when: 'Sleutel in de auto laten liggen: wat nu?',
    cost: 'Wat kost het openen als de sleutel in de auto ligt?',
    regions: 'Sleutel in de auto? Hier komen wij naar u toe',
    topic: 'een sleutel in de auto',
  },
  'deur-dichtgevallen': {
    when: 'Autodeur dichtgevallen met de sleutel erin?',
    cost: 'Wat kost het openen van een dichtgevallen autodeur?',
    regions: 'Deur dichtgevallen? Hier komen wij naar u toe',
    topic: 'een dichtgevallen autodeur',
  },
  'kofferbak-openen': {
    when: 'Wanneer moet de kofferbak geopend worden?',
    cost: 'Wat kost een kofferbak openen?',
    regions: 'Waar openen wij uw kofferbak?',
    topic: 'kofferbak openen',
  },
  'sleutel-afgebroken-in-slot': {
    when: 'Sleutel afgebroken in het slot: wat nu?',
    cost: 'Wat kost het verwijderen van een afgebroken sleutel?',
    regions: 'Sleutel afgebroken? Hier komen wij naar u toe',
    topic: 'een afgebroken sleutel',
  },
  'transponder-programmeren': {
    when: 'Wanneer moet een transponder geprogrammeerd worden?',
    cost: 'Wat kost transponder programmeren?',
    regions: 'Waar programmeren wij uw transponder?',
    topic: 'transponder programmeren',
  },
  'afstandsbediening-bijmaken': {
    when: 'Wanneer heeft u een extra afstandsbediening nodig?',
    cost: 'Wat kost een afstandsbediening bijmaken?',
    regions: 'Waar maken wij uw afstandsbediening bij?',
    topic: 'een afstandsbediening bijmaken',
  },
  'smart-key-programmeren': {
    when: 'Wanneer moet een smart key geprogrammeerd worden?',
    cost: 'Wat kost smart key programmeren?',
    regions: 'Waar programmeren wij uw smart key?',
    topic: 'smart key programmeren',
  },
  'reservesleutel-maken': {
    when: 'Wanneer laat u een reservesleutel maken?',
    cost: 'Wat kost een reservesleutel laten maken?',
    regions: 'Waar maken wij uw reservesleutel?',
    topic: 'een reservesleutel laten maken',
  },
  'noodopening-auto': {
    when: 'Wanneer heeft u een noodopening nodig?',
    cost: 'Wat kost een noodopening van uw auto?',
    regions: 'Waar komen wij voor een noodopening?',
    topic: 'een noodopening',
  },
  'batterij-vervangen': {
    when: 'Wanneer moet de batterij van uw autosleutel vervangen worden?',
    cost: 'Wat kost het vervangen van een autosleutelbatterij?',
    regions: 'Waar vervangen wij uw sleutelbatterij?',
    topic: 'de batterij van uw autosleutel',
  },
  'autosleutels-repareren': {
    when: 'Wanneer moet uw autosleutel gerepareerd worden?',
    cost: 'Wat kost een autosleutel repareren?',
    regions: 'Waar repareren wij uw autosleutel?',
    topic: 'autosleutel repareren',
  },
  'behuizing-vervangen': {
    when: 'Wanneer vervangt u de behuizing van uw autosleutel?',
    cost: 'Wat kost een nieuwe sleutelbehuizing?',
    regions: 'Waar vervangen wij uw sleutelbehuizing?',
    topic: 'een nieuwe sleutelbehuizing',
  },
  'knoppen-repareren': {
    when: 'Wanneer moeten de knoppen van uw autosleutel gerepareerd worden?',
    cost: 'Wat kost het repareren van sleutelknoppen?',
    regions: 'Waar repareren wij uw sleutelknoppen?',
    topic: 'sleutelknoppen repareren',
  },
  'contactslot-auto-vervangen': {
    when: 'Wanneer moet het contactslot vervangen worden?',
    cost: 'Wat kost een contactslot vervangen?',
    regions: 'Waar vervangen wij uw contactslot?',
    topic: 'contactslot vervangen',
  },
};

/** Headings for a service, falling back to the old title-based wording. */
export function headingsFor(slug: string, title: string): ServiceHeadings {
  return (
    SERVICE_HEADINGS[slug] ?? {
      when: `Wanneer heeft u ${title.toLowerCase()} nodig?`,
      cost: `Wat kost ${title.toLowerCase()}?`,
      regions: `Waar komen wij voor ${title.toLowerCase()}?`,
      topic: title.toLowerCase(),
    }
  );
}
