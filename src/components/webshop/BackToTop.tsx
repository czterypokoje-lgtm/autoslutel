'use client';
import React, { useEffect, useState } from 'react';

/**
 * "Naar boven" on a long page.
 *
 * A product page runs about six screens on a phone — photos, specifications,
 * fitment, what is in the box, the comparison table — and the only way back to
 * the price was to swipe all of it. It appears after two screens of scrolling
 * and sits above the sticky buy bar.
 */
export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 1400);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      type="button"
      className={`shop-to-top${visible ? ' is-visible' : ''}`}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      onClick={() =>
        window.scrollTo({
          top: 0,
          // Respect the viewer's motion setting rather than always animating.
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ? 'auto'
            : 'smooth',
        })
      }
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
        <polyline points="18 15 12 9 6 15" />
      </svg>
      <span>Naar boven</span>
    </button>
  );
}
