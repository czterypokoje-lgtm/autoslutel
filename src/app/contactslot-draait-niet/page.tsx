import ProblemPage, { problemPageMetadata } from '@/components/ProblemPage/ProblemPage';

/*
 * The symptom ("sleutel draait niet") rather than the repair ("contactslot
 * vervangen"): often it is the steering lock or a worn key, not the lock.
 * /diensten/contactslot-auto-vervangen stays the page for the repair.
 * Content: src/config/problemPages.ts.
 */
const SLUG = 'contactslot-draait-niet';

export const metadata = problemPageMetadata(SLUG);

export default function Page() {
  return <ProblemPage slug={SLUG} />;
}
