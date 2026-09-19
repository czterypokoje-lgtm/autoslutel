'use client';

import React, { useState } from 'react';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    oaiq?: ((...args: unknown[]) => void) & { q: unknown[][] };
  }
}

export default function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'succeeded' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('submitting');
    
    const form = e.currentTarget;
    const data = new FormData(form);

    // Also record the enquiry in Supabase alongside the Formspree email, so
    // every lead lands in one table regardless of which form produced it.
    // Fire-and-forget: an analytics write must never block the customer.
    const getCookie = (name: string) => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? match[2] : null;
    };
    fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.get('name'),
        phone: data.get('phone'),
        email: data.get('email'),
        model: data.get('car'),
        service: 'Contactformulier',
        location: data.get('message'),
        source: 'contact_form',
        gclid: getCookie('gclid'),
        wbraid: getCookie('wbraid'),
        gbraid: getCookie('gbraid'),
      }),
      keepalive: true,
    }).catch(err => console.error('Error saving lead', err));

    try {
      const response = await fetch('https://formspree.io/f/mgavvqvd', {
        method: 'POST',
        body: data,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        setStatus('succeeded');
        form.reset();

        /*
         * A real conversion event, fired directly — not left to GTM's
         * automatic Form Submission trigger, which listens for the native
         * `submit` event but this handler already called preventDefault()
         * and never navigates. That trigger is built for a form that
         * posts and reloads; this one never does, so relying on it is how a
         * form that works perfectly can still show zero conversions.
         *
         * email/phone_number ride along for Google Ads' "Enhanced
         * conversions for leads" — GTM's own tag hashes them before
         * anything leaves the browser, this just has to hand them over. Only
         * sent on a real, successful submission, and only what the visitor
         * just typed into this form themselves.
         */
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: 'contact_form_submit',
          email: data.get('email') || undefined,
          phone_number: data.get('phone') || undefined,
        });
        if (typeof window.gtag === 'function') {
          window.gtag('event', 'generate_lead', { event_category: 'contact_form' });
        }
        window.oaiq?.('track', 'lead_created', { content_name: 'contact_form' });
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
