'use client';

import React, { useState } from 'react';

export default function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'succeeded' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('submitting');
    
    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const response = await fetch('https://formspree.io/f/mdennjae', {
        method: 'POST',
        body: data,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        setStatus('succeeded');
        form.reset();
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    }
  };

  if (status === 'succeeded') {
    return (
      <div style={{ background: '#e6fffa', border: '1px solid #38b2ac', padding: '1.5rem', borderRadius: '8px', color: '#234e52', textAlign: 'center' }}>
        <h3 style={{ marginBottom: '0.5rem', color: '#2c7a7b' }}>Bedankt voor uw aanvraag!</h3>
        <p>We hebben uw bericht succesvol ontvangen. U ontvangt doorgaans binnen 15 minuten een reactie van onze monteur.</p>
        <button 
          onClick={() => setStatus('idle')} 
          style={{ background: 'transparent', border: '1px solid #38b2ac', padding: '0.5rem 1rem', borderRadius: '6px', color: '#2c7a7b', marginTop: '1rem', cursor: 'pointer', fontWeight: 600 }}
        >
          Nog een bericht sturen
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} id="contact-form">
      {[
        { id: 'name', label: 'Naam', type: 'text', placeholder: 'Uw naam' },
        { id: 'phone', label: 'Telefoonnummer', type: 'tel', placeholder: '06-XXXXXXXX' },
        { id: 'car', label: 'Automerk & Model', type: 'text', placeholder: 'bijv. BMW 3-serie 2019' },
        { id: 'email', label: 'E-mailadres', type: 'email', placeholder: 'uw@email.nl' },
      ].map((field) => (
        <div key={field.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <label htmlFor={field.id} style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{field.label}</label>
          <input
            id={field.id}
            name={field.id}
            type={field.type}
            placeholder={field.placeholder}
            required={field.id !== 'email'} 
            disabled={status === 'submitting'}
            style={{ padding: '0.75rem 1rem', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '0.95rem', outline: 'none', background: status === 'submitting' ? '#f3f4f6' : '#fff' }}
          />
        </div>
      ))}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <label htmlFor="message" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>Bericht / Situatie</label>
        <textarea
          id="message"
          name="message"
          rows={4}
          placeholder="Beschrijf uw situatie..."
          required
          disabled={status === 'submitting'}
          style={{ padding: '0.75rem 1rem', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '0.95rem', resize: 'vertical', outline: 'none', background: status === 'submitting' ? '#f3f4f6' : '#fff' }}
        />
      </div>

      {status === 'error' && (
        <div style={{ color: '#c53030', background: '#fff5f5', padding: '0.75rem', borderRadius: '6px', fontSize: '0.9rem', border: '1px solid #feb2b2' }}>
          Er is helaas iets misgegaan bij het versturen van uw bericht. Probeer het opnieuw of neem telefonisch contact op.
        </div>
      )}

      <button
        type="submit"
        id="contact-submit"
        disabled={status === 'submitting'}
        style={{ 
          background: status === 'submitting' ? '#9ca3af' : 'var(--color-primary)', 
          color: '#fff', 
          padding: '1rem', 
          borderRadius: '8px', 
          fontWeight: 700, 
          fontSize: '1rem', 
          border: 'none', 
          cursor: status === 'submitting' ? 'not-allowed' : 'pointer', 
          marginTop: '0.5rem',
          transition: 'background 0.2s'
        }}
      >
        {status === 'submitting' ? 'Bezig met verzenden...' : '📋 Offerte Aanvragen'}
      </button>
    </form>
  );
}
