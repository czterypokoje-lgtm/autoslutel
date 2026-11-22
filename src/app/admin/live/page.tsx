import { PreviewText } from '@/app/admin/PreviewLanguage';
import { PageHead, StatGrid, Stat, Card, CardHead, Table, Badge, Notice, Empty } from '../_ui';
import { BRAND, STUDIO_UI } from '@/config/install';
import { Activity, Hourglass, ShieldAlert, Radio } from 'lucide-react';
import { feedText } from '@/lib/jobRoomLive';
import LiveRefresh from './LiveRefresh';
import { fmtTime, loadLive } from './loadLive';
import {
  Card as SCard,
  CardContent as SCardContent,
  CardHeader as SCardHeader,
  CardTitle as SCardTitle,
} from '@/components/ui/card';
import { Badge as SBadge } from '@/components/ui/badge';
import {
  Table as STable,
  TableBody as STableBody,
  TableCell as STableCell,
  TableHead as STableHead,
  TableHeader as STableHeader,
  TableRow as STableRow,
} from '@/components/ui/table';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: `Live | ${BRAND.name}`,
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
const toneBadgeClass = (t: 'stop' | 'ok' | 'warn' | 'info') =>
  t === 'stop'
    ? undefined
    : t === 'warn'
      ? 'border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-300'
      : t === 'info'
        ? 'border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/15 dark:text-blue-300'
        : 'border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300';

export default async function LivePage() {
  const live = await loadLive('/admin/live');
  const stale = live.heartbeats.filter((b) => b.stale);

  if (STUDIO_UI) {
    const kpis = [
      { label: 'Wacht op goedkeuring', value: live.waiting, icon: Hourglass, warn: Boolean(live.waiting) },
      { label: 'Langer dan 15 min', value: live.waitingOver15, icon: Hourglass, warn: Boolean(live.waitingOver15) },
      { label: 'Geblokkeerd (24 uur)', value: live.blockedToday, icon: ShieldAlert, warn: Boolean(live.blockedToday) },
      {
        label: 'Verbinding',
        value: stale.length ? 'Stil' : 'Actief',
        icon: Radio,
        warn: stale.length > 0,
        foot: live.heartbeats.map((b) => `${b.service}: ${b.ageMinutes ?? '—'} min`).join(' · ') || 'geen hartslag ontvangen',
      },
    ];

    return (
      <div className="kfc-neutral flex flex-col gap-4 md:gap-6">
        <LiveRefresh seconds={5} />
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl leading-none font-medium tracking-tight"><PreviewText>Live</PreviewText></h1>
          <p className="text-muted-foreground text-sm">
            <PreviewText>Alles wat er in de klussen gebeurt, elke 5 seconden ververst. Alleen kijken: hier kan niets verstuurd worden.</PreviewText>
          </p>
        </div>

        {live.readFailed && (
          <p className="text-destructive text-sm"><PreviewText>Lezen mislukt. Is migratie 0078 al toegepast?</PreviewText></p>
        )}
        {stale.map((b) => (
          <p key={b.service} className="text-destructive text-sm">
            <PreviewText>
              {`${b.service} geeft ${b.ageMinutes === null ? 'nog geen teken van leven' : `al ${b.ageMinutes} minuten geen teken van leven`}.`}
            </PreviewText>
          </p>
        ))}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((k) => (
            <SCard key={k.label} className={k.warn ? 'border-amber-300 dark:border-amber-500/40' : undefined}>
              <SCardContent className="flex flex-col gap-1 pt-6">
                <span className="text-muted-foreground flex items-center gap-1.5 text-sm"><k.icon className="size-4" /><PreviewText>{k.label}</PreviewText></span>
                <span className="text-2xl font-semibold">{k.value}</span>
                {k.foot && <span className="text-muted-foreground text-xs">{k.foot}</span>}
              </SCardContent>
            </SCard>
          ))}
        </div>

        <SCard>
          <SCardHeader>
            <SCardTitle><PreviewText>Wachtrij (schaduw: er wordt niets verstuurd)</PreviewText></SCardTitle>
          </SCardHeader>
          <SCardContent className={live.outbox.length ? 'overflow-x-auto' : undefined}>
            {live.outbox.length === 0 ? (
              <p className="text-muted-foreground text-sm"><PreviewText>Geen berichten in de wachtrij.</PreviewText></p>
            ) : (
              <STable>
                <STableHeader>
                  <STableRow>
                    <STableHead><PreviewText>Klus</PreviewText></STableHead>
                    <STableHead><PreviewText>Soort</PreviewText></STableHead>
                    <STableHead>Voor</STableHead>
                    <STableHead>Tier</STableHead>
                    <STableHead>Status</STableHead>
                    <STableHead>Wacht</STableHead>
                  </STableRow>
                </STableHeader>
                <STableBody>
                  {live.outbox.slice(0, 30).map((o) => (
                    <STableRow key={o.id}>
                      <STableCell className="whitespace-nowrap">{live.codeOf(o.job_room_id)}</STableCell>
                      <STableCell>{o.kind.split(':')[0]}</STableCell>
                      <STableCell>{o.audience}</STableCell>
                      <STableCell>{o.tier}</STableCell>
                      <STableCell><SBadge variant="outline" className={toneBadgeClass(toneOfState(o.state))}>{o.state}</SBadge></STableCell>
                      <STableCell>{`${Math.max(0, Math.round((live.nowMs - Date.parse(o.created_at)) / 60_000))} min`}</STableCell>
                    </STableRow>
                  ))}
                </STableBody>
              </STable>
            )}
          </SCardContent>
        </SCard>

        <SCard>
          <SCardHeader>
            <SCardTitle className="flex items-center gap-2"><Activity className="size-4" /> <PreviewText>Gebeurtenissen</PreviewText></SCardTitle>
          </SCardHeader>
          <SCardContent className={live.events.length ? 'overflow-x-auto' : undefined}>
            {live.events.length === 0 ? (
              <p className="text-muted-foreground text-sm"><PreviewText>Nog niets ontvangen.</PreviewText></p>
            ) : (
              <STable>
                <STableHeader>
                  <STableRow>
                    <STableHead><PreviewText>Tijd</PreviewText></STableHead>
                    <STableHead><PreviewText>Klus</PreviewText></STableHead>
                    <STableHead></STableHead>
                    <STableHead><PreviewText>Soort</PreviewText></STableHead>
                    <STableHead>Tekst</STableHead>
                    <STableHead>Status</STableHead>
                  </STableRow>
                </STableHeader>
                <STableBody>
                  {live.events.slice(0, 60).map((e) => (
                    <STableRow key={e.id}>
                      <STableCell>{fmtTime(e.created_at)}</STableCell>
                      <STableCell className="whitespace-nowrap">{live.codeOf(e.job_room_id)}</STableCell>
                      <STableCell>{e.direction === 'in' ? '←' : e.direction === 'out' ? '→' : '·'}</STableCell>
                      <STableCell>{e.kind}</STableCell>
                      <STableCell className="max-w-64 truncate">{feedText(e)}</STableCell>
                      <STableCell><SBadge variant="outline" className={toneBadgeClass(toneOfStatus(e.status))}>{e.status}</SBadge></STableCell>
                    </STableRow>
                  ))}
                </STableBody>
              </STable>
            )}
          </SCardContent>
        </SCard>
      </div>
    );
  }

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
          <Table head={<><th><PreviewText>{"Klus"}</PreviewText></th><th><PreviewText>{"Soort"}</PreviewText></th><th>Voor</th><th>Tier</th><th>Status</th><th>Wacht</th></>}>
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
          <Table head={<><th><PreviewText>{"Tijd"}</PreviewText></th><th><PreviewText>{"Klus"}</PreviewText></th><th></th><th><PreviewText>{"Soort"}</PreviewText></th><th>Tekst</th><th>Status</th></>}>
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
