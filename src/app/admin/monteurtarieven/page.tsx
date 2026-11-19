import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PageHead, StatGrid, Stat, Card, CardHead, Table, Badge, Empty, Notice } from '../_ui';
import { Euro, Users, TriangleAlert, Car } from 'lucide-react';
import { readTechnicianRates, yearLabel } from '@/lib/technicianRates';
import { SCENARIO_INFO } from '@/lib/scenarios';
import RateFilters from './RateFilters';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Monteurtarieven | Autosleutel24' };

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

/**
 * What every monteur charges, side by side.
 *
 * Not Tarieven: that is dispatch_pricing, what the business charges a
 * customer. This is the other direction — what the work costs us — and the
 * two should never share a screen, because the moment they do somebody reads
 * one number as the other.
 *
 * Rows are grouped by car and sorted cheapest-first inside each group, since
 * the question being asked here is almost always "who does this, and for how
 * much", and a list ordered by person hides exactly that.
 */
export default async function MonteurtarievenPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; monteur?: string; dienst?: string }>;
}) {
  await requireOfficeUser('/admin/monteurtarieven');
  const supabase = await createSupabaseServerClient();
  const params = await searchParams;

  const { rows, technicians, error } = await readTechnicianRates(supabase, {
    q: params.q,
    technicianId: params.monteur,
    scenario: params.dienst,
  });

  if (error) {
    return (
      <>
        <PageHead title="Monteurtarieven" sub="Wat elke monteur voor welk werk vraagt." />
        <Notice tone="bad">Tarieven laden mislukte: {error}</Notice>
      </>
    );
  }

  const priced = rows.filter((row) => row.price !== null && !row.excluded);
  const average = priced.length
    ? priced.reduce((total, row) => total + (row.price ?? 0), 0) / priced.length
    : 0;
  const withoutPrice = rows.filter((row) => row.price === null && !row.excluded).length;

  /*
   * The year band is part of the identity, not decoration. Without it a
   * technician's own "Swift 2005-2010 EUR 250" and "Swift 2011-2017 EUR 300"
   * read as a disagreement with himself — which is what the first version of
   * this screen showed, 53 times.
   */
  const keyOf = (row: (typeof rows)[number]) =>
    `${row.make}|${row.model ?? ''}|${row.scenario}|${row.fromYear ?? ''}-${row.toYear ?? ''}`;

  const groups = new Map<string, typeof rows>();
  for (const row of rows) groups.set(keyOf(row), [...(groups.get(keyOf(row)) ?? []), row]);

  /* Contested means different people, not different rows. */
  const contested = [...groups.values()].filter(
    (group) =>
      new Set(group.filter((row) => row.price !== null && !row.excluded).map((row) => row.technicianId))
        .size > 1
  );

  return (
    <>
      <PageHead
        title="Monteurtarieven"
        sub="Wat elke monteur voor welk werk vraagt. Dit is wat het ons kost, niet wat de klant betaalt."
      />

      <StatGrid>
        <Stat label="Regels" value={rows.length} icon={<Car size={18} />} />
        <Stat label="Monteurs" value={new Set(rows.map((r) => r.technicianId)).size} icon={<Users size={18} />} />
        <Stat
          label="Gemiddeld tarief"
          value={priced.length ? MONEY.format(average) : '—'}
          foot={`${priced.length} regels met prijs`}
          icon={<Euro size={18} />}
        />
        <Stat
          label="Zonder prijs"
          value={withoutPrice}
          foot={withoutPrice ? 'monteur wordt om een bedrag gevraagd' : 'alles geprijsd'}
          icon={<TriangleAlert size={18} />}
          tone={withoutPrice ? 'warn' : 'ok'}
        />
      </StatGrid>

      <RateFilters
        technicians={technicians}
        scenarios={Object.entries(SCENARIO_INFO).map(([id, info]) => ({ id, label: info.label }))}
        q={params.q ?? ''}
        monteur={params.monteur ?? ''}
        dienst={params.dienst ?? ''}
      />

      {contested.length > 0 && !params.monteur && (
        <Notice>
          {contested.length} keer dekt meer dan één monteur hetzelfde werk aan dezelfde auto. Die
          staan hieronder onder elkaar, goedkoopste eerst.
        </Notice>
      )}

      <Card>
        <CardHead>
          {rows.length} regel{rows.length === 1 ? '' : 's'}
          {params.q ? ` voor “${params.q}”` : ''}
        </CardHead>

        {!rows.length ? (
          <Empty>Niets gevonden. Monteurs zetten hun tarieven zelf bij Mijn vak.</Empty>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <Table
              head={
                <tr>
                  <th>Auto</th>
                  <th>Jaren</th>
                  <th>Werk</th>
                  <th>Sleutel</th>
                  <th>Monteur</th>
                  <th style={{ textAlign: 'right' }}>Tarief</th>
                </tr>
              }
            >
              {rows.map((row, index) => {
                const first = index === 0 || keyOf(rows[index - 1]!) !== keyOf(row);
                return (
                  <tr key={row.id} style={first ? { borderTop: '2px solid var(--crm-rule2)' } : undefined}>
                    <td>{first ? `${row.make} ${row.model ?? ''}`.trim() : ''}</td>
                    <td>{first ? yearLabel(row.fromYear, row.toYear) : ''}</td>
                    <td>{first ? row.scenarioLabel : ''}</td>
                    <td>
                      {row.keyless === null ? 'beide' : row.keyless ? 'keyless' : 'met baard'}
                    </td>
                    <td>{row.technician}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                      {row.excluded ? (
                        <Badge tone="stop">doet hij niet</Badge>
                      ) : row.price === null ? (
                        <Badge tone="warn">geen prijs</Badge>
                      ) : (
                        MONEY.format(row.price)
                      )}
                    </td>
                  </tr>
                );
              })}
            </Table>
          </div>
        )}
      </Card>

      <Notice>
        Een monteur onderhoudt deze regels zelf bij <strong>Mijn vak</strong>. Staat een auto er
        niet bij, dan krijgt hij bij een aanbod geen bedrag te zien en stuurt hij er zelf een —
        dat is geen fout, alleen werk dat hij nog niet heeft geprijsd.
      </Notice>
    </>
  );
}
