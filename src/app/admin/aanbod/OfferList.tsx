'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Clock, MapPin, X } from 'lucide-react';
import styles from '../admin.module.css';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

export interface OfferRow {
  id: string;
  reason: string;
  expiresAt: string;
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

export default function OfferList({ offers }: { offers: OfferRow[] }) {
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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
      setMessage(
        /does not exist|function/i.test(error.message)
          ? 'Voer supabase/migrations/0013_technician_platform.sql uit.'
          : error.message
      );
      return;
    }

    const said: Record<string, string> = {
      geaccepteerd: 'Klus is van u. U vindt hem bij Vandaag.',
      afgewezen: 'Afgewezen.',
      al_vergeven: 'Net te laat — een collega was er eerder bij.',
      verlopen: 'Dit aanbod is verlopen.',
      niet_gevonden: 'Dit aanbod bestaat niet meer.',
      geen_monteur: 'Uw login is niet aan een monteur gekoppeld.',
    };
    setMessage(said[String(data)] ?? String(data));
    router.refresh();
  }

  if (!live.length) {
    return (
      <>
        {message && <p className={`${styles.note} ${styles.noteOk}`}>{message}</p>}
        <div className={styles.listCard}>
          <div className={styles.empty}>
            Op dit moment geen aanbod. Zorg dat bij <strong>Mijn vak</strong> staat welke auto’s u
            aankunt — wat daar niet staat, krijgt u niet aangeboden.
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {message && <p className={`${styles.note} ${styles.noteOk}`}>{message}</p>}

      <div className={styles.listCard}>
        {live.map((offer) => {
          const left = secondsLeft(offer.expiresAt, now) ?? 0;
          // Comparing the formatted string would have made "10:00" urgent and
          // "9:00" not; compare the seconds.
          const urgent = left < 30;

          return (
            <div className={styles.row} key={offer.id}>
              <div className={styles.rowMain}>
                <div className={styles.rowTitleLine}>
                  <span className={styles.rowTitle}>{offer.car}</span>
                  <span className={styles.rowSlug}>{offer.work}</span>
                </div>
                <div className={styles.rowMeta}>
                  <span className={styles.chip}>
                    <Clock size={13} strokeWidth={2} />
                    {offer.when}
                  </span>
                  <span className={styles.chip}>
                    <MapPin size={13} strokeWidth={2} />
                    {offer.where}
                  </span>
                  {offer.price != null && (
                    <span className={`${styles.chip} ${styles.chipOk}`}>
                      € {offer.price.toFixed(2).replace('.', ',')}
                    </span>
                  )}
                  {offer.minutes && <span className={styles.chip}>± {offer.minutes} min</span>}
                  {offer.keyless === true && <span className={styles.chip}>keyless</span>}
                  <span className={`${styles.chip} ${urgent ? styles.chipStop : styles.chipWarn}`}>
                    nog {mmss(left)}
                  </span>
                </div>
              </div>

              <div className={styles.rowActions}>
                <button
                  className={styles.ghostBtn}
                  onClick={() => respond(offer.id, false)}
                  disabled={busy === offer.id}
                >
                  <X size={15} strokeWidth={2} />
                  Nee
                </button>
                <button
                  className={styles.primaryBtn}
                  onClick={() => respond(offer.id, true)}
                  disabled={busy === offer.id}
                >
                  <Check size={15} strokeWidth={2.2} />
                  {busy === offer.id ? '…' : 'Aannemen'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
