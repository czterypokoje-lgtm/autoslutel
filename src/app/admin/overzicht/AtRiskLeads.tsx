import Link from 'next/link';
import { Badge, Empty } from '../_ui';
import styles from './dashboard.module.css';

/**
 * Leads going cold, worst first.
 *
 * "At risk" here means open and waiting — not contacted at all, or contacted
 * and then left. A lead in this business goes off within days: somebody
 * locked out of their car rings three numbers, and the second one gets the
 * work. So the bar fills towards a deadline measured in days, not weeks.
 *
 * Ranked by how long it has been sitting rather than by value, because the
 * cheapest lead that is about to be lost is still more urgent than the
 * priciest one that came in an hour ago.
 */

/** Past this many days an open lead is realistically gone. */
const COLD_DAYS = 7;

export interface RiskLead {
  id: string;
  name: string | null;
  brand: string | null;
  model: string | null;
  postcode: string | null;
  status: string | null;
  created_at: string;
  first_contact_at: string | null;
  quoted_price: number | null;
  sale_price: number | null;
}

const STAGE: Record<string, { label: string; tone?: 'ok' | 'warn' | 'stop' }> = {
  new: { label: 'Niet gebeld', tone: 'stop' },
  contacted: { label: 'Gebeld', tone: 'warn' },
  qualified: { label: 'Gekwalificeerd', tone: 'warn' },
};

const MONEY = new Intl.NumberFormat('nl-NL', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const daysSince = (iso: string): number =>
  Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 86_400_000));

/** Picks the open leads most likely to be lost, worst first. */
export function pickAtRisk(leads: RiskLead[], limit = 5): RiskLead[] {
  return leads
    .filter((lead) => lead.status === 'new' || lead.status === 'contacted' || lead.status === 'qualified')
    .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at))
    .slice(0, limit);
}

export default function AtRiskLeads({ leads }: { leads: RiskLead[] }) {
  if (!leads.length) {
    return <Empty>Geen leads die liggen te wachten.</Empty>;
  }

  return (
    <>
      <div className={styles.riskHead}>
        <span>Lead</span>
        <span>Auto</span>
        <span>Status</span>
        <span>Wacht al</span>
        <span>Waarde</span>
      </div>

      {leads.map((lead) => {
        const idle = daysSince(lead.created_at);
        const left = COLD_DAYS - idle;
        const share = Math.min(idle / COLD_DAYS, 1);
        const stage = STAGE[lead.status ?? ''] ?? { label: lead.status ?? '—' };
        const value = lead.quoted_price ?? lead.sale_price;

        return (
          <div key={lead.id} className={styles.riskRow}>
            <div>
              <Link href={`/admin/leads`} className={styles.riskName}>
                {lead.name?.trim() || 'Naam onbekend'}
              </Link>
              <div className={styles.riskSub}>
                {lead.first_contact_at ? 'Contact gehad' : 'Nog nooit contact gehad'}
                {lead.postcode ? ` · ${lead.postcode}` : ''}
              </div>
            </div>

            <div className={styles.riskSub}>
              {[lead.brand, lead.model].filter(Boolean).join(' ') || '—'}
            </div>

            <div>
              <Badge tone={stage.tone}>{stage.label}</Badge>
            </div>

            <div>
              <div className={styles.riskIdle}>
                <span>{idle}d</span>
                {/* Past the deadline there is no time left to report, only the fact. */}
                <span>{left > 0 ? `${left}d over` : 'te laat'}</span>
              </div>
              <div className={styles.riskTrack}>
                <div
                  className={styles.riskFill}
                  style={{
                    width: `${Math.max(share * 100, 4)}%`,
                    background:
                      share >= 1
                        ? 'var(--crm-stop)'
                        : share > 0.5
                          ? 'var(--crm-warn)'
                          : 'var(--crm-ok)',
                  }}
                />
              </div>
            </div>

            {/* An em dash where no price was ever quoted — not € 0. */}
            <div className={styles.riskValue}>{value ? MONEY.format(Number(value)) : '—'}</div>
          </div>
        );
      })}
    </>
  );
}
