import ProblemPage, { problemPageMetadata } from '@/components/ProblemPage/ProblemPage';

/*
 * The one spare-key page. Three others now 301 here (next.config.ts); why,
 * with the Search Console numbers, is noted on the entry in
 * src/config/problemPages.ts. The address is kept because the menu and the
 * footer link to it from every page.
 */
const SLUG = 'autosleutel-bijmaken';

export const metadata = problemPageMetadata(SLUG);

export default function Page() {
  return <ProblemPage slug={SLUG} />;
}
