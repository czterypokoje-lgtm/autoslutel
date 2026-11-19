import { PageHead, StatGrid, Stat, Card, CardHead, Table, Badge, Notice, Empty } from '../_ui';
import { Activity, Hourglass, ShieldAlert, Radio } from 'lucide-react';
import { feedText } from '@/lib/jobRoomLive';
import LiveRefresh from './LiveRefresh';
import { fmtTime, loadLive } from './loadLive';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Live | Autosleutel24',
};

const toneOfStatus = (s: string) => (s === 'blocked' || s === 'error' ? 'stop' : s === 'processed' ? 'ok' : 'info');
const toneOfState = (s: string) =>
  s === 'proposed' ? 'warn' : s === 'approved' ? 'ok' : s === 'cancelled' || s === 'failed' ? 'stop' : 'info';

/**
 * What is going on, right now. Read-only: every message in and out and every
 * waiting approval, newest first, refreshed every 5 seconds. Shadow phase:
 * nothing on this page can send or change anything. Phone numbers show their
 * last four digits only.
 */
export default async function LivePage() {
  const live = await loadLive('/admin/live');
  const stale = live.heartbeats.filter((b) => b.stale);

  return (
    <>
      <LiveRefresh seconds={5} />
      <PageHead
        title="Live"
        sub="Alles wat er in de klussen gebeurt, elke 5 seconden ververst. Alleen kijken: hier kan niets verstuurd worden."
      />

      {live.readFailed && <Notice tone="bad">Lezen mislukt. Is migratie 0078 al toegepast?</Notice>}
      {stale.map((b) => (
        <Notice key={b.service} tone="bad">
          {b.service} geeft{' '}
          {b.ageMinutes === null ? 'nog geen teken van leven' : `al ${b.ageMinutes} minuten geen teken van leven`}.
        </Notice>
      ))}

      <StatGrid>
        <Stat label="Wacht op goedkeuring" value={live.waiting} icon={<Hourglass size={16} />} tone={live.waiting ? 'warn' : 'ok'} />
        <Stat label="Langer dan 15 min" value={live.waitingOver15} icon={<Hourglass size={16} />} tone={live.waitingOver15 ? 'stop' : 'ok'} />
        <Stat label="Geblokkeerd (24 uur)" value={live.blockedToday} icon={<ShieldAlert size={16} />} tone={live.blockedToday ? 'warn' : 'ok'} />
        <Stat
          label="Verbinding"
          value={stale.length ? 'Stil' : 'Actief'}
          icon={<Radio size={16} />}
          tone={stale.length ? 'stop' : 'ok'}
          foot={live.heartbeats.map((b) => `${b.service}: ${b.ageMinutes ?? '—'} min`).join(' · ') || 'geen hartslag ontvangen'}
        />
      </StatGrid>

      <Card>
        <CardHead>Wachtrij (schaduw: er wordt niets verstuurd)</CardHead>
        {live.outbox.length === 0 ? (
          <Empty>Geen berichten in de wachtrij.</Empty>
        ) : (
          <Table head={<><th>Klus</th><th>Soort</th><th>Voor</th><th>Tier</th><th>Status</th><th>Wacht</th></>}>
            {live.outbox.slice(0, 30).map((o) => (
              <tr key={o.id}>
                <td style={{ whiteSpace: 'nowrap' }}>{live.codeOf(o.job_room_id)}</td>
                <td>{o.kind.split(':')[0]}</td>
                <td>{o.audience}</td>
                <td>{o.tier}</td>
                <td><Badge tone={toneOfState(o.state)}>{o.state}</Badge></td>
                <td>{Math.max(0, Math.round((live.nowMs - Date.parse(o.created_at)) / 60_000))} min</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Card>
        <CardHead><Activity size={14} /> Gebeurtenissen</CardHead>
        {live.events.length === 0 ? (
          <Empty>Nog niets ontvangen.</Empty>
        ) : (
          <Table head={<><th>Tijd</th><th>Klus</th><th></th><th>Soort</th><th>Tekst</th><th>Status</th></>}>
            {live.events.slice(0, 60).map((e) => (
              <tr key={e.id}>
                <td>{fmtTime(e.created_at)}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{live.codeOf(e.job_room_id)}</td>
                <td>{e.direction === 'in' ? '←' : e.direction === 'out' ? '→' : '·'}</td>
                <td>{e.kind}</td>
                <td>{feedText(e)}</td>
                <td><Badge tone={toneOfStatus(e.status)}>{e.status}</Badge></td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
