import ProblemPage, { problemPageMetadata } from '@/components/ProblemPage/ProblemPage';

/*
 * The broken key as the customer sees it: blade, housing or the whole key.
 * /diensten/sleutel-afgebroken-in-slot stays the page for a piece stuck in
 * a lock; this page sends that case there. Content: src/config/problemPages.ts.
 */
const SLUG = 'autosleutel-afgebroken';

export const metadata = problemPageMetadata(SLUG);

export default function Page() {
  return <ProblemPage slug={SLUG} />;
}
