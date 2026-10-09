import type { Phrase } from './index';

/**
 * Aanbod — work being offered to a partner, on a clock.
 *
 * The first screen worth translating after the shell, because it is the one
 * where saying the wrong thing costs money: an offer expires, and a partner
 * who cannot read what is on it either lets it lapse or accepts a job they
 * cannot do.
 *
 * Two words chosen carefully. "Angebote", not "Aufträge": these are jobs being
 * offered, not assigned, and `dispatch.ts` is explicit that the difference is a
 * legal position and not a courtesy — a partner who cannot decline starts to
 * look like an employee. And "Ablehnen" rather than "Nein", because the Dutch
 * "Nee" is a button on a phone in a van and the German equivalent that reads
 * naturally there is the verb.
 */

export const AANBOD: Record<string, Phrase> = {
  title: { nl: 'Aanbod', de: 'Angebote' },
  sub: {
    nl: 'Klussen die bij jouw vak en gebied passen. Wie het eerst accepteert, krijgt de klus. Nee zeggen kost niets.',
    de: 'Aufträge, die zu Ihrem Fach und Ihrem Gebiet passen. Wer zuerst annimmt, bekommt den Auftrag. Ablehnen kostet nichts.',
  },
  step1: {
    nl: 'Kijk naar de auto, de plaats en de tijd.',
    de: 'Schauen Sie sich Fahrzeug, Ort und Zeit an.',
  },
  step2: {
    nl: 'Accepteren: de klus staat meteen in Vandaag, met het volledige adres.',
    de: 'Annehmen: der Auftrag steht sofort unter Heute, mit der vollständigen Adresse.',
  },
  step3: {
    nl: 'Geen tijd of niet jouw vak? Tik Nee, de volgende monteur krijgt hem.',
    de: 'Keine Zeit oder nicht Ihr Fach? Tippen Sie auf Ablehnen, dann geht er an den nächsten Monteur.',
  },

  notLinked: {
    nl: 'Je login is nog niet aan een monteur gekoppeld.',
    de: 'Ihr Login ist noch keinem Monteur zugeordnet.',
  },
  unknownCar: { nl: 'Onbekende auto', de: 'Unbekanntes Fahrzeug' },
  keyWork: { nl: 'Werk aan de sleutel', de: 'Arbeit am Schlüssel' },
  unknown: { nl: 'Onbekend', de: 'Unbekannt' },

  // OfferList
  timeLeft: { nl: 'Nog {time}', de: 'Noch {time}' },
  accept: { nl: 'Accepteren', de: 'Annehmen' },
  busy: { nl: 'Bezig…', de: 'Läuft…' },
  ownRateTitle: {
    nl: 'Uw eigen tarief uit Mijn vak',
    de: 'Ihr eigener Satz aus Mein Fach',
  },
  noneRightNow: { nl: 'Op dit moment geen aanbod.', de: 'Im Moment keine Angebote.' },
  emptyHintBefore: {
    nl: 'Nieuwe klussen verschijnen hier en via Telegram. Zet bij ',
    de: 'Neue Aufträge erscheinen hier und über Telegram. Tragen Sie unter ',
  },
  emptyHintAfter: {
    nl: " welke auto's je aankunt: wat daar niet staat, krijg je niet aangeboden.",
    de: ' ein, welche Fahrzeuge Sie übernehmen können: was dort nicht steht, wird Ihnen nicht angeboten.',
  },
  decline: { nl: 'Nee', de: 'Ablehnen' },
  runMigration: {
    nl: 'Voer supabase/migrations/0013_technician_platform.sql uit.',
    de: 'Führen Sie supabase/migrations/0013_technician_platform.sql aus.',
  },

  accepted: {
    nl: 'De klus is van jou. Je vindt hem bij Vandaag.',
    de: 'Der Auftrag ist Ihrer. Sie finden ihn unter Heute.',
  },
  declined: { nl: 'Afgewezen.', de: 'Abgelehnt.' },
  tooLate: {
    nl: 'Net te laat: een collega was er eerder bij.',
    de: 'Knapp zu spät: ein Kollege war schneller.',
  },
  expired: { nl: 'Dit aanbod is verlopen.', de: 'Dieses Angebot ist abgelaufen.' },
  gone: { nl: 'Dit aanbod bestaat niet meer.', de: 'Dieses Angebot existiert nicht mehr.' },
  noTechnician: {
    nl: 'Je login is niet aan een monteur gekoppeld.',
    de: 'Ihr Login ist keinem Monteur zugeordnet.',
  },
};
