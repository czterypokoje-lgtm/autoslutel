/**
 * Der Blog dieser App ist leer — mit Absicht.
 *
 * Die niederländische Seite hat rund dreißig Artikel; sie sind auf
 * Niederländisch geschrieben, verweisen auf niederländische Preise, Städte
 * und das RDW-Register und ranken für niederländische Suchanfragen. Übersetzt
 * sind sie noch nicht, und eine maschinelle Übersetzung eines Ratgebers ist
 * genau die Art Inhalt, für die Google eine neue Domain abstraft.
 *
 * Darum gibt es in dieser App keine /blog-Route. Diese Datei bleibt, weil
 * ServiceLayout und die Leistungsseiten getRelatedBlogPosts() aufrufen: eine
 * leere Liste lässt den Abschnitt "Weiterlesen" dort einfach verschwinden,
 * statt ihn mit Links auf 404-Seiten zu füllen.
 *
 * Wenn deutsche Artikel geschrieben sind: hier eintragen, die Zuordnung in
 * getRelatedBlogPosts() füllen und die Route app/blog anlegen. Solange das
 * nicht geschehen ist, darf nichts hier hinein.
 */

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  keywords: string[];
  publishDate: string;
  readTime: string;
}

/** Slugs, die weiterleiten. Leer, weil es keine Artikel gibt, die umziehen. */
export const REDIRECTED_BLOG_SLUGS = new Set<string>([]);

export const BLOG_POSTS: BlogPost[] = [];

/**
 * Die Artikel, die zu einer Leistungsseite passen.
 *
 * Die Zuordnung Leistung → Artikel wird gebraucht, sobald es Artikel gibt;
 * bis dahin ist jede Antwort leer, und die Aufrufer zeigen den Abschnitt
 * nicht an.
 */
export function getRelatedBlogPosts(_serviceSlug: string): BlogPost[] {
  return [];
}
