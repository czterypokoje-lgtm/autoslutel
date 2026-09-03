'use client';

import React, { useSyncExternalStore, useCallback } from 'react';
import Link from 'next/link';
import {
  readCart, setQuantity, removeLine, priceCart,
  CART_EVENT, SERVICE_LABEL, type ServiceOption,
} from '@/lib/cart';
import { formatPrice, FREE_SHIPPING_FROM } from '@/lib/catalog';
import type { CatalogProduct } from '@/lib/catalog';

/**
 * Basket contents.
 *
 * The catalogue is passed in from the server as a slim lookup rather than
 * imported here, so the 2 MB catalogue never reaches the browser bundle.
 */

type Slim = Pick<CatalogProduct, 'slug' | 'titleNl' | 'costPrice' | 'image' | 'category'>;

let cache: ReturnType<typeof readCart> = [];
let loaded = false;

function subscribe(cb: () => void) {
  const h = () => { cache = readCart(); loaded = true; cb(); };
  window.addEventListener(CART_EVENT, h);
  return () => window.removeEventListener(CART_EVENT, h);
}
function snapshot() {
  if (!loaded) { cache = readCart(); loaded = true; }
  return cache;
}
// localStorage does not exist during SSR, so the basket is read through an
// external store rather than an effect + setState.
const serverSnapshot = () => [] as ReturnType<typeof readCart>;

export default function CartView({ products }: { products: Slim[] }) {
  const lines = useSyncExternalStore(subscribe, snapshot, serverSnapshot);

  const lookup = useCallback(
    (slug: string) => {
      const p = products.find((x) => x.slug === slug);
      return p
        ? { titleNl: p.titleNl, costPrice: p.costPrice, image: p.image, category: p.category }
        : undefined;
    },
    [products]
  );

  const totals = priceCart(lines, lookup);

  if (!totals.lines.length) {
    return (
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '2.5rem 1.5rem', textAlign: 'center' }}>
        <p style={{ fontWeight: 700, color: '#0f172a', marginBottom: '.4rem' }}>Uw winkelmand is leeg</p>
        <p style={{ color: '#475569', fontSize: '.9rem', marginBottom: '1.25rem' }}>
          Zoek het onderdeel dat op uw auto past — filter op kenteken of automerk.
        </p>
        <Link href="/webshop/catalogus" style={{ background: '#b93c20', color: '#fff', padding: '.7rem 1.4rem', borderRadius: 8, textDecoration: 'none', fontWeight: 700 }}>
          Naar de catalogus
        </Link>
      </div>
    );
  }

  const toGo = Math.max(0, FREE_SHIPPING_FROM - totals.subtotalInc);

  return (
    <div className="shop-split-grid">
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '.75rem' }}>
        {totals.lines.map((l) => (
          <li key={`${l.slug}-${l.service}`} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1rem', display: 'flex', gap: '1rem' }}>
            <div style={{ width: 78, height: 78, flex: '0 0 78px', background: '#f8fafc', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {l.image && <img src={l.image} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <Link href={`/webshop/product/${l.slug}`} style={{ fontWeight: 700, color: '#0f172a', textDecoration: 'none', lineHeight: 1.35 }}>
                {l.title}
              </Link>

              <div style={{ fontSize: '.82rem', color: '#475569', marginTop: '.3rem' }}>
                {SERVICE_LABEL[l.service]}
                {l.serviceSurcharge > 0 && ` — ${formatPrice(l.serviceSurcharge)}`}
              </div>

              {l.requiresProgramming && l.service === 'product_only' && (
                <div style={{ marginTop: '.5rem', background: '#fdf6e3', border: '1px solid #f0d9a0', borderRadius: 7, padding: '.5rem .65rem', fontSize: '.8rem', color: '#7a5a06', lineHeight: 1.5 }}>
                  Let op: deze sleutel moet nog op uw auto worden ingeleerd. Zonder
                  programmering opent hij wel, maar start de auto niet.
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginTop: '.6rem' }}>
                <label style={{ fontSize: '.82rem', color: '#475569' }}>
                  Aantal{' '}
                  <select
                    value={l.quantity}
                    onChange={(e) => setQuantity(l.slug, l.service as ServiceOption, Number(e.target.value))}
                    style={{ padding: '.25rem .4rem', border: '1px solid #cbd5e1', borderRadius: 6 }}
                  >
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => removeLine(l.slug, l.service as ServiceOption)}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#b93c20', textDecoration: 'underline', cursor: 'pointer', fontSize: '.82rem' }}
                >
                  Verwijderen
                </button>
              </div>
            </div>

            <div style={{ fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap' }}>
              {formatPrice(l.lineTotal)}
            </div>
          </li>
        ))}
      </ul>

      <aside style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1.25rem', position: 'sticky', top: 20 }}>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '.9rem', color: '#0f172a' }}>Overzicht</h2>

        <dl style={{ margin: 0, display: 'grid', gap: '.45rem', fontSize: '.9rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <dt style={{ color: '#475569' }}>Subtotaal</dt>
            <dd style={{ margin: 0, fontWeight: 600 }}>{formatPrice(totals.subtotalInc)}</dd>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <dt style={{ color: '#475569' }}>Verzending</dt>
            <dd style={{ margin: 0, fontWeight: 600 }}>
              {totals.shipping === 0 ? 'Gratis' : formatPrice(totals.shipping)}
            </dd>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e5e7eb', paddingTop: '.55rem', marginTop: '.25rem' }}>
            <dt style={{ fontWeight: 800, color: '#0f172a' }}>Totaal</dt>
            <dd style={{ margin: 0, fontWeight: 800, fontSize: '1.15rem', color: '#0f172a' }}>
              {formatPrice(totals.totalInc)}
            </dd>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.78rem', color: '#64748b' }}>
            <dt>waarvan btw (21%)</dt>
            <dd style={{ margin: 0 }}>{formatPrice(totals.totalVat)}</dd>
          </div>
        </dl>

        {toGo > 0 && (
          <p style={{ marginTop: '.9rem', fontSize: '.8rem', color: '#1a6242', background: '#e0f0e7', borderRadius: 7, padding: '.5rem .65rem' }}>
            Nog {formatPrice(toGo)} tot gratis verzending.
          </p>
        )}

        <Link
          href="/webshop/afrekenen"
          style={{ display: 'block', textAlign: 'center', marginTop: '1rem', background: '#b93c20', color: '#fff', padding: '.85rem 1rem', borderRadius: 9, textDecoration: 'none', fontWeight: 700 }}
        >
          Afrekenen
        </Link>

        <Link href="/webshop/catalogus" style={{ display: 'block', textAlign: 'center', marginTop: '.6rem', fontSize: '.85rem', color: '#475569' }}>
          Verder winkelen
        </Link>
      </aside>
    </div>
  );
}
