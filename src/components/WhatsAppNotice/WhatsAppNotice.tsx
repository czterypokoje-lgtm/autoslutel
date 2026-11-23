import Link from 'next/link';
import styles from './WhatsAppNotice.module.css';

/**
 * Required next to every public lead form's submit/phone field: before we
 * message a customer on WhatsApp after a completed job to ask for a Google
 * review, they need to have been told that's coming. This is a transparency
 * notice, not a marketing opt-in — it carries no checkbox and never touches
 * `consent_marketing`/`consent_at`, which keep meaning "may send marketing
 * messages" exactly as before.
 *
 * Server-safe on purpose (no 'use client'): it renders the same static
 * paragraph everywhere, so it can sit inside server or client form
 * components without forcing either into the other's boundary.
 */
export default function WhatsAppNotice({ dark = false }: { dark?: boolean }) {
  return (
    <p className={`${styles.notice} ${dark ? styles.dark : ''}`}>
      Wij bevestigen uw aanvraag per WhatsApp of telefoon en vragen na afloop om een
      korte review. Afmelden kan altijd met STOP. Zie ons <Link href="/privacybeleid">privacybeleid</Link>.
    </p>
  );
}
