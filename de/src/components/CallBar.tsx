import { SITE, isReady } from '@/config/site';

/**
 * Anrufen und Kontakt, am unteren Bildschirmrand, nur auf dem Telefon.
 *
 * Wer seinen Schlüssel verloren hat, steht neben dem Auto und hält ein Handy
 * in der Hand. Dann ist die Telefonnummer das Interface und nicht das Menü.
 */
export default function CallBar() {
  if (!isReady(SITE.phone)) return null;
  return (
    <div className="call-bar">
      <a className="btn btn-primary" href={`tel:${SITE.phoneTel}`}>
        Jetzt anrufen
      </a>
      {isReady(SITE.whatsapp) && (
        <a
          className="btn btn-ghost"
          style={{ color: 'var(--frost)' }}
          href={`https://wa.me/${SITE.whatsapp}`}
          rel="noopener noreferrer"
          target="_blank"
        >
          WhatsApp
        </a>
      )}
    </div>
  );
}
