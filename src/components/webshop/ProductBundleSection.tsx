'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { addToCart } from '@/lib/cart';
import { formatPrice } from '@/lib/catalog';

/**
 * "Vaak samen gekocht" — the battery that fits this key.
 *
 * What was here before offered three extras: a "Levenslange Garantie Plan"
 * (€6,95), a "RVS Magnetische Sleutelhanger" (€9,95) and the battery. Two of
 * the three are not products we sell, all three arrived pre-ticked, the yellow
 * banner promised "Bespaar 20%" that nothing anywhere applied, and the "IN
 * WINKELMAND" button did nothing at all.
 *
 * A pre-ticked box for a paid extra is prohibited outright — Richtlijn
 * 2011/83/EU art. 22, implemented in BW 6:230j: extra payments need the
 * customer's express consent, and consent cannot be assumed from a default.
 * The discount claim is a misleading practice under BW 6:193c for the same
 * reason the invented reviews and reference prices were removed.
 *
 * So: only the battery A-Key names for this key, looked up in our own
 * catalogue, unticked, at its real price — and the button writes to the
 * basket. Where the supplier names no cell type, nothing is offered.
 */

interface BatteryData {
  slug: string;
  title: string;
  price: number;
  image: string;
}

export default function ProductBundleSection({
  mainProductSlug,
  mainProductTitle,
  mainProductPrice,
  mainProductImage,
  batteryData,
  offerBatteryLink = false,
}: {
  mainProductSlug?: string;
  mainProductTitle: string;
  mainProductPrice: number;
  mainProductImage: string;
  batteryData: BatteryData | null;
  /** Show the battery category when this product is a key that takes one. */
  offerBatteryLink?: boolean;
}) {
  const [withBattery, setWithBattery] = useState(false);
  const [added, setAdded] = useState(false);

  /*
   * No battery is offered when the supplier does not name the cell type.
   * Guessing CR2032 — the most common — would be right most of the time, and
   * wrong for the customer who opens the key and finds a CR1620. Instead the
   * category is one tap away for a complete key.
   */
  if (!batteryData) {
    if (!offerBatteryLink) return null;
    return (
      <div style={{ marginTop: '2rem', border: '1px solid #e2e8f0', borderRadius: 8, padding: '1rem 1.25rem', display: 'flex', flexWrap: 'wrap', gap: '.5rem 1rem', alignItems: 'center' }}>
        <span style={{ fontSize: '.92rem', color: '#334155' }}>
          Batterij los nodig? Wij hebben alle knoopcellen op voorraad.
        </span>
        <Link href="/webshop/catalogus?category=batterijen" style={{ color: '#b93c20', fontWeight: 700, textDecoration: 'none', fontSize: '.92rem' }}>
          Bekijk batterijen →
        </Link>
      </div>
    );
  }

  const total = mainProductPrice + (withBattery ? batteryData.price : 0);

  const handleAdd = () => {
    if (mainProductSlug) addToCart(mainProductSlug);
    if (withBattery) addToCart(batteryData.slug);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);
  };

  return (
    <div style={{ marginTop: '3rem', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: '#111827', color: '#fff', textAlign: 'center', padding: '1rem', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '0.5px' }}>
        VAAK SAMEN GEKOCHT
      </div>

      <div style={{ border: '1px solid #e2e8f0', borderTop: 'none', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <img
            src={mainProductImage || '/images/product-placeholder.svg'}
            alt=""
            style={{ width: 70, height: 70, objectFit: 'contain' }}
          />
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#94a3b8' }}>+</div>
          <img
            src={batteryData.image || '/images/product-placeholder.svg'}
            alt=""
            style={{ width: 70, height: 70, objectFit: 'contain', opacity: withBattery ? 1 : 0.4 }}
          />

          <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.9rem', color: '#334155' }}>
              Totaal: <span style={{ fontWeight: 800, color: '#0f172a' }}>{formatPrice(total)}</span>
            </div>
            <button
              type="button"
              onClick={handleAdd}
              style={{
                background: added ? '#15803d' : '#111827',
                color: '#fff', border: 'none', padding: '0.55rem 1.1rem',
                fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                borderRadius: 2, whiteSpace: 'nowrap',
              }}
            >
              {added ? 'TOEGEVOEGD' : 'IN WINKELMAND'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: '#334155' }}>
            <input type="checkbox" checked readOnly style={{ width: 16, height: 16, accentColor: '#111827' }} />
            <span><strong>Dit artikel:</strong> {mainProductTitle}</span>
            <span style={{ color: '#64748b' }}>{formatPrice(mainProductPrice)}</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: '#334155', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={withBattery}
              onChange={() => setWithBattery((v) => !v)}
              style={{ width: 16, height: 16, accentColor: '#111827' }}
            />
            <span>{batteryData.title}</span>
            <span style={{ color: '#64748b' }}>{formatPrice(batteryData.price)}</span>
          </label>
        </div>
      </div>
    </div>
  );
}
