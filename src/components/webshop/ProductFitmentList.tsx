import React from 'react';
import Link from 'next/link';
import type { ShopProduct } from '@/lib/shopCatalog';

/**
 * "Past op deze auto's" — the models this part fits, from A-Key's own list.
 *
 * This is the question the customer came with, and until now the page answered
 * it with a brand name. A-Key states it per product:
 *
 *   geeignet für folgende Fahrzeuge: FIAT NEW DOBLO - FIORINO - GRANDE PUNTO
 *   - MITO - PEUGEOT BIPPER - TEPE - CITROEN NEMO - OPEL COMBO - FORD KA
 *
 * Grouped by make, because a list that mixes five makes reads as noise, and
 * each make links to that make's range — someone who finds this key through
 * their Opel Combo usually wants to see the rest of the Opel keys too.
 *
 * The closing line is deliberate: the list is the supplier's, not a promise
 * that it is exhaustive, and a customer with a car that is not named should
 * send us the kenteken rather than guess.
 */
export default function ProductFitmentList({ product }: { product: ShopProduct }) {
  /*
   * A-Key gives the build years on some lines ("Hyundai IX25 2017-2018") and
   * on others nothing at all. Where they are missing nothing is shown — an
   * invented range would be the one thing on this block a customer could act
   * on and be wrong about.
   */
  const label = ({ model, from, to }: { model: string; from: number; to: number }) => {
    if (!from || from < 1950) return model;
    // "2010–nu" reads as a promise that it still fits this year's car. A-Key
    // only wrote a start year; "vanaf 2010" says exactly that and no more.
    return to && to < 9000 ? `${model} ${from}–${to}` : `${model} vanaf ${from}`;
  };

  const byMake = new Map<string, string[]>();
  for (const entry of product.fitment) {
    if (!entry.model) continue;
    const list = byMake.get(entry.make) ?? [];
    const text = label(entry);
    if (!list.includes(text)) list.push(text);
    byMake.set(entry.make, list);
  }

  if (byMake.size === 0) return null;

  return (
    <section
      style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        padding: '1.25rem',
      }}
    >
      <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 .25rem' }}>
        Past op deze auto&apos;s
      </h2>
      <p style={{ fontSize: '.85rem', color: '#64748b', margin: '0 0 1rem' }}>
        Zoals opgegeven door de fabrikant.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
        {[...byMake.entries()].map(([make, models]) => (
          <div key={make}>
            <Link
              href={`/webshop/catalogus?make=${encodeURIComponent(make)}`}
              style={{ fontSize: '.9rem', fontWeight: 800, color: '#b93c20', textDecoration: 'none' }}
            >
              {make}
            </Link>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem', marginTop: '.4rem' }}>
              {models.map((model) => (
                <span
                  key={model}
                  style={{
                    background: '#f1f5f9',
                    borderRadius: 6,
                    padding: '.25rem .55rem',
                    fontSize: '.82rem',
                    color: '#0f172a',
                  }}
                >
                  {model}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p style={{ fontSize: '.82rem', color: '#475569', margin: '1rem 0 0', lineHeight: 1.5 }}>
        Staat uw model er niet bij, of twijfelt u?{' '}
        <Link href="/contact" style={{ color: '#b93c20' }}>Stuur ons uw kenteken</Link> — dan
        zoeken wij de juiste sleutel voor u op.
      </p>
    </section>
  );
}
