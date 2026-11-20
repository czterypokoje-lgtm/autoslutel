import { PreviewText } from '@/app/admin/PreviewLanguage';
import Link from 'next/link';
import { BRAND, STUDIO_UI } from '@/config/install';
import { PageHead, StatGrid, Stat, Card, CardHead, Table, Badge, Notice, Empty } from '../_ui';
import { Hourglass, ShieldAlert, Radio } from 'lucide-react';
import { DESKS, deskOf, feedText, type DeskKey } from '@/lib/jobRoomLive';
import LiveRefresh from '../live/LiveRefresh';
import { fmtTime, loadLive } from '../live/loadLive';
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

  if (STUDIO_UI) {
    const toneBadgeClass = (t: 'ok' | 'warn' | 'info' | 'stop') =>
      t === 'stop'
        ? undefined
        : t === 'warn'
          ? 'border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-300'
          : t === 'info'
            ? 'border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/15 dark:text-blue-300'
            : 'border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300';

    const kpis = [
      { label: 'Wacht op goedkeuring', value: live.waiting, icon: Hourglass, warn: Boolean(live.waiting), foot: `${live.waitingOver15} langer dan 15 min` },
      { label: 'Geblokkeerd (24 uur)', value: live.blockedToday, icon: ShieldAlert, warn: Boolean(live.blockedToday) },
      { label: 'Verbinding', value: stale.length ? 'Stil' : 'Actief', icon: Radio, warn: stale.length > 0 },
    ];

    return (
      <div className="kfc-neutral flex flex-col gap-4 md:gap-6">
        <LiveRefresh seconds={5} />
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl leading-none font-medium tracking-tight"><PreviewText>Kantoor</PreviewText></h1>
          <p className="text-muted-foreground text-sm"><PreviewText>Wie doet wat, op dit moment. Tik op een bureau voor de gebeurtenissen erachter.</PreviewText></p>
        </div>

        {stale.map((b) => (
          <p key={b.service} className="text-destructive text-sm">
            <PreviewText>
              {`${b.service} geeft ${b.ageMinutes === null ? 'nog geen teken van leven' : `al ${b.ageMinutes} minuten geen teken van leven`}.`}
            </PreviewText>
          </p>
        ))}

        <div className="grid gap-4 sm:grid-cols-3">
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
            <SCardTitle><PreviewText>Bureaus</PreviewText></SCardTitle>
          </SCardHeader>
          <SCardContent className="overflow-x-auto">
            <STable>
              <STableHeader>
                <STableRow>
                  <STableHead>Bureau</STableHead>
                  <STableHead>Status</STableHead>
                  <STableHead><PreviewText>Klus</PreviewText></STableHead>
                  <STableHead>Laatste actie</STableHead>
                  <STableHead><PreviewText>Tijd</PreviewText></STableHead>
                  <STableHead>Wacht</STableHead>
                </STableRow>
              </STableHeader>
              <STableBody>
                {live.desks.map((d) => (
                  <STableRow key={d.key}>
                    <STableCell><Link href={`/admin/kantoor?bureau=${d.key}`} className="hover:underline">{d.label}</Link></STableCell>
                    <STableCell><SBadge variant="outline" className={toneBadgeClass(STATE_TONE[d.state])}>{STATE_LABEL[d.state]}</SBadge></STableCell>
                    <STableCell className="whitespace-nowrap">{live.codeOf(d.jobRoomId)}</STableCell>
                    <STableCell>{d.lastAction ?? '—'}</STableCell>
                    <STableCell>{d.lastAt ? fmtTime(d.lastAt) : '—'}</STableCell>
                    <STableCell>{d.waiting || '—'}</STableCell>
                  </STableRow>
                ))}
              </STableBody>
            </STable>
          </SCardContent>
        </SCard>

        {selected && (
          <SCard>
            <SCardHeader>
              <SCardTitle>{DESKS.find((d) => d.key === selected)?.label}: <PreviewText>laatste gebeurtenissen</PreviewText></SCardTitle>
            </SCardHeader>
            <SCardContent className={selectedEvents.length ? 'overflow-x-auto' : undefined}>
              {selectedEvents.length === 0 ? (
                <p className="text-muted-foreground text-sm"><PreviewText>Nog geen gebeurtenissen voor dit bureau.</PreviewText></p>
              ) : (
                <STable>
                  <STableHeader>
                    <STableRow>
                      <STableHead><PreviewText>Tijd</PreviewText></STableHead>
                      <STableHead><PreviewText>Klus</PreviewText></STableHead>
                      <STableHead><PreviewText>Soort</PreviewText></STableHead>
                      <STableHead>Tekst</STableHead>
                      <STableHead>Status</STableHead>
                    </STableRow>
                  </STableHeader>
                  <STableBody>
                    {selectedEvents.map((e) => (
                      <STableRow key={e.id}>
                        <STableCell>{fmtTime(e.created_at)}</STableCell>
                        <STableCell className="whitespace-nowrap">{live.codeOf(e.job_room_id)}</STableCell>
                        <STableCell>{e.kind}</STableCell>
                        <STableCell className="max-w-64 truncate">{feedText(e)}</STableCell>
                        <STableCell>
                          <SBadge variant="outline" className={e.status === 'blocked' || e.status === 'error' ? undefined : toneBadgeClass('ok')}>
                            {e.status}
                          </SBadge>
                        </STableCell>
                      </STableRow>
                    ))}
                  </STableBody>
                </STable>
              )}
            </SCardContent>
          </SCard>
        )}
      </div>
    );
  }

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
        <Table head={<><th>Bureau</th><th>Status</th><th><PreviewText>{"Klus"}</PreviewText></th><th>Laatste actie</th><th><PreviewText>{"Tijd"}</PreviewText></th><th>Wacht</th></>}>
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
            <Table head={<><th><PreviewText>{"Tijd"}</PreviewText></th><th><PreviewText>{"Klus"}</PreviewText></th><th><PreviewText>{"Soort"}</PreviewText></th><th>Tekst</th><th>Status</th></>}>
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
