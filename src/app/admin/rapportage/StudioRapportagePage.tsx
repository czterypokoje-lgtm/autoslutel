import { PreviewText } from '@/app/admin/PreviewLanguage';
import Link from 'next/link';
import { SCENARIO_INFO, isScenario, type Scenario } from '@/lib/scenarios';
import { sourceLabel } from '../overzicht/dashboardData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ReactNode } from 'react';

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

/** Never invent a number. No data means an em dash, not a zero that reads as fact. */
function show(value: unknown, format?: (n: number) => string): string {
  if (value === null || value === undefined || value === '') return '—';
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return format ? format(n) : String(n);
}

function percent(part: number, whole: number): string {
  if (!whole) return '—';
  return `${Math.round((part / whole) * 100)}%`;
}

function Section({ id, n, title, note, children }: { id: string; n: number; title: string; note: ReactNode; children: ReactNode }) {
  return (
    <Card id={id} className="scroll-mt-6">
      <CardHeader>
        <CardTitle>{`${n} · ${title}`}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="overflow-x-auto">{children}</div>
        <p className="text-muted-foreground text-sm">{note}</p>
      </CardContent>
    </Card>
  );
}

type SourceTotal = { leads: number; verkocht: number; klussen: number; omzet: number };

export default function StudioRapportagePage({
  sources,
  latestWeek,
  service,
  technician,
  region,
  make,
  makeRegion,
  commission,
  capabilityGap,
  allLeads,
  allSold,
  missed,
}: {
  sources: [string, SourceTotal][];
  latestWeek: Record<string, unknown> | undefined;
  service: Record<string, unknown>[];
  technician: Record<string, unknown>[];
  region: Record<string, unknown>[];
  make: Record<string, unknown>[];
  makeRegion: Record<string, unknown>[];
  commission: Record<string, unknown>[];
  capabilityGap: Record<string, unknown>[];
  allLeads: number;
  allSold: number;
  missed: number;
}) {
  const REPORTS = [
    { id: 'bron', n: 1, title: 'Lead → klus per bron', value: `${percent(allSold, allLeads)} verkocht · beste: ${sources[0] ? sourceLabel(sources[0][0]) : '—'}` },
    { id: 'dienst', n: 2, title: 'Kluswaarde per dienst', value: `${service.length} diensten` },
    { id: 'reactie', n: 3, title: 'Reactietijd', value: latestWeek ? `mediaan ${show(latestWeek.mediaan_minuten, (n) => `${n} min`)}` : 'nog niet gemeten' },
    { id: 'monteur', n: 4, title: 'Klussen per monteur', value: `${technician.length} monteurs` },
    { id: 'regio', n: 5, title: 'Vraag per regio', value: region[0] ? `meeste: ${region[0].postcode4}` : '—' },
    { id: 'merk', n: 6, title: 'Omzet per automerk', value: make[0] ? `beste: ${make[0].merk}` : '—' },
    { id: 'merkregio', n: 7, title: 'Merk × regio', value: 'top 20 op omzet' },
    { id: 'commissie', n: 8, title: 'Commissie per monteur', value: 'afgesproken vs. echt' },
    { id: 'capaciteit', n: 9, title: 'Leads buiten capaciteit', value: missed ? `${missed} gemist` : 'niets gemist' },
  ];

  return (
    <div className="kfc-neutral flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl leading-none font-medium tracking-tight"><PreviewText>Rapportage</PreviewText></h1>
        <p className="text-muted-foreground text-sm">
          <PreviewText>Negen rapporten die een beslissing veranderen. Tik een tegel om ernaartoe te springen.</PreviewText>
        </p>
      </div>

      <nav className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Rapporten">
        {REPORTS.map((t) => (
          <Link key={t.id} href={`#${t.id}`} className="hover:bg-muted/50 flex items-start gap-3 rounded-lg border p-3 transition-colors">
            <span className="bg-muted text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium">{t.n}</span>
            <span className="flex flex-col">
              <b className="text-sm font-medium">{t.title}</b>
              <small className="text-muted-foreground text-xs">{t.value}</small>
            </span>
          </Link>
        ))}
      </nav>

      <Section
        id="bron"
        n={1}
        title="Lead → klus, per bron"
        note={
          <PreviewText>
            {
              'Welk kanaal echt werk oplevert, niet alleen kliks. Telefonische leads ontbreken hier: er is nog geen belregistratie, dus elk getal in deze tabel is een ondergrens.'
            }
          </PreviewText>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><PreviewText>Bron</PreviewText></TableHead>
              <TableHead>Leads</TableHead>
              <TableHead><PreviewText>Klussen</PreviewText></TableHead>
              <TableHead><PreviewText>Verkocht</PreviewText></TableHead>
              <TableHead><PreviewText>Conversie</PreviewText></TableHead>
              <TableHead className="text-right"><PreviewText>Omzet</PreviewText></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sources.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-muted-foreground"><PreviewText>Nog geen data.</PreviewText></TableCell></TableRow>
            ) : (
              sources.map(([name, s]) => (
                <TableRow key={name}>
                  <TableCell className="font-medium">{sourceLabel(name)}</TableCell>
                  <TableCell>{s.leads}</TableCell>
                  <TableCell>{s.klussen}</TableCell>
                  <TableCell>{s.verkocht}</TableCell>
                  <TableCell>{percent(s.verkocht, s.leads)}</TableCell>
                  <TableCell className="text-right font-medium">{MONEY.format(s.omzet)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Section>

      <Section id="dienst" n={2} title="Gemiddelde kluswaarde, per dienst" note={<PreviewText>Stuurt prijsstelling en advertentiebudget.</PreviewText>}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dienst</TableHead>
              <TableHead>Afgeronde klussen</TableHead>
              <TableHead className="text-right">Gemiddeld</TableHead>
              <TableHead className="text-right"><PreviewText>Totaal</PreviewText></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {service.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-muted-foreground"><PreviewText>Nog geen afgeronde klussen.</PreviewText></TableCell></TableRow>
            ) : (
              service.map((row) => (
                <TableRow key={row.dienst as string}>
                  <TableCell className="font-medium">{row.dienst as string}</TableCell>
                  <TableCell>{show(row.klussen)}</TableCell>
                  <TableCell className="text-right">{show(row.gemiddelde_waarde, (n) => MONEY.format(n))}</TableCell>
                  <TableCell className="text-right">{show(row.totaal, (n) => MONEY.format(n))}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Section>

      <Section
        id="reactie"
        n={3}
        title="Reactietijd — lead tot eerste contact"
        note={<PreviewText>In spoedwerk de sterkste verliesreden. Wie na een uur terugbelt, belt een klant die al iemand anders heeft gebeld.</PreviewText>}
      >
        {latestWeek ? (
          <div className="grid grid-cols-3 gap-4 sm:w-fit sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-sm"><PreviewText>Mediaan deze week</PreviewText></span>
              <span className="text-xl font-semibold">{show(latestWeek.mediaan_minuten, (n) => `${n} min`)}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-sm"><PreviewText>Gemiddeld</PreviewText></span>
              <span className="text-xl font-semibold">{show(latestWeek.gemiddelde_minuten, (n) => `${n} min`)}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-sm"><PreviewText>{'Te laat (> 60 min)'}</PreviewText></span>
              <span className="text-xl font-semibold">
                {show(latestWeek.te_laat)} <PreviewText>van</PreviewText> {show(latestWeek.leads_met_contact)}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            <PreviewText>
              {'Nog geen meetbare reactietijd. Dit getal ontstaat vanzelf zodra leads in het CRM van nieuw af worden gehaald — pas dan wordt het moment van eerste contact vastgelegd.'}
            </PreviewText>
          </p>
        )}
      </Section>

      <Section id="monteur" n={4} title="Klussen per monteur per dag" note={<PreviewText>Capaciteit, en de vraag of er iemand bij moet.</PreviewText>}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><PreviewText>Monteur</PreviewText></TableHead>
              <TableHead><PreviewText>Klussen</PreviewText></TableHead>
              <TableHead>Werkdagen</TableHead>
              <TableHead>Per dag</TableHead>
              <TableHead className="text-right"><PreviewText>Omzet</PreviewText></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {technician.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-muted-foreground"><PreviewText>Nog geen monteurs.</PreviewText></TableCell></TableRow>
            ) : (
              technician.map((row) => (
                <TableRow key={row.technician_id as string}>
                  <TableCell className="font-medium">{row.name as string}</TableCell>
                  <TableCell>{show(row.klussen)}</TableCell>
                  <TableCell>{show(row.werkdagen)}</TableCell>
                  <TableCell>{show(row.per_dag)}</TableCell>
                  <TableCell className="text-right">{show(row.omzet, (n) => MONEY.format(n))}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Section>

      <Section
        id="regio"
        n={5}
        title="Vraag per regio"
        note={
          <PreviewText>
            {'Dit sluit terug op de website: komen er veel leads uit één regio, dan verdient die stadspagina de volgende uren contentwerk. Het CRM levert hier het bewijs voor de SEO-planning.'}
          </PreviewText>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><PreviewText>Postcode</PreviewText></TableHead>
              <TableHead>Leads</TableHead>
              <TableHead><PreviewText>Verkocht</PreviewText></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {region.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="text-muted-foreground"><PreviewText>Nog geen data.</PreviewText></TableCell></TableRow>
            ) : (
              region.map((row) => (
                <TableRow key={row.postcode4 as string}>
                  <TableCell className="font-medium">{row.postcode4 as string}</TableCell>
                  <TableCell>{show(row.leads)}</TableCell>
                  <TableCell>{show(row.verkocht)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Section>

      <Section
        id="merk"
        n={6}
        title="Omzet en annuleringen per automerk"
        note={
          <PreviewText>
            {'Een merk met veel omzet maar ook een hoog annuleerpercentage kost meer tijd dan het lijkt op te leveren — dit is waar dat zichtbaar wordt.'}
          </PreviewText>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Merk</TableHead>
              <TableHead><PreviewText>Klussen</PreviewText></TableHead>
              <TableHead><PreviewText>Geannuleerd</PreviewText></TableHead>
              <TableHead>Annuleer %</TableHead>
              <TableHead className="text-right">Gemiddeld</TableHead>
              <TableHead className="text-right"><PreviewText>Omzet</PreviewText></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {make.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-muted-foreground"><PreviewText>Nog geen afgeronde klussen.</PreviewText></TableCell></TableRow>
            ) : (
              make.map((row) => (
                <TableRow key={row.merk as string}>
                  <TableCell className="font-medium">{row.merk as string}</TableCell>
                  <TableCell>{show(row.klussen)}</TableCell>
                  <TableCell>{show(row.geannuleerd)}</TableCell>
                  <TableCell>{show(row.annuleer_pct, (n) => `${n}%`)}</TableCell>
                  <TableCell className="text-right">{show(row.gemiddelde_prijs, (n) => MONEY.format(n))}</TableCell>
                  <TableCell className="text-right">{show(row.omzet, (n) => MONEY.format(n))}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Section>

      <Section
        id="merkregio"
        n={7}
        title="Welk merk verkoopt waar (top 20 op omzet)"
        note={<PreviewText>Waar focussen: een merk dat elders verlies draait kan hier alsnog de moeite waard zijn in één specifieke regio, en omgekeerd.</PreviewText>}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Merk</TableHead>
              <TableHead><PreviewText>Postcode</PreviewText></TableHead>
              <TableHead><PreviewText>Klussen</PreviewText></TableHead>
              <TableHead><PreviewText>Geannuleerd</PreviewText></TableHead>
              <TableHead className="text-right"><PreviewText>Omzet</PreviewText></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {makeRegion.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-muted-foreground"><PreviewText>Nog geen data.</PreviewText></TableCell></TableRow>
            ) : (
              makeRegion.map((row) => (
                <TableRow key={`${row.merk}-${row.postcode4}`}>
                  <TableCell className="font-medium">{row.merk as string}</TableCell>
                  <TableCell>{row.postcode4 as string}</TableCell>
                  <TableCell>{show(row.klussen)}</TableCell>
                  <TableCell>{show(row.geannuleerd)}</TableCell>
                  <TableCell className="text-right">{show(row.omzet, (n) => MONEY.format(n))}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Section>

      <Section
        id="commissie"
        n={8}
        title="Commissie per monteur — afgesproken vs. echt"
        note={
          <PreviewText>
            {'"Effectief %" is commissie gedeeld door omzet — wat er echt binnenkomt. Wijkt dit structureel af van het ingestelde percentage, dan klopt er iets niet in de afspraak of in hoe een monteur betaalt.'}
          </PreviewText>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><PreviewText>Monteur</PreviewText></TableHead>
              <TableHead><PreviewText>Klussen</PreviewText></TableHead>
              <TableHead className="text-right"><PreviewText>Omzet</PreviewText></TableHead>
              <TableHead className="text-right">Commissie</TableHead>
              <TableHead>Effectief %</TableHead>
              <TableHead>Ingesteld %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {commission.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-muted-foreground"><PreviewText>Nog geen monteurs.</PreviewText></TableCell></TableRow>
            ) : (
              commission.map((row) => (
                <TableRow key={row.technician_id as string}>
                  <TableCell className="font-medium">{row.name as string}</TableCell>
                  <TableCell>{show(row.klussen)}</TableCell>
                  <TableCell className="text-right">{show(row.omzet, (n) => MONEY.format(n))}</TableCell>
                  <TableCell className="text-right">{show(row.commissie, (n) => MONEY.format(n))}</TableCell>
                  <TableCell>{show(row.effectief_commissie_pct, (n) => `${n}%`)}</TableCell>
                  <TableCell>{show(row.gemiddeld_ingesteld_pct, (n) => `${n}%`)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Section>

      <Section
        id="capaciteit"
        n={9}
        title="Leads buiten capaciteit"
        note={
          <PreviewText>
            {
              'Niet geraden: afgeleid uit de echte dekking in technician_coverage. Een lead staat hier alleen als geen enkele actieve monteur dat merk + jaar + scenario momenteel dekt — bijvoorbeeld "Mercedes-Benz na 2014" als dat expliciet is uitgesloten. Dit is waar een nieuwe tool of monteur zich het snelst terugbetaalt.'
            }
          </PreviewText>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Merk</TableHead>
              <TableHead>Jaar</TableHead>
              <TableHead>Scenario</TableHead>
              <TableHead>Gemiste leads</TableHead>
              <TableHead>Laatste</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {capabilityGap.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  <PreviewText>Geen gemiste leads door ontbrekende capaciteit — of nog geen dekking ingesteld om tegen te toetsen.</PreviewText>
                </TableCell>
              </TableRow>
            ) : (
              capabilityGap.map((row, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{row.brand as string}</TableCell>
                  <TableCell>{show(row.year)}</TableCell>
                  <TableCell>{isScenario(row.scenario as string) ? SCENARIO_INFO[row.scenario as Scenario].label : (row.scenario as string)}</TableCell>
                  <TableCell>{show(row.gemiste_leads)}</TableCell>
                  <TableCell>{row.laatste ? new Date(row.laatste as string).toLocaleDateString('nl-NL') : '—'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Section>
    </div>
  );
}
