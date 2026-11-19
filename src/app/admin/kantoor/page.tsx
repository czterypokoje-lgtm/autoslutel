import Link from 'next/link';
import { BRAND } from '@/config/install';
import { PageHead, StatGrid, Stat, Card, CardHead, Table, Badge, Notice, Empty } from '../_ui';
import { Hourglass, ShieldAlert, Radio } from 'lucide-react';
import { DESKS, deskOf, feedText, type DeskKey } from '@/lib/jobRoomLive';
import LiveRefresh from '../live/LiveRefresh';
import { fmtTime, loadLive } from '../live/loadLive';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: `Kantoor | ${BRAND.name}`,
};

const STATE_LABEL = { working: 'Bezig', waiting: 'Wacht op goedkeuring', idle: 'Rustig', error: 'Storing' } as const;
const STATE_TONE = { working: 'ok', waiting: 'warn', idle: 'info', error: 'stop' } as const;

/**
 * The office: one desk per worker, with its state, the job it is on and its
 * last action. A pleasant picture can hide a fault, so a desk goes red the
 * moment its heartbeat is late or its last action failed, and tapping a desk
 * lists the exact events behind it. Read-only; shadow phase.
 */
export default async function KantoorPage({
  searchParams,
}: {
  searchParams: Promise<{ bureau?: string }>;
}) {
  const live = await loadLive('/admin/kantoor');
  const { bureau } = await searchParams;
  const selected = DESKS.find((d) => d.key === bureau)?.key as DeskKey | undefined;
  const selectedEvents = selected ? live.events.filter((e) => deskOf(e) === selected).slice(0, 40) : [];
  const stale = live.heartbeats.filter((b) => b.stale);

  return (
    <>
      <LiveRefresh seconds={5} />
      <PageHead title="Kantoor" sub="Wie doet wat, op dit moment. Tik op een bureau voor de gebeurtenissen erachter." />

      {stale.map((b) => (
        <Notice key={b.service} tone="bad">
          {b.service} geeft {b.ageMinutes === null ? 'nog geen teken van leven' : `al ${b.ageMinutes} minuten geen teken van leven`}.
        </Notice>
      ))}

      <StatGrid>
        <Stat label="Wacht op goedkeuring" value={live.waiting} icon={<Hourglass size={16} />} tone={live.waiting ? 'warn' : 'ok'} foot={`${live.waitingOver15} langer dan 15 min`} />
        <Stat label="Geblokkeerd (24 uur)" value={live.blockedToday} icon={<ShieldAlert size={16} />} tone={live.blockedToday ? 'warn' : 'ok'} />
        <Stat label="Verbinding" value={stale.length ? 'Stil' : 'Actief'} icon={<Radio size={16} />} tone={stale.length ? 'stop' : 'ok'} />
      </StatGrid>

      <Card>
        <CardHead>Bureaus</CardHead>
        <Table head={<><th>Bureau</th><th>Status</th><th>Klus</th><th>Laatste actie</th><th>Tijd</th><th>Wacht</th></>}>
          {live.desks.map((d) => (
            <tr key={d.key}>
              <td><Link href={`/admin/kantoor?bureau=${d.key}`}>{d.label}</Link></td>
              <td><Badge tone={STATE_TONE[d.state]}>{STATE_LABEL[d.state]}</Badge></td>
              <td style={{ whiteSpace: 'nowrap' }}>{live.codeOf(d.jobRoomId)}</td>
              <td>{d.lastAction ?? '—'}</td>
              <td>{d.lastAt ? fmtTime(d.lastAt) : '—'}</td>
              <td>{d.waiting || '—'}</td>
            </tr>
          ))}
        </Table>
      </Card>

      {selected && (
        <Card>
          <CardHead>{DESKS.find((d) => d.key === selected)?.label}: laatste gebeurtenissen</CardHead>
          {selectedEvents.length === 0 ? (
            <Empty>Nog geen gebeurtenissen voor dit bureau.</Empty>
          ) : (
            <Table head={<><th>Tijd</th><th>Klus</th><th>Soort</th><th>Tekst</th><th>Status</th></>}>
              {selectedEvents.map((e) => (
                <tr key={e.id}>
                  <td>{fmtTime(e.created_at)}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{live.codeOf(e.job_room_id)}</td>
                  <td>{e.kind}</td>
                  <td>{feedText(e)}</td>
                  <td><Badge tone={e.status === 'blocked' || e.status === 'error' ? 'stop' : 'ok'}>{e.status}</Badge></td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      )}
    </>
  );
}
