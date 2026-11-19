import ProblemPage, { problemPageMetadata } from '@/components/ProblemPage/ProblemPage';

/*
 * "Autosleutel werkt niet meer" and "auto herkent sleutel niet" are one page:
 * google.nl shows the same pages for both queries (12 Nov 2026), and a
 * customer often cannot tell the two faults apart until the page helps them.
 * Content: src/config/problemPages.ts.
 */
const SLUG = 'autosleutel-werkt-niet';

export const metadata = problemPageMetadata(SLUG);

export default function Page() {
  return <ProblemPage slug={SLUG} />;
}
