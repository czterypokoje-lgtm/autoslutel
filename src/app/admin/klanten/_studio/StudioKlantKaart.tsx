import Link from 'next/link';
import { CalendarPlus, ChevronLeft, MessageCircle, Phone } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getBrandLogo } from '@/lib/brandLogos';
import { getInitials } from '@/lib/utils';
import { PreviewText } from '@/app/admin/PreviewLanguage';
import EraseButton from '../[telefoon]/EraseButton';

import { DATE } from './data';

/**
 * The customer card in the Studio look. Everything shown here is handed over
 * by klanten/[telefoon]/page.tsx — the same four Supabase reads, the same
 * timeline, the same AVG block and the same erase button component. No query
 * and no link lives in this file.
 */

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

/** The old screen's five pill tones, as badge classes. */
const PILL: Record<string, string> = {
  ok: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  warn: 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  info: 'border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400',
  stop: 'border-destructive/20 bg-destructive/10 text-destructive',
  mute: 'border-border bg-muted text-muted-foreground',
};

export interface TimelineEvent {
  key: string;
  at: string;
  kind: 'lead' | 'job';
  title: string;
  sub: string;
  status: { label: string; cls: string };
  href?: string;
}

export interface Vehicle {
  kenteken: string;
  brand: string | null;
  model: string | null;
  year: number | string | null;
  aanvragen: number;
  last_seen: string;
}

export default function StudioKlantKaart({
  phone,
  name,
  email,
  postcode,
  firstSeen,
  totalValue,
  consentMarketing,
  consentAt,
  leadCount,
  jobsDone,
  vehicles,
  events,
  wa,
}: {
  phone: string;
  name: string;
  email: string | null;
  postcode: string | null;
  firstSeen: string;
  totalValue: number;
  consentMarketing: boolean;
  consentAt: string | null;
  leadCount: number;
  jobsDone: number;
  vehicles: Vehicle[];
  events: TimelineEvent[];
  wa: string | null;
}) {
  const stats: [string, string | number][] = [
    ['Klant sinds', DATE.format(new Date(firstSeen))],
    ['Aanvragen', leadCount],
    ['Klussen afgerond', jobsDone],
    ['Omzet', MONEY.format(totalValue)],
  ];

  return (
    <div className="kfc-neutral flex flex-col gap-4 md:gap-6">
      <Button asChild variant="ghost" size="sm" className="text-muted-foreground w-fit px-2">
        <Link href="/admin/klanten"><ChevronLeft className="size-4" /><PreviewText>Alle klanten</PreviewText></Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar size="lg" className="font-medium">
            <AvatarFallback>{getInitials(name).slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="truncate text-3xl leading-none font-medium tracking-tight">{name}</h1>
            <p className="text-muted-foreground truncate text-sm">
              {phone}
              {postcode && ` · ${postcode}`}
              {email && ` · ${email}`}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <a href={`tel:${phone}`}><Phone className="size-4" /> <PreviewText>Bellen</PreviewText></a>
          </Button>
          {wa && (
            <Button asChild variant="outline" size="sm">
              <a href={wa} target="_blank" rel="noopener noreferrer"><MessageCircle className="size-4" /> WhatsApp</a>
            </Button>
          )}
          <Button asChild size="sm">
            <Link href="/admin/jobs/nieuw"><CalendarPlus className="size-4" /> <PreviewText>Klus inplannen</PreviewText></Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([label, value]) => (
          <Card key={label} className="gap-1 py-4">
            <CardHeader className="px-4">
              <CardDescription><PreviewText>{label}</PreviewText></CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums">{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle><PreviewText>Tijdlijn</PreviewText></CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="text-muted-foreground text-sm"><PreviewText>Nog geen aanvragen of klussen.</PreviewText></p>
            ) : (
              <ol className="border-border/60 ml-1 grid gap-4 border-l pl-5">
                {events.map((e) => (
                  <li key={e.key} className="relative">
                    <span
                      aria-hidden="true"
                      className={`ring-background absolute top-1.5 -left-[25px] size-2.5 rounded-full ring-4 ${e.kind === 'job' ? 'bg-primary' : 'bg-muted-foreground'}`}
                    />
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {e.href ? (
                        <Link href={e.href} className="text-sm font-medium hover:underline">{e.title}</Link>
                      ) : (
                        <b className="text-sm font-medium">{e.title}</b>
                      )}
                      <Badge className={`border px-2 py-1 font-medium ${PILL[e.status.cls] ?? PILL.mute}`} variant="outline">
                        {e.status.label}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {DATE.format(new Date(e.at))}
                      {e.sub && ` · ${e.sub}`}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        <div className="flex min-w-0 flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle><PreviewText>Auto&apos;s</PreviewText></CardTitle>
            </CardHeader>
            <CardContent>
              {vehicles.length === 0 ? (
                <p className="text-muted-foreground text-sm"><PreviewText>Nog geen kenteken bekend voor deze klant.</PreviewText></p>
              ) : (
                <ul className="grid gap-3">
                  {vehicles.map((v) => {
                    const logo = getBrandLogo(v.brand);
                    return (
                      <li key={v.kenteken} className="flex items-center gap-3">
                        {logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={logo} alt="" className="size-7 shrink-0 object-contain" />
                        ) : (
                          <span aria-hidden="true" className="bg-muted size-7 shrink-0 rounded-md" />
                        )}
                        <span className="grid min-w-0 gap-0.5">
                          <b className="truncate text-sm font-medium">{[v.brand, v.model, v.year].filter(Boolean).join(' ') || 'Auto'}</b>
                          <span className="text-muted-foreground truncate text-xs">
                            <span className="bg-muted text-foreground rounded px-1 font-medium tracking-wide">{v.kenteken}</span>
                            {' · '}{v.aanvragen}× · <PreviewText>laatst</PreviewText> {DATE.format(new Date(v.last_seen))}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle><PreviewText>Privacy (AVG)</PreviewText></CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <p className="flex flex-wrap items-center gap-2 text-sm">
                <PreviewText>Marketing:</PreviewText>
                <Badge className={`border px-2 py-1 font-medium ${consentMarketing ? PILL.ok : PILL.mute}`} variant="outline">
                  <PreviewText>{consentMarketing ? 'toestemming' : 'geen toestemming'}</PreviewText>
                </Badge>
                {consentAt && <span className="text-muted-foreground text-xs"><PreviewText>sinds</PreviewText> {DATE.format(new Date(consentAt))}</span>}
              </p>
              <p className="text-muted-foreground text-sm">
                <PreviewText>Zet deze klant alleen op een mailinglijst als hier &ldquo;toestemming&rdquo; staat.</PreviewText>
              </p>
            </CardContent>
          </Card>

          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-destructive"><PreviewText>Gegevens wissen</PreviewText></CardTitle>
              <CardDescription>
                <PreviewText>
                  Verwijdert alle aanvragen van dit nummer en haalt naam, telefoon, adres en notities van de klussen af. De klussen
                  zelf blijven bestaan voor de administratie (7 jaar). Dit kan niet ongedaan worden gemaakt.
                </PreviewText>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EraseButton phone={phone} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
