'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Clock, KeyRound, MapPin, Timer, X } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { OfferRow } from './OfferList';

export type { OfferRow };

/** Seconds left on the window, or null once it has run out. */
function secondsLeft(iso: string, now: number): number | null {
  const left = Math.floor((new Date(iso).getTime() - now) / 1000);
  return left > 0 ? left : null;
}

const mmss = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
const EUR = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

/** The time left as a ring that empties, so urgency reads without reading. */
function Countdown({ left, total }: { left: number; total: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const frac = total > 0 ? Math.max(0, Math.min(1, left / total)) : 0;
  const urgent = left < 60;
  return (
    <div className="relative grid size-16 shrink-0 place-items-center" aria-label={`Nog ${mmss(left)}`}>
      <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true" className="absolute inset-0">
        <circle cx="32" cy="32" r={r} className="fill-none stroke-muted" strokeWidth={5} />
        <circle
          cx="32"
          cy="32"
          r={r}
          className={urgent ? 'fill-none stroke-destructive' : 'fill-none stroke-primary'}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={`${c * frac} ${c}`}
          transform="rotate(-90 32 32)"
        />
      </svg>
      <span className={urgent ? 'text-sm font-semibold tabular-nums text-destructive' : 'text-sm font-semibold tabular-nums'}>
        {mmss(left)}
      </span>
    </div>
  );
}

export default function StudioOfferList({ offers }: { offers: OfferRow[] }) {
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; good: boolean } | null>(null);

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  const live = offers.filter((o) => secondsLeft(o.expiresAt, now) !== null);

  useEffect(() => {
    if (offers.length && !live.length) router.refresh();
  }, [offers.length, live.length, router]);

  async function respond(id: string, accept: boolean) {
    setBusy(id);
    setMessage(null);
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.rpc('crm_respond_to_offer', {
      p_offer_id: id,
      p_accept: accept,
    });
    setBusy(null);

    if (error) {
      setMessage({
        good: false,
        text: /does not exist|function/i.test(error.message)
          ? 'Voer supabase/migrations/0013_technician_platform.sql uit.'
          : error.message,
      });
      return;
    }

    const said: Record<string, string> = {
      geaccepteerd: 'De klus is van jou. Je vindt hem bij Vandaag.',
      afgewezen: 'Afgewezen.',
      al_vergeven: 'Net te laat: een collega was er eerder bij.',
      verlopen: 'Dit aanbod is verlopen.',
      niet_gevonden: 'Dit aanbod bestaat niet meer.',
      geen_monteur: 'Je login is niet aan een monteur gekoppeld.',
    };
    setMessage({ good: String(data) === 'geaccepteerd', text: said[String(data)] ?? String(data) });
    router.refresh();
  }

  const note = message && (
    <p className={message.good ? 'text-sm text-green-600 dark:text-green-400' : 'text-sm text-destructive'}>{message.text}</p>
  );

  if (!live.length) {
    return (
      <>
        {note}
        <Card>
          <CardContent className="flex flex-col gap-1 text-sm">
            <b className="text-base font-medium">Op dit moment geen aanbod.</b>
            <span className="text-muted-foreground">
              Nieuwe klussen verschijnen hier en via Telegram. Zet bij <a className="underline" href="/admin/mijn-vak">Mijn vak</a> welke
              auto&apos;s je aankunt: wat daar niet staat, krijg je niet aangeboden.
            </span>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      {note}
      <div className="flex flex-col gap-3">
        {live.map((offer) => {
          const left = secondsLeft(offer.expiresAt, now) ?? 0;
          const total = Math.max(1, Math.floor((new Date(offer.expiresAt).getTime() - new Date(offer.offeredAt).getTime()) / 1000));
          return (
            <Card key={offer.id}>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted" aria-hidden="true">
                    {offer.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={offer.logo} alt="" className="size-7 object-contain" />
                    ) : (
                      <span className="text-xs font-semibold">{(offer.make ?? '?').slice(0, 3).toUpperCase()}</span>
                    )}
                  </span>
                  <div className="flex-1">
                    <h2 className="text-base font-medium">{offer.car}</h2>
                    <span className="text-sm text-muted-foreground">{offer.work}</span>
                  </div>
                  <Countdown left={left} total={total} />
                </div>

                <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
                  <li className="flex items-center gap-1.5">
                    <Clock size={15} aria-hidden="true" />
                    {offer.when}
                  </li>
                  <li className="flex items-center gap-1.5">
                    <MapPin size={15} aria-hidden="true" />
                    {offer.where}
                  </li>
                  {offer.minutes && (
                    <li className="flex items-center gap-1.5">
                      <Timer size={15} aria-hidden="true" />± {offer.minutes} min
                    </li>
                  )}
                  {offer.keyless === true && (
                    <li className="flex items-center gap-1.5">
                      <KeyRound size={15} aria-hidden="true" />
                      Keyless
                    </li>
                  )}
                  {offer.price != null && (
                    <li className="font-semibold tabular-nums" title="Uw eigen tarief uit Mijn vak">
                      {EUR.format(offer.price)}
                    </li>
                  )}
                </ul>
                {offer.reason && <p className="text-sm text-muted-foreground">{offer.reason}</p>}

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-11 text-base"
                    onClick={() => respond(offer.id, false)}
                    disabled={busy === offer.id}
                  >
                    <X size={18} strokeWidth={2} data-icon="inline-start" />
                    Nee
                  </Button>
                  <Button
                    size="lg"
                    className="h-11 bg-green-600 text-base text-white hover:bg-green-600/90"
                    onClick={() => respond(offer.id, true)}
                    disabled={busy === offer.id}
                  >
                    <Check size={18} strokeWidth={2.4} data-icon="inline-start" />
                    {busy === offer.id ? 'Bezig…' : 'Accepteren'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
