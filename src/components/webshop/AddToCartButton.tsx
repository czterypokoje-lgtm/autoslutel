'use client';
import React, { useEffect, useRef, useState } from 'react';
import { addToCart } from '@/lib/cart';

/**
 * "In winkelmand" straight from a list.
 *
 * Search results and the catalogue only offered "Bekijken", so ordering four
 * housings meant four product pages and four journeys back. The list already
 * shows everything the decision needs — photo, price, frequency, transponder —
 * and every parts shop lets you buy from it.
 */
export default function AddToCartButton({
  slug,
  disabled = false,
  variant = 'solid',
}: {
  slug: string;
  disabled?: boolean;
  /** `solid` is the primary action; `outline` sits next to another button. */
  variant?: 'solid' | 'outline';
}) {
  const [added, setAdded] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const handleClick = () => {
    if (disabled) return;
    addToCart(slug);
    setAdded(true);
    timer.current = window.setTimeout(() => setAdded(false), 2200);
  };

  const solid = variant === 'solid';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      style={{
        width: '100%',
        background: disabled ? '#e2e8f0' : added ? '#15803d' : solid ? '#c2410c' : '#fff',
        color: disabled ? '#94a3b8' : added || solid ? '#fff' : '#c2410c',
        border: solid ? 'none' : '1px solid #c2410c',
        borderRadius: 4,
        fontWeight: 700,
        fontSize: '0.9rem',
        padding: '0.7rem 0',
        cursor: disabled ? 'default' : 'pointer',
        // A thumb needs 44px; 0.7rem padding on a 0.9rem label gives just that.
        minHeight: 44,
      }}
    >
      {disabled ? 'Uitverkocht' : added ? 'Toegevoegd ✓' : 'In winkelmand'}
    </button>
  );
}
