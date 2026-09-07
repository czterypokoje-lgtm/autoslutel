import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import styles from '../admin.module.css';
import brands from '@/lib/brands.json';
import { TIER_TERMS, breakEven, monthlyCost, type Tier } from '@/lib/subscription';
import CoveragePanel, { type CoverageEntry, type ToolEntry } from './CoveragePanel';

export const dynamic = 'force-dynamic';

/**
 * "Mijn vak" — what this technician can do, and what it costs them.
 *
 * Two things live here that used to live in one person's head at the office:
 * which cars this technician can handle, and which tools they own. Writing it
 * down is what lets a job be routed at 03:00 by something that is not a person,
 * and it is the technician who has to own it — nobody at the office knows
 * whether the Autel in their van has the current licence.
 */
export default async function MijnVakPage() {
  const user = await requireCrmUser('/admin/mijn-vak');
  const supabase = await createSupabaseServerClient();

  const { data: me } = await supabase
    .from('technicians')
    .select('id, name')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!me) {
    return (
      <>
        <div className={styles.pageHead}>
          <div>
            <h1 className={styles.pageTitle}>Mijn vak</h1>
            <p className={styles.pageSub}>Wat u kunt, en waarmee.</p>
          </div>
        </div>
        <p className={`${styles.note} ${styles.noteBad}`}>
          Uw login is nog niet aan een monteur gekoppeld. Vraag het kantoor dit te doen.
        </p>
      </>
    );
  }

  const [{ data: coverage }, { data: tools }, { data: sub }, { data: done }] = await Promise.all([
    supabase
      .from('technician_coverage')
      .select('id, make, model, scenario, from_year, to_year, excluded')
      .eq('technician_id', me.id)
      .order('make'),
    supabase
      .from('technician_tools')
      .select('id, brand, model, note')
      .eq('technician_id', me.id)
      .order('brand'),
    supabase
      .from('technician_subscription')
      .select('tier, monthly_fee, commission_pct, priority_seconds')
      .eq('technician_id', me.id)
      .maybeSingle(),
    supabase
      .from('jobs')
      .select('final_price, quoted_price, commission_amount')
      .eq('technician_id', me.id)
      .eq('status', 'afgerond')
      .gte('scheduled_date', new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10)),
  ]);

  const tier = (sub?.tier ?? 'starter') as Tier;
  const terms = TIER_TERMS[tier];

  /* What they actually turned over on our work in the last thirty days. */
  const revenue = (done ?? []).reduce(
    (total, job) => total + Number(job.final_price ?? job.quoted_price ?? 0),
    0
  );
  const jobs = (done ?? []).length;
  const commission = revenue * ((sub?.commission_pct ?? terms.commissionPct) / 100);
  const paid = commission + Number(sub?.monthly_fee ?? terms.monthlyFee);

  const makes = (brands as { make: string }[]).map((b) => b.make);

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Mijn vak</h1>
          <p className={styles.pageSub}>
            Welke auto’s u aankunt en met welk gereedschap. Hier bepaalt u zelf welk werk u
            aangeboden krijgt — wat hier niet staat, krijgt u niet.
          </p>
        </div>
      </div>

      {/* ── what this costs, and what it replaced ── */}
      <div className={styles.listCard} style={{ marginBottom: 22 }}>
        <div className={styles.row}>
          <div className={styles.rowMain}>
            <div className={styles.rowTitleLine}>
              <span className={styles.rowTitle}>{terms.label}</span>
              <span className={styles.rowSlug}>
                € {Number(sub?.monthly_fee ?? terms.monthlyFee).toFixed(0)} p/m ·{' '}
                {Number(sub?.commission_pct ?? terms.commissionPct)}% commissie
              </span>
            </div>
            <div className={styles.rowMeta}>
              <span className={styles.chip}>{jobs} klussen · 30 dagen</span>
              <span className={styles.chip}>omzet € {revenue.toFixed(2)}</span>
              <span className={styles.chip}>u betaalde € {paid.toFixed(2)}</span>
              {tier !== 'premium' && (
                <span className={`${styles.chip} ${styles.chipWarn}`}>
                  {(() => {
                    const next: Tier = tier === 'starter' ? 'pro' : 'premium';
                    const at = breakEven(next, tier);
                    if (at == null) return null;
                    const monthly = revenue;
                    return monthly >= at
                      ? `${TIER_TERMS[next].label} is voor u nu goedkoper — € ${(
                          monthlyCost(tier, monthly) - monthlyCost(next, monthly)
                        ).toFixed(0)} per maand`
                      : `${TIER_TERMS[next].label} loont vanaf € ${at.toLocaleString('nl-NL')} omzet p/m`;
                  })()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <CoveragePanel
        technicianId={me.id}
        makes={makes}
        coverage={(coverage ?? []) as CoverageEntry[]}
        tools={(tools ?? []) as ToolEntry[]}
      />
    </>
  );
}
