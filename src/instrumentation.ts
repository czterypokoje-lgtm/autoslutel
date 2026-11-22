/**
 * Runs once when a server instance starts (Next's instrumentation hook).
 *
 * The install guard: a deployment whose Supabase project belongs to the other
 * install does not start. proxy.ts repeats the check on every request and the
 * client factories in src/lib/supabase repeat it on every client, so a
 * runtime that skips this hook is still covered.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { assertSupabaseInstall, supabaseMarkerProblem } = await import('@/lib/supabase/env');
  assertSupabaseInstall();
  const marker = await supabaseMarkerProblem();
  if (marker) throw new Error(`[install-guard] ${marker}`);
}
