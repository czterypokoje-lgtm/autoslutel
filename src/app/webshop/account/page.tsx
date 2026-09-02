import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Inloggen Vakhandel | Autosleutel24',
};

export default function AccountPage() {
  return (
    <div style={{ maxWidth: 480, margin: '4rem auto', padding: '0 1.25rem', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
        Vakhandel Login
      </h1>
      <p style={{ color: '#475569', marginBottom: '2rem' }}>
        Log in om uw bestellingen te bekijken en toegang te krijgen tot B2B-producten (zoals programmeerapparatuur en Lishi tools).
      </p>

      <form
        style={{
          background: '#fff',
          padding: '2rem',
          borderRadius: 16,
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          textAlign: 'left'
        }}
      >
        <div>
          <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.4rem' }}>
            KVK Nummer of E-mailadres
          </label>
          <input
            type="text"
            placeholder="Bijv. 12345678"
            style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '1rem' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.4rem' }}>
            Wachtwoord
          </label>
          <input
            type="password"
            placeholder="••••••••"
            style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '1rem' }}
          />
        </div>
        
        <button
          type="button"
          style={{
            background: '#b93c20',
            color: '#fff',
            fontWeight: 700,
            fontSize: '1.1rem',
            padding: '0.8rem',
            borderRadius: 8,
            border: 'none',
            cursor: 'pointer',
            marginTop: '0.5rem'
          }}
        >
          Inloggen
        </button>

        <p style={{ fontSize: '0.85rem', color: '#64748b', textAlign: 'center', marginTop: '1rem' }}>
          Consument? U heeft geen account nodig om te bestellen. <Link href="/webshop/catalogus" style={{ color: '#b93c20', fontWeight: 600 }}>Ga naar de catalogus</Link>.
        </p>
      </form>
    </div>
  );
}
