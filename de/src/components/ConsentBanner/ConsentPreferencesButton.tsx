'use client';

import { openConsentPreferences } from '@/lib/consent';

/**
 * Footer control that reopens the consent panel.
 *
 * The AVG (art. 7 lid 3) requires withdrawing consent to be as easy as giving
 * it, so this has to stay reachable from every page.
 */
export default function ConsentPreferencesButton() {
  return (
    <button
      type="button"
      onClick={openConsentPreferences}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        fontSize: '0.75rem',
        color: 'rgba(255,255,255,0.55)',
        fontFamily: 'inherit',
        textDecoration: 'underline',
      }}
    >
      Cookie-instellingen
    </button>
  );
}
