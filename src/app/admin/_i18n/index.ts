import { type CrmLocale } from '@/lib/crmLocale';

/**
 * One phrase in the CRM, in every language the CRM speaks it.
 *
 * `de` is REQUIRED, deliberately. A dictionary where the translation is
 * optional quietly renders Dutch to a Berlin partner and looks finished from
 * the outside; making it required means a phrase that has not been translated
 * is a compile error instead of something a German partner discovers.
 *
 * `fr` is optional and falls back to Dutch, because Wallonia is a later phase
 * (see EXPANSION-BE-DE-PLAN.md section 9) and an honest gap in the type is
 * better than French invented to satisfy it.
 */
export type Phrase = { nl: string; de: string; fr?: string };

/** The phrase in this locale, falling back to Dutch where it has no entry. */
export function t(phrase: Phrase, locale: CrmLocale): string {
  return phrase[locale] ?? phrase.nl;
}

/**
 * A `t` bound to one locale, so a screen reads `tr(COPY.title)` rather than
 * threading the locale through every call.
 */
export function translator(locale: CrmLocale) {
  return (phrase: Phrase) => t(phrase, locale);
}

/** Interpolates {name}-style placeholders after translating. */
export function tf(
  phrase: Phrase,
  locale: CrmLocale,
  vars: Record<string, string | number>
): string {
  return t(phrase, locale).replace(/\{(\w+)\}/g, (whole, key) =>
    key in vars ? String(vars[key]) : whole
  );
}
