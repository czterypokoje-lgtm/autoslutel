import type { Phrase } from './index';

/**
 * The CRM shell as a monteur reads it: the sidebar, the phone tab bar and the
 * handful of labels around them.
 *
 * Only the monteur-facing strings are here. The office navigation stays Dutch
 * and is not in this file, which is a decision rather than an omission: the
 * office is one Dutch-speaking team, and the split is already enforced in
 * code — 26 routes behind requireOfficeUser, 19 behind requireCrmUser.
 * Translating the office screens would be work nobody reads.
 *
 * The German is written for a tradesman, not for an office. "Aufträge", not
 * "Arbeitsaufträge"; "Mein Transporter", because a German locksmith says
 * Transporter where a Dutch one says bus; "Angebote" for Aanbod, which is
 * work being offered to them and not a quote they sent out.
 */

export const NAV: Record<string, Phrase> = {
  overzicht: { nl: 'Overzicht', de: 'Übersicht' },
  vandaag: { nl: 'Vandaag', de: 'Heute' },
  aanbod: { nl: 'Aanbod', de: 'Angebote' },
  mijnAgenda: { nl: 'Mijn agenda', de: 'Mein Kalender' },
  mijnKlussen: { nl: 'Mijn klussen', de: 'Meine Aufträge' },
  mijnBus: { nl: 'Mijn bus', de: 'Mein Transporter' },
  watErinLigt: { nl: 'Wat erin ligt', de: 'Was drin liegt' },
  onderdelenBestellen: { nl: 'Onderdelen bestellen', de: 'Teile bestellen' },
  geld: { nl: 'Geld', de: 'Geld' },
  saldo: { nl: 'Saldo', de: 'Guthaben' },
  facturen: { nl: 'Facturen', de: 'Rechnungen' },
  mijnUitgaven: { nl: 'Mijn uitgaven', de: 'Meine Ausgaben' },
  mijnVak: { nl: 'Mijn vak', de: 'Mein Fach' },
  profiel: { nl: 'Profiel', de: 'Profil' },
};

export const SHELL: Record<string, Phrase> = {
  menuOpenen: { nl: 'Menu openen', de: 'Menü öffnen' },
  menuSluiten: { nl: 'Menu sluiten', de: 'Menü schließen' },
  snelmenu: { nl: 'Snelmenu', de: 'Schnellmenü' },
  zoeken: { nl: 'Zoeken', de: 'Suchen' },
  monteurLabel: { nl: 'Monteur', de: 'Monteur' },
  profielTitel: { nl: 'Profiel', de: 'Profil' },
  taal: { nl: 'Taal', de: 'Sprache' },
};
