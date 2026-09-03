'use client';

import React, { useState, useSyncExternalStore, useCallback } from 'react';
import Link from 'next/link';
import { readCart, priceCart, clearCart, CART_EVENT, SERVICE_LABEL } from '@/lib/cart';
import { formatPrice } from '@/lib/catalog';
import type { CatalogProduct } from '@/lib/catalog';

type Slim = Pick<CatalogProduct, 'slug' | 'titleNl' | 'costPrice' | 'image' | 'category'>;

let cache: ReturnType<typeof readCart> = [];
let loaded = false;
function subscribe(cb: () => void) {
  const h = () => { cache = readCart(); loaded = true; cb(); };
  window.addEventListener(CART_EVENT, h);
  return () => window.removeEventListener(CART_EVENT, h);
}
function snapshot() { if (!loaded) { cache = readCart(); loaded = true; } return cache; }
const serverSnapshot = () => [] as ReturnType<typeof readCart>;

/**
 * Checkout.
 *
 * Guest checkout only — in this category a customer buys about once a year, so
 * forcing an account before payment costs more orders than it saves.
 *
 * The totals shown here are recalculated on the server before the payment is
 * created; nothing the browser sends can change what is charged.
 */
export default function CheckoutForm({ products }: { products: Slim[] }) {
  const lines = useSyncExternalStore(subscribe, snapshot, serverSnapshot);

  const lookup = useCallback(
    (slug: string) => {
      const p = products.find((x) => x.slug === slug);
      return p ? { titleNl: p.titleNl, costPrice: p.costPrice, image: p.image, category: p.category } : undefined;
    },
    [products]
  );
  const totals = priceCart(lines, lookup);
  const needsTechnician = totals.lines.some((l) => l.service === 'mobile_tech');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState('');

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lines,
          company: honeypot,
          name: fd.get('name'),
          email: fd.get('email'),
          phone: fd.get('phone'),
          street: fd.get('street'),
          postcode: fd.get('postcode'),
          city: fd.get('city'),
          kenteken: fd.get('kenteken'),
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? 'Er ging iets mis. Probeer het opnieuw.');
        setBusy(false);
        return;
      }
      if (json.checkoutUrl) {
        clearCart();
        window.location.href = json.checkoutUrl;
        return;
      }
      setError('De betaling kon niet worden gestart.');
      setBusy(false);
    } catch {
      setError('Netwerkfout. Controleer uw verbinding en probeer het opnieuw.');
      setBusy(false);
    }
  }

  if (!totals.lines.length) {
    return (
      <p style={{ color: '#475569' }}>
        Uw winkelmand is leeg. <Link href="/webshop/catalogus" style={{ color: '#b93c20', fontWeight: 700 }}>Naar de catalogus</Link>
      </p>
    );
  }

  const field: React.CSSProperties = {
    width: '100%', padding: '.7rem .8rem', border: '1.5px solid #cbd5e1',
    borderRadius: 8, fontSize: '1rem', fontFamily: 'inherit',
  };
  const label: React.CSSProperties = {
    display: 'block', fontSize: '.82rem', fontWeight: 600, color: '#334155', marginBottom: '.3rem',
  };

  return (
    <form onSubmit={submit} className="shop-split-grid">
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1.25rem', display: 'grid', gap: '.9rem' }}>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Uw gegevens</h2>

        <label><span style={label}>Naam *</span><input name="name" required autoComplete="name" style={field} /></label>
        <label><span style={label}>E-mailadres *</span><input name="email" type="email" required autoComplete="email" style={field} /></label>
        <label><span style={label}>Telefoonnummer</span><input name="phone" type="tel" autoComplete="tel" style={field} /></label>
        <label><span style={label}>Straat en huisnummer *</span><input name="street" required autoComplete="street-address" style={field} /></label>

        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '.9rem' }}>
          <label><span style={label}>Postcode *</span><input name="postcode" required autoComplete="postal-code" placeholder="1011 AB" style={field} /></label>
          <label><span style={label}>Plaats *</span><input name="city" required autoComplete="address-level2" style={field} /></label>
        </div>

        {needsTechnician && (
          <div style={{ background: '#fdf6e3', border: '1px solid #f0d9a0', borderRadius: 9, padding: '.9rem 1rem' }}>
            <p style={{ margin: '0 0 .6rem', fontSize: '.87rem', color: '#7a5a06', lineHeight: 1.55 }}>
              U heeft gekozen voor een monteurbezoek. Wij hebben uw kenteken nodig
              om de juiste sleutel voor te bereiden.
            </p>
            <label><span style={label}>Kenteken *</span><input name="kenteken" required placeholder="XX-XXX-X" style={{ ...field, textTransform: 'uppercase' }} /></label>
          </div>
        )}

        {/* Honeypot — hidden from people, tempting to bots. */}
        <input
          type="text" name="company" value={honeypot} tabIndex={-1} autoComplete="off" aria-hidden="true"
          onChange={(e) => setHoneypot(e.target.value)}
          style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0 }}
        />

        <p style={{ fontSize: '.78rem', color: '#64748b', margin: 0, lineHeight: 1.6 }}>
          Door te bestellen gaat u akkoord met onze{' '}
          <Link href="/algemene-voorwaarden">algemene voorwaarden</Link> en{' '}
          <Link href="/privacybeleid">privacybeleid</Link>. U heeft 14 dagen
          herroepingsrecht.
        </p>
      </div>

      <aside style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1.25rem', position: 'sticky', top: 20 }}>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '.9rem', color: '#0f172a' }}>Uw bestelling</h2>

        <ul style={{ listStyle: 'none', margin: '0 0 .9rem', padding: 0, display: 'grid', gap: '.55rem', fontSize: '.85rem' }}>
          {totals.lines.map((l) => (
            <li key={`${l.slug}-${l.service}`} style={{ display: 'flex', justifyContent: 'space-between', gap: '.75rem' }}>
              <span style={{ color: '#334155' }}>
                {l.quantity}× {l.title}
                <br />
                <span style={{ color: '#64748b', fontSize: '.78rem' }}>{SERVICE_LABEL[l.service]}</span>
              </span>
              <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{formatPrice(l.lineTotal)}</span>
            </li>
          ))}
        </ul>

        <dl style={{ margin: 0, display: 'grid', gap: '.4rem', fontSize: '.88rem', borderTop: '1px solid #e5e7eb', paddingTop: '.7rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <dt style={{ color: '#475569' }}>Verzending</dt>
            <dd style={{ margin: 0 }}>{totals.shipping === 0 ? 'Gratis' : formatPrice(totals.shipping)}</dd>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>
            <dt>Totaal</dt>
            <dd style={{ margin: 0 }}>{formatPrice(totals.totalInc)}</dd>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.76rem', color: '#64748b' }}>
            <dt>waarvan btw (21%)</dt>
            <dd style={{ margin: 0 }}>{formatPrice(totals.totalVat)}</dd>
          </div>
        </dl>

        {error && (
          <p role="alert" style={{ marginTop: '.9rem', background: '#fbe9e6', border: '1px solid #f0bdb2', color: '#a01f16', borderRadius: 8, padding: '.7rem .8rem', fontSize: '.85rem', lineHeight: 1.55 }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          style={{ width: '100%', marginTop: '1rem', background: busy ? '#c3cedb' : '#b93c20', color: '#fff', border: 'none', padding: '.9rem 1rem', borderRadius: 9, fontWeight: 700, fontSize: '1rem', cursor: busy ? 'not-allowed' : 'pointer' }}
        >
          {busy ? 'Bezig…' : 'Naar betalen'}
        </button>

        <p style={{ marginTop: '.7rem', fontSize: '.75rem', color: '#64748b', textAlign: 'center' }}>
          Betalen met iDEAL, creditcard of Bancontact
        </p>
      </aside>
    </form>
  );
}
