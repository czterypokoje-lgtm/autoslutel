
/**
 * What language the CRM speaks to the person reading it.
 *
 * Types and constants only, so client components can import them. Reading the
 * value out of the database is getCrmLocale() in ./crmLocaleServer.
 *
 * This does NOT come from SITE_ID. The public site is one build per country,
 * but the CRM is a single deployment for all three — admin/netwerk/layout.tsx
 * says it outright: "A server is a country: Nederland, Duitsland, België. The
 * boundary sorts the conversation, not the people." The office works in Dutch
 * and a Berlin partner does not read it, so the language has to come from the
 * person, at request time.
 *
 * It is also not derived from their country. Belgium is Dutch and French, and
 * a German-speaking monteur may work a Belgian postcode. technicians.locale is
 * set by the monteur (migration 0073) and defaults to 'nl', so every existing
 * account sees exactly what it saw before this file existed.
 */

export const CRM_LOCALES = ['nl', 'de', 'fr'] as const;
export type CrmLocale = (typeof CRM_LOCALES)[number];

export const DEFAULT_CRM_LOCALE: CrmLocale = 'nl';

export function isCrmLocale(value: unknown): value is CrmLocale {
  return typeof value === 'string' && (CRM_LOCALES as readonly string[]).includes(value);
}

/**
 * The BCP-47 tag to hand Intl for this locale.
 *
 * Not cosmetic: a Berlin partner was being shown Dutch weekday abbreviations
 * and Dutch currency formatting ("€ 129,00" with a Dutch thousands separator)
 * because every Intl call in the CRM was hardcoded to 'nl-NL'. French is
 * fr-BE rather than fr-FR because Wallonia is who it is for.
 *
 * The time zone is deliberately not part of this: Amsterdam, Brussels and
 * Berlin are the same offset all year, so a job's slot reads the same in all
 * three and splitting it would be ceremony. That stops being true the day a
 * fourth country is outside CET.
 */
export const INTL_LOCALE: Record<CrmLocale, string> = {
  nl: 'nl-NL',
  de: 'de-DE',
  fr: 'fr-BE',
};

/** Human name of a language, in that language. For the picker. */
export const CRM_LOCALE_LABELS: Record<CrmLocale, string> = {
  nl: 'Nederlands',
  de: 'Deutsch',
  fr: 'Français',
};
