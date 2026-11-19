'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Clock, KeyRound, MapPin, Timer, X } from 'lucide-react';
import styles from './aanbod.module.css';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

export interface OfferRow {
  id: string;
  reason: string;
  expiresAt: string;
  offeredAt: string;
  logo: string | null;
  make: string | null;
  car: string;
  work: string;
  minutes: number | null;
  keyless: boolean | null;
  when: string;
  where: string;
  price: number | null;
}

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
    <div className={styles.ring} aria-label={`Nog ${mmss(left)}`}>
      <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r={r} className={styles.ringTrack} />
        <circle
          cx="32"
          cy="32"
          r={r}
          className={urgent ? styles.ringUrgent : styles.ringLive}
          strokeDasharray={`${c * frac} ${c}`}
          transform="rotate(-90 32 32)"
        />
      </svg>
      <span className={urgent ? styles.ringTextUrgent : styles.ringText}>{mmss(left)}</span>
    </div>
  );
}

export default function OfferList({ offers }: { offers: OfferRow[] }) {
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; good: boolean } | null>(null);

  /*
   * A second hand, because an offer with a window needs one. Refreshing the
   * page every second instead would fight the technician's thumb; the server is
   * only asked again when something is actually answered, or when a window runs
   * out and the list has to shrink.
   */
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

  const note = message && <p className={message.good ? styles.msgOk : styles.msg}>{message.text}</p>;

  if (!live.length) {
    return (
      <>
        {note}
        <div className={styles.empty}>
          <b>Op dit moment geen aanbod.</b>
          <span>
            Nieuwe klussen verschijnen hier en via Telegram. Zet bij <a href="/admin/mijn-vak">Mijn vak</a> welke
            auto&apos;s je aankunt: wat daar niet staat, krijg je niet aangeboden.
          </span>
        </div>
      </>
    );
  }

  return (
    <>
      {note}
      <div className={styles.list}>
        {live.map((offer) => {
          const left = secondsLeft(offer.expiresAt, now) ?? 0;
          const total = Math.max(1, Math.floor((new Date(offer.expiresAt).getTime() - new Date(offer.offeredAt).getTime()) / 1000));
          return (
            <article className={styles.card} key={offer.id}>
              <div className={styles.top}>
                <span className={styles.logo} aria-hidden="true">
                  {offer.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={offer.logo} alt="" />
                  ) : (
                    <span>{(offer.make ?? '?').slice(0, 3).toUpperCase()}</span>
                  )}
                </span>
                <div className={styles.what}>
                  <h2 className={styles.car}>{offer.car}</h2>
                  <span className={styles.work}>{offer.work}</span>
                </div>
                <Countdown left={left} total={total} />
              </div>

              <ul className={styles.facts}>
                <li>
                  <Clock size={15} aria-hidden="true" />
                  {offer.when}
                </li>
                <li>
                  <MapPin size={15} aria-hidden="true" />
                  {offer.where}
                </li>
                {offer.minutes && (
                  <li>
                    <Timer size={15} aria-hidden="true" />± {offer.minutes} min
                  </li>
                )}
                {offer.keyless === true && (
                  <li>
                    <KeyRound size={15} aria-hidden="true" />
                    Keyless
                  </li>
                )}
                {/* Hun tarief, niet wat de klant betaalt. */}
                {offer.price != null && (
                  <li className={styles.price} title="Uw eigen tarief uit Mijn vak">
                    {EUR.format(offer.price)}
                  </li>
                )}
              </ul>
              {offer.reason && <p className={styles.reason}>{offer.reason}</p>}

              <div className={styles.actions}>
                <button className={styles.no} onClick={() => respond(offer.id, false)} disabled={busy === offer.id}>
                  <X size={18} strokeWidth={2} />
                  Nee
                </button>
                <button className={styles.yes} onClick={() => respond(offer.id, true)} disabled={busy === offer.id}>
                  <Check size={18} strokeWidth={2.4} />
                  {busy === offer.id ? 'Bezig…' : 'Accepteren'}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
