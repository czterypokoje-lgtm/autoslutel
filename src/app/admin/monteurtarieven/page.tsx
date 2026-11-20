import { requireOfficeUser } from '@/lib/crmSession';
import { BRAND, STUDIO_UI } from '@/config/install';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PageHead, StatGrid, Stat, Card, CardHead, Table, Badge, Empty, Notice } from '../_ui';
import { Euro, Users, TriangleAlert, Car } from 'lucide-react';
import { readTechnicianRates, yearLabel } from '@/lib/technicianRates';
import { SCENARIO_INFO } from '@/lib/scenarios';
import RateFilters from './RateFilters';
import StudioRateFilters from './StudioRateFilters';
import { PreviewText } from '../PreviewLanguage';
import { Card as SCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge as SBadge } from '@/components/ui/badge';
import { Table as STable, TableBody as STableBody, TableCell as STableCell, TableHead as STableHead, TableHeader as STableHeader, TableRow as STableRow } from '@/components/ui/table';

export const dynamic = 'force-dynamic';

export const metadata = { title: `Monteurtarieven | ${BRAND.name}` };

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
    if (STUDIO_UI) {
      return (
        <div className="kfc-neutral flex flex-col gap-4 md:gap-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl leading-none font-medium tracking-tight"><PreviewText>Monteurtarieven</PreviewText></h1>
            <p className="text-muted-foreground text-sm"><PreviewText>Wat elke monteur voor welk werk vraagt.</PreviewText></p>
          </div>
          <p className="text-destructive text-sm"><PreviewText>{`Tarieven laden mislukte: ${error}`}</PreviewText></p>
        </div>
      );
    }
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

  if (STUDIO_UI) {
    return (
      <div className="kfc-neutral flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl leading-none font-medium tracking-tight"><PreviewText>Monteurtarieven</PreviewText></h1>
          <p className="text-muted-foreground text-sm">
            <PreviewText>Wat elke monteur voor welk werk vraagt. Dit is wat het ons kost, niet wat de klant betaalt.</PreviewText>
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SCard>
            <CardContent className="flex flex-col gap-1 pt-6">
              <span className="text-muted-foreground flex items-center gap-1.5 text-sm"><Car className="size-4" /><PreviewText>Regels</PreviewText></span>
              <span className="text-2xl font-semibold">{rows.length}</span>
            </CardContent>
          </SCard>
          <SCard>
            <CardContent className="flex flex-col gap-1 pt-6">
              <span className="text-muted-foreground flex items-center gap-1.5 text-sm"><Users className="size-4" /><PreviewText>Monteurs</PreviewText></span>
              <span className="text-2xl font-semibold">{new Set(rows.map((r) => r.technicianId)).size}</span>
            </CardContent>
          </SCard>
          <SCard>
            <CardContent className="flex flex-col gap-1 pt-6">
              <span className="text-muted-foreground flex items-center gap-1.5 text-sm"><Euro className="size-4" /><PreviewText>Gemiddeld tarief</PreviewText></span>
              <span className="text-2xl font-semibold">{priced.length ? MONEY.format(average) : '—'}</span>
              <span className="text-muted-foreground text-xs"><PreviewText>{`${priced.length} regels met prijs`}</PreviewText></span>
            </CardContent>
          </SCard>
          <SCard className={withoutPrice ? 'border-amber-300 dark:border-amber-500/40' : undefined}>
            <CardContent className="flex flex-col gap-1 pt-6">
              <span className="text-muted-foreground flex items-center gap-1.5 text-sm"><TriangleAlert className="size-4" /><PreviewText>Zonder prijs</PreviewText></span>
              <span className="text-2xl font-semibold">{withoutPrice}</span>
              <span className="text-muted-foreground text-xs">
                <PreviewText>{withoutPrice ? 'monteur wordt om een bedrag gevraagd' : 'alles geprijsd'}</PreviewText>
              </span>
            </CardContent>
          </SCard>
        </div>

        <StudioRateFilters
          technicians={technicians}
          scenarios={Object.entries(SCENARIO_INFO).map(([id, info]) => ({ id, label: info.label }))}
          q={params.q ?? ''}
          monteur={params.monteur ?? ''}
          dienst={params.dienst ?? ''}
        />

        {contested.length > 0 && !params.monteur && (
          <p className="bg-muted/50 rounded-lg border px-4 py-3 text-sm">
            <PreviewText>
              {`${contested.length} keer dekt meer dan één monteur hetzelfde werk aan dezelfde auto. Die staan hieronder onder elkaar, goedkoopste eerst.`}
            </PreviewText>
          </p>
        )}

        <SCard>
          <CardHeader>
            <CardTitle>
              <PreviewText>{`${rows.length} regel${rows.length === 1 ? '' : 's'}${params.q ? ` voor “${params.q}”` : ''}`}</PreviewText>
            </CardTitle>
          </CardHeader>
          <CardContent className={rows.length ? 'overflow-x-auto' : undefined}>
            {!rows.length ? (
              <p className="text-muted-foreground text-sm"><PreviewText>Niets gevonden. Monteurs zetten hun tarieven zelf bij Mijn vak.</PreviewText></p>
            ) : (
              <STable>
                <STableHeader>
                  <STableRow>
                    <STableHead><PreviewText>Auto</PreviewText></STableHead>
                    <STableHead><PreviewText>Jaren</PreviewText></STableHead>
                    <STableHead><PreviewText>Werk</PreviewText></STableHead>
                    <STableHead><PreviewText>Sleutel</PreviewText></STableHead>
                    <STableHead><PreviewText>Monteur</PreviewText></STableHead>
                    <STableHead className="text-right"><PreviewText>Tarief</PreviewText></STableHead>
                  </STableRow>
                </STableHeader>
                <STableBody>
                  {rows.map((row, index) => {
                    const first = index === 0 || keyOf(rows[index - 1]!) !== keyOf(row);
                    return (
                      <STableRow key={row.id} className={first ? 'border-t-2' : undefined}>
                        <STableCell>{first ? `${row.make} ${row.model ?? ''}`.trim() : ''}</STableCell>
                        <STableCell>{first ? yearLabel(row.fromYear, row.toYear) : ''}</STableCell>
                        <STableCell>{first ? row.scenarioLabel : ''}</STableCell>
                        <STableCell>
                          {row.keyless === null ? <PreviewText>beide</PreviewText> : row.keyless ? 'keyless' : <PreviewText>met baard</PreviewText>}
                        </STableCell>
                        <STableCell>{row.technician}</STableCell>
                        <STableCell className="text-right font-semibold tabular-nums">
                          {row.excluded ? (
                            <SBadge variant="destructive"><PreviewText>doet hij niet</PreviewText></SBadge>
                          ) : row.price === null ? (
                            <SBadge className="border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-300" variant="outline">
                              <PreviewText>geen prijs</PreviewText>
                            </SBadge>
                          ) : (
                            MONEY.format(row.price)
                          )}
                        </STableCell>
                      </STableRow>
                    );
                  })}
                </STableBody>
              </STable>
            )}
          </CardContent>
        </SCard>

        <p className="text-muted-foreground text-sm">
          <PreviewText>
            Een monteur onderhoudt deze regels zelf bij Mijn vak. Staat een auto er niet bij, dan krijgt hij bij een aanbod
            geen bedrag te zien en stuurt hij er zelf een — dat is geen fout, alleen werk dat hij nog niet heeft geprijsd.
          </PreviewText>
        </p>
      </div>
    );
  }

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
