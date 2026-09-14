'use client';

import React, { useEffect, useState } from 'react';

const KEY = 'wishlist';

function readWishlist(): string[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeWishlist(slugs: string[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(slugs));
  } catch {
    // Private browsing or a full quota — the click still worked visually,
    // it just won't survive a reload. Not worth interrupting the customer.
  }
}

/**
 * A wishlist that actually remembers, not a heart that just changes colour.
 *
 * There is no customer-account system on this site, so "saved" means saved
 * in this browser, on this device — the honest scope for a shop with no
 * login. Read fresh on mount rather than trusted from a server prop, since
 * the state lives entirely on the client.
 */
export default function WishlistHeart({ slug, title }: { slug: string; title: string }) {
  // localStorage doesn't exist during the server render of this client
  // component, so the saved state can only be known once mounted — an
  // effect is the correct place for that, not a lint violation to work
  // around, hence the scoped disable rather than restructuring around it.
  const [state, setState] = useState({ saved: false, ready: false });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ saved: readWishlist().includes(slug), ready: true });
  }, [slug]);
  const { saved, ready } = state;

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const current = readWishlist();
    const next = current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug];
    writeWishlist(next);
    setState({ saved: next.includes(slug), ready: true });
  }

  return (
    <button
      type="button"
      className={`shop-wishlist-heart ${saved ? 'shop-wishlist-heartOn' : ''}`}
      onClick={toggle}
      aria-pressed={saved}
      aria-label={saved ? `${title} verwijderen uit favorieten` : `${title} bewaren als favoriet`}
      // Avoids a flash of the wrong state between server render and hydration.
      style={{ visibility: ready ? 'visible' : 'hidden' }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
