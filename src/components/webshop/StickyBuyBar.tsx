'use client';
import React, { useEffect, useRef, useState } from 'react';
import { formatPrice } from '@/lib/catalog';
import { addToCart } from '@/lib/cart';

/**
 * The compact buy bar that follows you down the page.
 *
 * On a phone the price and the button scroll out of view after the first
 * screen, and everything below — specifications, fitment, what is in the box —
 * is exactly the reading a customer does before deciding. Every large shop
 * keeps a thumbnail, the price and one button in reach for that reason; ours
 * had nothing, so buying meant scrolling back to the top.
 *
 * It appears only once the real button has left the screen, so the two are
 * never on screen together.
 */
export default function StickyBuyBar({
  slug,
  title,
  image,
  price,
  inStock = true,
  watchId = 'buy-cta',
}: {
  slug: string;
  title: string;
  image: string;
  price: number | null;
  inStock?: boolean;
  /** The element whose visibility decides whether this bar is shown. */
  watchId?: string;
}) {
  const [visible, setVisible] = useState(false);
  const [added, setAdded] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const target = document.getElementById(watchId);
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Only once the button is above the viewport — not when the page is
        // still loading and everything is technically off screen below.
        setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [watchId]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const handleAdd = () => {
    addToCart(slug);
    setAdded(true);
    timer.current = window.setTimeout(() => setAdded(false), 2200);
  };

  if (price == null) return null;

  return (
    <div className={`shop-sticky-buy${visible ? ' is-visible' : ''}`} aria-hidden={!visible}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt="" className="shop-sticky-buy-img" />

      <div className="shop-sticky-buy-text">
        <span className="shop-sticky-buy-title">{title}</span>
        <span className="shop-sticky-buy-price">{formatPrice(price)}</span>
      </div>

      <button
        type="button"
        onClick={handleAdd}
        disabled={!inStock}
        className="shop-sticky-buy-btn"
        tabIndex={visible ? 0 : -1}
      >
        {!inStock ? 'Uitverkocht' : added ? 'Toegevoegd ✓' : 'In winkelmand'}
      </button>
    </div>
  );
}
