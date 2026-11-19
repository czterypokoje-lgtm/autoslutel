import type { Metadata } from 'next';

/*
 * A demo must never compete with the pages that sell.
 *
 * This page was serving the site's DEFAULT title -- "Autosleutel Bijmaken of
 * Kwijt? Op Locatie | Autosleutel24" -- with robots "index, follow", which
 * made it one of exactly two indexable duplicates of that string. Its twin,
 * /demo-form, has been noindex since it was built; this one was missed.
 *
 * The metadata lives in a layout because the page itself is a client
 * component and cannot export metadata.
 */
export const metadata: Metadata = {
  title: 'Demo: Kenteken Lookup',
  robots: 'noindex, nofollow',
};

export default function DemoKentekenLayout({ children }: { children: React.ReactNode }) {
  return children;
}
