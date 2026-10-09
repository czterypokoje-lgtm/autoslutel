import { missingFields, siteIsReady } from '@/config/site.config';

/**
 * Das Band, das eine Vorschau als Vorschau kennzeichnet.
 *
 * Es gehört oben auf die Seite und nicht in ein Logfile: eine halbfertige
 * Seite, die fertig aussieht, wird irgendwann jemandem gezeigt und dann
 * freigegeben. Hier steht namentlich, was noch fehlt.
 *
 * An dieselbe Prüfung gekoppelt wie das noindex im Layout und das Disallow in
 * robots.ts — sobald die Konfiguration vollständig ist, verschwinden alle drei
 * gemeinsam, ohne dass jemand daran denken muss.
 */
export default function PreviewBanner() {
  if (siteIsReady()) return null;
  const missing = missingFields();
  return (
    <div
      role="status"
      style={{
        background: '#2b1a00',
        color: '#ffd9c2',
        borderBottom: '2px solid #ff6a2b',
        padding: '0.65rem 16px',
        fontSize: '0.875rem',
        lineHeight: 1.5,
        textAlign: 'center',
      }}
    >
      <strong>Vorschau — nicht veröffentlichen.</strong> Es fehlen noch{' '}
      {missing.length} Angabe{missing.length === 1 ? '' : 'n'}:{' '}
      {missing.slice(0, 5).join(', ')}
      {missing.length > 5 ? ` und ${missing.length - 5} weitere` : ''}. Diese Seite
      steht auf noindex, solange das so ist.
    </div>
  );
}
