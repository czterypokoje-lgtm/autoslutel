'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Clock, KeyRound, MapPin, Timer, X } from 'lucide-react';
import styles from './aanbod.module.css';
import { DEFAULT_CRM_LOCALE, INTL_LOCALE, type CrmLocale } from '@/lib/crmLocale';
import { tf, translator } from '../_i18n';
import { AANBOD } from '../_i18n/aanbod';
import { NAV } from '../_i18n/shell';
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
/* Built per locale rather than once at module scope: a German partner reads
   "129,00 €" and a Dutch one "€ 129,00", and the old module-level formatter
   gave everyone the Dutch form. */
const eur = (locale: CrmLocale) =>
  new Intl.NumberFormat(INTL_LOCALE[locale], { style: 'currency', currency: 'EUR' });

/** The time left as a ring that empties, so urgency reads without reading. */
function Countdown({
  left,
  total,
  locale,
}: {
  left: number;
  total: number;
  locale: CrmLocale;
}) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const frac = total > 0 ? Math.max(0, Math.min(1, left / total)) : 0;
  const urgent = left < 60;
  return (
    <div className={styles.ring} aria-label={tf(AANBOD.timeLeft, locale, { time: mmss(left) })}>
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

export default function OfferList({
  offers,
  locale = DEFAULT_CRM_LOCALE,
}: {
  offers: OfferRow[];
  /** The partner's own language, from technicians.locale. */
  locale?: CrmLocale;
}) {
  const tr = translator(locale);
  const money = eur(locale);
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
          ? tr(AANBOD.runMigration)
          : error.message,
      });
      return;
    }

    /* The keys are what the Postgres function returns and stay Dutch; only
       what the partner reads is translated. */
    const said: Record<string, string> = {
      geaccepteerd: tr(AANBOD.accepted),
      afgewezen: tr(AANBOD.declined),
      al_vergeven: tr(AANBOD.tooLate),
      verlopen: tr(AANBOD.expired),
      niet_gevonden: tr(AANBOD.gone),
      geen_monteur: tr(AANBOD.noTechnician),
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
          <b>{tr(AANBOD.noneRightNow)}</b>
          <span>
            {tr(AANBOD.emptyHintBefore)}
            <a href="/admin/mijn-vak">{tr(NAV.mijnVak)}</a>
            {tr(AANBOD.emptyHintAfter)}
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
                <Countdown left={left} total={total} locale={locale} />
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
                  <li className={styles.price} title={tr(AANBOD.ownRateTitle)}>
                    {money.format(offer.price)}
                  </li>
                )}
              </ul>
              {offer.reason && <p className={styles.reason}>{offer.reason}</p>}

              <div className={styles.actions}>
                <button className={styles.no} onClick={() => respond(offer.id, false)} disabled={busy === offer.id}>
                  <X size={18} strokeWidth={2} />
                  {tr(AANBOD.decline)}
                </button>
                <button className={styles.yes} onClick={() => respond(offer.id, true)} disabled={busy === offer.id}>
                  <Check size={18} strokeWidth={2.4} />
                  {busy === offer.id ? tr(AANBOD.busy) : tr(AANBOD.accept)}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
