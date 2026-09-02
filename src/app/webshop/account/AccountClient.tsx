'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loginB2B, logoutB2B } from './actions';

export default function AccountClient({ isB2B }: { isB2B: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const res = await loginB2B(password);
    if (res.success) {
      router.refresh(); // Reload to see server-side changes
    } else {
      setError(res.error || 'Er is een fout opgetreden.');
      setLoading(false);
    }
  }

  async function handleLogout() {
    setLoading(true);
    await logoutB2B();
    router.refresh();
  }

  if (isB2B) {
    return (
      <div style={{ maxWidth: 480, margin: '4rem auto', padding: '0 1.25rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
          Welkom, Vakhandel Partner
        </h1>
        <p style={{ color: '#475569', marginBottom: '2rem' }}>
          U bent succesvol ingelogd. U heeft nu toegang tot onze exclusieve B2B-producten (zoals programmeerapparatuur en Lishi tools) in de webshop.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Link href="/webshop/catalogus" style={{
            background: '#16a34a', color: '#fff', fontWeight: 700, fontSize: '1.1rem',
            padding: '1rem', borderRadius: 8, textDecoration: 'none'
          }}>
            Bekijk B2B Catalogus
          </Link>

          <button onClick={handleLogout} disabled={loading} style={{
            background: '#f1f5f9', color: '#0f172a', fontWeight: 600, fontSize: '1rem',
            padding: '0.8rem', borderRadius: 8, border: '1px solid #cbd5e1', cursor: 'pointer'
          }}>
            Uitloggen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480, margin: '4rem auto', padding: '0 1.25rem', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
        Vakhandel Login
      </h1>
      <p style={{ color: '#475569', marginBottom: '2rem' }}>
        Log in om toegang te krijgen tot B2B-producten (zoals programmeerapparatuur en Lishi tools).
      </p>

      <form
        onSubmit={handleLogin}
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
        {error && (
          <div style={{ padding: '0.75rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', borderRadius: 8, fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.4rem' }}>
            Toegangscode
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '1rem' }}
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          style={{
            background: '#b93c20', color: '#fff', fontWeight: 700, fontSize: '1.1rem',
            padding: '0.8rem', borderRadius: 8, border: 'none', cursor: 'pointer', marginTop: '0.5rem',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Laden...' : 'Inloggen'}
        </button>

        <p style={{ fontSize: '0.85rem', color: '#64748b', textAlign: 'center', marginTop: '1rem' }}>
          Consument? U heeft geen account nodig om te bestellen. <Link href="/webshop/catalogus" style={{ color: '#b93c20', fontWeight: 600 }}>Ga naar de catalogus</Link>.
        </p>
      </form>
    </div>
  );
}
