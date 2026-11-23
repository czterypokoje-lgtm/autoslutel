import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { BRAND } from '@/config/install';
import { PageHead, Notice } from '../_ui';
import ProposedList from './ProposedList';
import OpenList from './OpenList';
import type { OpenQuote, ProposedQuote } from './types';

export const dynamic = 'force-dynamic';

export const metadata = { title: `Offertes | ${BRAND.name}` };

/**
 * Prijsvoorstellen uit WhatsApp, telefoon en de agent (docs/lead-quotes.md).
 * `proposed` wacht op een mens; rapportage leest alleen `confirmed` rijen.
 */
export default async function OffertesPage() {
  await requireOfficeUser('/admin/offertes');
  const db = await createSupabaseServerClient();

  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();

  let proposed: ProposedQuote[] = [];
  let open: OpenQuote[] = [];
  let last30: { outcome: string; lost_reason: string | null }[] = [];
  let dbError: string | null = null;

  /* A database that has not seen 0107 yet answers "relation does not exist"
     or "permission denied". Say which migration is missing, like /admin/taken. */
  try {
    const [proposedRes, openRes, summaryRes] = await Promise.all([
      db
        .from('lead_quotes')
        .select('id, make, model, year, scenario, quoted_price, quoted_at, channel, evidence_quote, link_state')
        .eq('status', 'proposed')
        .order('quoted_at', { ascending: false })
        .limit(100),
      db
        .from('lead_quotes')
        .select('id, make, model, year, scenario, quoted_price, quoted_at, channel')
        .eq('status', 'confirmed')
        .eq('outcome', 'open')
        .order('quoted_at', { ascending: true }),
      db.from('lead_quotes').select('outcome, lost_reason').eq('status', 'confirmed').gte('quoted_at', since),
    ]);
    if (proposedRes.error) throw new Error(proposedRes.error.message);
    if (openRes.error) throw new Error(openRes.error.message);
    if (summaryRes.error) throw new Error(summaryRes.error.message);
    proposed = (proposedRes.data ?? []) as ProposedQuote[];
    open = (openRes.data ?? []) as OpenQuote[];
    last30 = summaryRes.data ?? [];
  } catch (err) {
    dbError = err instanceof Error ? err.message : 'Offertes konden niet worden geladen';
  }

  const total30 = last30.length;
  const won30 = last30.filter((r) => r.outcome === 'won').length;
  const lostOnPrice30 = last30.filter((r) => r.outcome === 'lost' && r.lost_reason === 'te_duur').length;
  const wonPct30 = total30 ? Math.round((won30 / total30) * 100) : 0;

  return (
    <>
      <PageHead title="Offertes" sub="Prijsvoorstellen uit WhatsApp, telefoon en de agent." />

      {dbError ? (
        <Notice tone="bad">
          Offertes konden niet worden geladen: {dbError}. Controleer of migratie 0107 (lead_quotes) is toegepast.
        </Notice>
      ) : (
        <>
          <Notice tone="info">
            Laatste 30 dagen: {total30} offertes, {won30} gewonnen ({wonPct30}%), verloren op prijs: {lostOnPrice30}.
          </Notice>
          <ProposedList rows={proposed} />
          <OpenList rows={open} />
        </>
      )}
    </>
  );
}
