import { missingFields, siteIsReady } from '@/config/site';

/**
 * Das Band, das eine Vorschau als Vorschau kennzeichnet.
 *
 * Es gehört genau deshalb oben auf die Seite und nicht in ein Logfile: eine
 * halbfertige Seite, die fertig aussieht, wird irgendwann jemandem gezeigt und
 * dann freigegeben. Hier steht, was fehlt, und zwar namentlich.
 */
export default function PreviewBanner() {
  if (siteIsReady()) return null;
  const missing = missingFields();
  return (
    <div
      style={{
        background: '#2b1a00',
        color: '#ffd9c2',
        borderBottom: '2px solid var(--signal-orange)',
        padding: '0.65rem var(--gutter)',
        fontSize: '0.875rem',
        lineHeight: 1.5,
      }}
    >
      <strong>Vorschau — nicht veröffentlichen.</strong>{' '}
      {missing.length} Angabe{missing.length === 1 ? '' : 'n'} fehl
      {missing.length === 1 ? 't' : 'en'} noch
      {': '}
      {missing.slice(0, 6).join(', ')}
      {missing.length > 6 ? ` und ${missing.length - 6} weitere` : ''}. Diese Seite ist
      auf noindex gesetzt, solange das so ist.
    </div>
  );
}
