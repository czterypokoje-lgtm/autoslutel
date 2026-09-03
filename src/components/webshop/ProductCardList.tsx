import React from 'react';
import Link from 'next/link';
import { slugify } from '@/lib/utils';
import { FREE_SHIPPING_FROM } from '@/lib/catalog';

/**
 * One product in a list view.
 *
 * This card arrived as a template and kept the template's contents: a "Top
 * seller" badge on every product, "Best of 2026", "High quality OEM
 * replacement part" on aftermarket parts, a permanent "In stock", a colour
 * picker with three swatches for products that have no colours, three bullet
 * points about key housings shown on batteries, and an "Open Box €x / Scratch
 * & Dent €y" block whose prices were the real price times 0.85 and 0.8 —
 * conditions this shop does not sell.
 *
 * All of it was a claim to a customer, and none of it was true. Everything
 * below is either passed in from the catalogue or not shown at all. This is
 * the same clean-up that removed the invented reviews and certificates from
 * this site (BW 6:193c).
 */

interface ProductCardProps {
  title: string;
  category: string;
  price: string;
  oldPrice?: string;
  img: string;
  isBestOf?: boolean;
  /**
   * The catalogue's own slug. Without it the link is rebuilt from the title,
   * which only matches when the displayed title happens to be the one the slug
   * was generated from — for a translated title it does not, and the link
   * lands on a 404.
   */
  slug?: string;
  /** One line under the title, from the product's own description. */
  subtitle?: string;
  /** Label/value pairs to show as bullets: make, frequency, transponder. */
  specs?: [string, string][];
  /** Only known when the office tracks stock for this product. */
  inStock?: boolean | null;
}

export default function ProductCard({
  title,
  category,
  price,
  oldPrice,
  img,
  slug,
  subtitle,
  specs = [],
  inStock = null,
}: ProductCardProps) {
  const href = `/webshop/product/${slug ?? slugify(title)}`;
  const amount = parseFloat(price);
  const reference = oldPrice ? parseFloat(oldPrice) : NaN;

  // A struck-through price is a claim that this was once the price.
  const hasReference =
    Number.isFinite(reference) && Number.isFinite(amount) && reference > amount;

  // The real rule from the catalogue, not a badge on everything.
  const freeShipping = Number.isFinite(amount) && amount >= FREE_SHIPPING_FROM;

  return (
    <div className="shop-list-card">
      {/* Image */}
      <div className="shop-list-card-media">
        <Link href={href} style={{ display: 'flex', width: '100%', justifyContent: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} alt={title} style={{ width: '100%', maxWidth: '220px', objectFit: 'contain' }} />
        </Link>
      </div>

      {/* Details */}
      <div className="shop-list-card-body">
        <Link href={href} style={{ textDecoration: 'none', color: '#0f172a' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.25rem' }}>{title}</h2>
        </Link>

        {subtitle && (
          <div style={{ fontSize: '0.95rem', color: '#475569', marginBottom: '0.6rem', lineHeight: 1.5 }}>
            {subtitle}
          </div>
        )}

        <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.6rem' }}>{category}</div>

        {/* Only when the office actually tracks stock for this product. */}
        {inStock === false && (
          <div style={{ color: '#9d201c', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.6rem' }}>
            Tijdelijk uitverkocht
          </div>
        )}

        {specs.length > 0 && (
          <ul
            style={{
              paddingLeft: '1.1rem',
              margin: 0,
              color: '#0f172a',
              fontSize: '0.85rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.3rem',
              listStyleType: 'disc',
            }}
          >
            {specs.slice(0, 4).map(([label, value]) => (
              <li key={label}>
                <span style={{ color: '#475569' }}>{label}:</span> {value}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Price */}
      <div className="shop-list-card-price">
        {freeShipping && (
          <div style={{ fontSize: '0.8rem', color: '#334155', fontWeight: 600, marginBottom: '0.5rem' }}>
            Gratis verzending
          </div>
        )}

        {hasReference && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginBottom: '0.25rem' }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b', textDecoration: 'line-through' }}>
              €{oldPrice}
            </div>
            <div style={{ background: '#16a34a', color: '#fff', fontSize: '0.75rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '4px', marginTop: '0.2rem' }}>
              Bespaar €{(reference - amount).toFixed(2)}
            </div>
          </div>
        )}

        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem', letterSpacing: '-0.5px' }}>
          €{price}
        </div>

        {/*
          * A link, not a button. The old "Add to cart" button did nothing at
          * all — a dead primary action on every card in every list.
          */}
        <Link
          href={href}
          style={{
            width: '100%',
            background: '#c2410c',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            fontWeight: 700,
            fontSize: '0.9rem',
            padding: '0.7rem 0',
            textAlign: 'center',
            textDecoration: 'none',
          }}
        >
          Bekijken
        </Link>
      </div>
    </div>
  );
}
