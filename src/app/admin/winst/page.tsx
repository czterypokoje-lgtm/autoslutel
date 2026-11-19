import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PageHead, StatGrid, Stat, Card, CardHead, Table, Empty, Notice } from '../_ui';
import { RankedBars, Donut, LineChart, chart } from '../_ui/charts';
import { Euro, Wrench, Fuel, TrendingUp } from 'lucide-react';
import { readWinst } from '@/lib/winst';
import Filters from './Filters';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Winst & verbruik | Autosleutel24',
};

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const money = (value: number) => MONEY.format(value);

/**
 * What every klus brought in and what it cost, for the office.
 *
 * All the arithmetic lives in src/lib/winst.ts so this screen and the Excel
 * download can never disagree about a number.
 */
export default async function WinstPage({
  searchParams,
}: {
  searchParams: Promise<{ van?: string; tot?: string }>;
}) {
  await requireOfficeUser('/admin/winst');
  const supabase = await createSupabaseServerClient();
  const params = await searchParams;

  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam' }).format(new Date());
  const from = params.van || `${today.slice(0, 7)}-01`;
  const to = params.tot || today;

  const data = await readWinst(supabase, from, to);

  if ('error' in data) {
    return (
      <>
        <PageHead title="Winst & verbruik" sub="Wat elke klus opleverde en wat hij kostte." />
        <Notice tone="bad">
          Kon de klussen niet laden: {data.error}
          {/travel_km|gross_margin/.test(data.error) && (
            <> — voer <code>supabase/migrations/0057_job_travel_and_margin.sql</code> uit.</>
          )}
        </Notice>
      </>
    );
  }

  const {
    jobs, materials, revenue, parts, fuel, other, margin, workdays,
    perHour, timedCount, byCity, byMake, byScenario, byTechnician,
    byProduct, productUnits, byMonth, gaps,
  } = data;

  return (
    <>
      <PageHead
        title="Winst & verbruik"
        sub="Wat elke klus opleverde, wat er aan onderdelen en brandstof uit ging, en wat er overbleef."
      />

      <Filters from={from} to={to} />

      {!jobs.length ? (
        <Empty>Geen afgeronde klussen in deze periode.</Empty>
      ) : (
        <>
          <StatGrid>
            <Stat label="Omzet" value={money(revenue)} foot={`${jobs.length} klussen`} icon={<Euro size={18} />} />
            <Stat label="Onderdelen" value={money(parts)} foot={`${materials.length} regels`} icon={<Wrench size={18} />} />
            <Stat label="Brandstof" value={money(fuel)} foot={`${jobs.length - gaps.fuel} gemeten`} icon={<Fuel size={18} />} />
            <Stat
              label="Blijft over"
              value={money(margin)}
              foot={revenue > 0 ? `${Math.round((margin / revenue) * 100)}% van de omzet` : undefined}
              icon={<TrendingUp size={18} />}
              tone={margin > 0 ? 'ok' : 'stop'}
            />
          </StatGrid>

          <StatGrid>
            <Stat label="Per klus" value={money(revenue / jobs.length)} foot="gemiddelde omzet" />
            <Stat
              label="Per werkdag"
              value={workdays ? money(revenue / workdays) : '—'}
              foot={`${workdays} dag(en) gewerkt`}
            />
            <Stat
              label="Per uur"
              value={perHour === null ? '—' : money(perHour)}
              foot={
                perHour === null
                  ? `${timedCount} van ${jobs.length} klussen hebben tijden`
                  : `gemeten op ${timedCount} van ${jobs.length} klussen`
              }
            />
          </StatGrid>

          <div className={chart.splitRow}>
            <Card>
              <CardHead>Waar het geld heen ging</CardHead>
              <Donut
                slices={[
                  { label: 'Onderdelen', value: parts },
                  { label: 'Brandstof', value: fuel },
                  { label: 'Overig', value: other },
                  { label: 'Blijft over', value: Math.max(margin, 0) },
                ]}
                format={money}
              />
            </Card>
            <Card>
              <CardHead>Winst per maand</CardHead>
              <LineChart
                series={[{ label: 'Blijft over', points: byMonth.map((m) => m.value) }]}
                labels={byMonth.map((m) => m.label)}
                format={money}
              />
            </Card>
          </div>

          <div className={chart.splitRow}>
            <Card>
              <CardHead>Beste steden</CardHead>
              <RankedBars rows={byCity.slice(0, 10)} format={money} />
            </Card>
            <Card>
              <CardHead>Beste merken</CardHead>
              <RankedBars rows={byMake.slice(0, 10)} format={money} />
            </Card>
          </div>

          <Card>
            <CardHead>Per stad</CardHead>
            <Table head={<><th>Stad</th><th>Klussen</th><th>Blijft over</th><th>Per klus</th></>}>
              {byCity.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td>{row.count}</td>
                  <td>{money(row.value)}</td>
                  <td>{money(row.value / row.count)}</td>
                </tr>
              ))}
            </Table>
          </Card>

          <Card>
            <CardHead>Per automerk</CardHead>
            <Table head={<><th>Merk</th><th>Klussen</th><th>Blijft over</th><th>Per klus</th></>}>
              {byMake.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td>{row.count}</td>
                  <td>{money(row.value)}</td>
                  <td>{money(row.value / row.count)}</td>
                </tr>
              ))}
            </Table>
          </Card>

          <Card>
            <CardHead>Per soort werk</CardHead>
            <Table head={<><th>Soort</th><th>Klussen</th><th>Blijft over</th><th>Per klus</th></>}>
              {byScenario.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td>{row.count}</td>
                  <td>{money(row.value)}</td>
                  <td>{money(row.value / row.count)}</td>
                </tr>
              ))}
            </Table>
          </Card>

          <Card>
            <CardHead>Per monteur</CardHead>
            <Table head={<><th>Monteur</th><th>Klussen</th><th>Blijft over</th><th>Per klus</th></>}>
              {byTechnician.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td>{row.count}</td>
                  <td>{money(row.value)}</td>
                  <td>{money(row.value / row.count)}</td>
                </tr>
              ))}
            </Table>
          </Card>

          <Card>
            <CardHead>Wat er verbruikt is</CardHead>
            {!byProduct.length ? (
              <Empty>
                Geen materiaalregels in deze periode. Onderdelen worden vastgelegd op het
                busscherm, bij de klus.
              </Empty>
            ) : (
              <Table head={<><th>Onderdeel</th><th>Stuks</th><th>Klussen</th><th>Inkoopwaarde</th></>}>
                {byProduct.map((row) => (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    <td>{productUnits.get(row.label) ?? '—'}</td>
                    <td>{row.count}</td>
                    <td>{row.value > 0 ? money(row.value) : '—'}</td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>

          {/*
            * The part that makes the rest believable. Every number above is an
            * average over whatever happened to be filled in; without this, a
            * gap and a genuine zero look identical.
            */}
          <Notice tone={gaps.parts > jobs.length / 2 ? 'bad' : 'info'}>
            <strong>Betrouwbaarheid.</strong> Van {jobs.length} klussen in deze periode:{' '}
            {gaps.price} zonder prijs, {gaps.city} zonder stad, {gaps.fuel} zonder gemeten
            brandstof, {gaps.parts} zonder materiaalregels, {gaps.times} zonder bruikbare tijden.
            Wat niet is vastgelegd telt als nul en maakt die klussen winstgevender dan ze waren.
          </Notice>
        </>
      )}
    </>
  );
}
