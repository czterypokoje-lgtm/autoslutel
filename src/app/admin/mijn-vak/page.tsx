import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PageHead, Notice, HelpSteps, Label } from '../_ui';
import vak from './vak.module.css';
import { TIER_TERMS, breakEven, monthlyCost, type Tier } from '@/lib/subscription';
import { catalogTree } from '@/lib/carCatalog';
import CoveragePanel, { type CoverageEntry, type ToolEntry } from './CoveragePanel';
import PriceTree, { type PriceEntry } from './PriceTree';

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
        <PageHead title="Mijn vak" sub="Wat je kunt, en waarmee." />
        <Notice tone="bad">Je login is nog niet aan een monteur gekoppeld. Vraag het kantoor dit te doen.</Notice>
      </>
    );
  }

  const [{ data: coverage }, { data: tools }, { data: sub }, { data: done }] = await Promise.all([
    supabase
      .from('technician_coverage')
      .select('id, make, model, scenario, from_year, to_year, excluded, keyless, price')
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

  const catalog = catalogTree();
  const coverageRows = (coverage ?? []) as CoverageEntry[];

  const fee = Number(sub?.monthly_fee ?? terms.monthlyFee);
  const EUR = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  const upgrade = (() => {
    if (tier === 'premium') return null;
    const next: Tier = tier === 'starter' ? 'pro' : 'premium';
    const at = breakEven(next, tier);
    if (at == null) return null;
    return revenue >= at
      ? { good: true, text: `${TIER_TERMS[next].label} is nu goedkoper voor jou: ${EUR.format(monthlyCost(tier, revenue) - monthlyCost(next, revenue))} per maand minder.` }
      : { good: false, text: `${TIER_TERMS[next].label} loont vanaf ${EUR.format(at)} omzet per maand.` };
  })();

  return (
    <>
      <PageHead
        title="Mijn vak"
        sub="Welke auto's je aankunt, wat je rekent en met welk gereedschap. Wat hier niet staat, krijg je niet aangeboden."
      />
      <HelpSteps
        steps={[
          'Klik bij Mijn prijzen een merk open.',
          'Zet een prijs bij de auto\'s die je doet. Model leeg = het hele merk.',
          'Zet je gereedschap erbij, dan krijg je klussen die daarbij passen.',
        ]}
      />

      <section className={vak.plan} aria-label="Abonnement">
        <div className={vak.planMain}>
          <span className={vak.planLabel}>Abonnement</span>
          <span className={vak.planName}>
            {terms.label} <span className={vak.planFee}>{EUR.format(fee)} per maand</span>
          </span>
        </div>
        <div className={vak.planStats}>
          <div><span>Klussen (30 dagen)</span><b>{jobs}</b></div>
          <div><span>Omzet (30 dagen)</span><b>{EUR.format(revenue)}</b></div>
          <div><span>Je betaalde</span><b>{EUR.format(paid)}</b></div>
        </div>
        {upgrade && <p className={upgrade.good ? vak.planTipGood : vak.planTip}>{upgrade.text}</p>}
      </section>

      <Label>Mijn prijzen</Label>
      <p className={vak.intro}>
        Een prijs is ook je opgave dat je het werk doet: alleen auto&rsquo;s die hier staan worden je aangeboden.
      </p>
      <PriceTree technicianId={me.id} catalog={catalog} rows={coverageRows as PriceEntry[]} />

      <div className={vak.gap} />
      <Label>Gereedschap en uitzonderingen</Label>
      <CoveragePanel technicianId={me.id} tools={(tools ?? []) as ToolEntry[]} />
    </>
  );
}
