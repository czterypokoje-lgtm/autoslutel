import React from 'react';

/*
 * Two claims here were not ours to make.
 *
 * "OEM Kwaliteit gegarandeerd" sat above a catalogue in which all 944 products
 * are aftermarket — A-Key's own listings say so, and several add "Kein
 * Renault-Originalschlüssel" in as many words. And "Voor 23:59 besteld, morgen
 * in huis" promised next-day delivery on stock we order in from Germany at 2-3
 * working days; the webshop menu was meanwhile promising two days, so the same
 * visitor was told two different things on one screen.
 */
export default function TrustBar() {
  return (
    <div className="webshop-trust-bar">
      <div className="webshop-trust-item">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        Aftermarket onderdelen — geen dealerprijzen
      </div>
      <div className="webshop-trust-item">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        1 jaar garantie
      </div>
      <div className="webshop-trust-item">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        30 dagen bedenktijd
      </div>
      <div className="webshop-trust-item">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
          <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
        Levertijd 2 - 3 werkdagen
      </div>
    </div>
  );
}
