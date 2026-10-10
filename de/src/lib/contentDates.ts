/**
 * Echte lastmod-Daten je URL für die Sitemap.
 *
 * Die niederländische Fassung stempelte eine Zeit lang `new Date()` auf alle
 * 851 URLs, sodass jeder Build Google meldete, die ganze Seite habe sich
 * gerade geändert. Ein lastmod, der sich bei jedem Deploy für jede Seite
 * bewegt, trägt keine Information, und Google lernt, ihn zu ignorieren —
 * auch auf den Seiten, die man wirklich überarbeitet hat.
 *
 * Die Daten stehen je Inhaltsgruppe und werden nur angehoben, wenn sich der
 * Inhalt dieser Gruppe tatsächlich ändert. Immer in der Vergangenheit; ein
 * Datum in der Zukunft wird ignoriert.
 */

/** Anheben, wenn sich die gemeinsamen Vorlagen inhaltlich ändern. */
export const TEMPLATE_REVISED = '2026-10-10';

/**
 * Inhaltsstand je Abschnitt. Datum anpassen, wenn dieser Abschnitt bearbeitet
 * wird. Alles steht auf dem Tag, an dem die deutschen Texte geschrieben
 * wurden — es ist der erste Stand dieser Domain, nicht der niederländische.
 */
export const SECTION_REVISED: Record<string, string> = {
  home: '2026-10-10',
  leistungen: '2026-10-10',
  staedte: '2026-10-10',
  preise: '2026-10-10',
  legal: '2026-10-10', // Datenschutz, Cookie-Richtlinie, AGB, Impressum
  static: '2026-10-10', // ueber-uns, galerie, bewertungen, kontakt, haeufige-fragen
};

/**
 * Einzelne Ausnahmen, für Seiten, die allein bearbeitet wurden. Ein hier
 * eingetragener Pfad gewinnt gegen das Datum seines Abschnitts.
 */
export const PAGE_REVISED: Record<string, string> = {};

/** Löst den lastmod für einen Pfad auf: Seite, dann Abschnitt, dann Vorlage. */
export function lastModifiedFor(path: string, section: keyof typeof SECTION_REVISED | string): Date {
  const iso =
    PAGE_REVISED[path] ??
    SECTION_REVISED[section] ??
    TEMPLATE_REVISED;
  return new Date(`${iso}T00:00:00.000Z`);
}
