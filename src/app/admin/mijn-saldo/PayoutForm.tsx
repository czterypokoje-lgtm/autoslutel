'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { requestPayout } from './actions';
import styles from '../vandaag/vandaag.module.css';

export default function PayoutForm({ availableBalance }: { availableBalance: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handlePayout() {
    if (availableBalance <= 0) return;
    
    setBusy(true);
    setError('');
    setSuccess('');

    const res = await requestPayout(availableBalance);
    if (res.error) {
      setError(res.error);
    } else {
      setSuccess('Uitbetaling succesvol aangevraagd!');
      router.refresh();
    }
    setBusy(false);
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      {error && <span style={{ color: '#ef4444', fontSize: '0.875rem' }}>{error}</span>}
      {success && <span style={{ color: '#10b981', fontSize: '0.875rem' }}>{success}</span>}
      <button 
        style={{
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          padding: '0.5rem 1rem',
          fontSize: '0.875rem',
          fontWeight: 500,
          cursor: busy || availableBalance <= 0 || !!success ? 'not-allowed' : 'pointer',
          opacity: busy || availableBalance <= 0 || !!success ? 0.5 : 1
        }}
        onClick={handlePayout} 
        disabled={busy || availableBalance <= 0 || !!success}
      >
        {busy ? 'Bezig...' : `€ ${availableBalance.toFixed(2).replace('.', ',')} Opnemen`}
      </button>
    </div>
  );
}
