import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { SITE_CONFIG } from '@/config/site.config';

export const metadata: Metadata = {
  title: { absolute: 'Bedankt voor uw bestelling | Autosleutel24' },
  robots: { index: false, follow: false },
};

/**
 * Post-payment landing page.
 *
 * Deliberately does not claim the payment succeeded: Mollie redirects here for
 * every outcome, including cancelled and failed. The authoritative status
 * arrives on the webhook, so this page confirms receipt and nothing more.
 */
export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const order = Array.isArray(sp.order) ? sp.order[0] : sp.order;

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '3.5rem 1.25rem 5rem', textAlign: 'center' }}>
      <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0f172a', marginBottom: '.75rem' }}>
        Bedankt voor uw bestelling
      </h1>

      {order && (
        <p style={{ fontFamily: 'monospace', fontSize: '1.05rem', color: '#0f172a', background: '#f1f5f9', display: 'inline-block', padding: '.4rem .8rem', borderRadius: 7, marginBottom: '1.25rem' }}>
          {order}
        </p>
      )}

      <p style={{ color: '#475569', lineHeight: 1.7, marginBottom: '1.5rem' }}>
        Zodra uw betaling door de bank is bevestigd, ontvangt u een e-mail met de
        bevestiging en de factuur. Duurt dat langer dan een uur, bel ons gerust
        op <a href={`tel:${SITE_CONFIG.phoneTel}`} style={{ color: '#b93c20', fontWeight: 700 }}>{SITE_CONFIG.phone}</a>.
      </p>

      <Link href="/webshop/catalogus" style={{ color: '#b93c20', fontWeight: 700 }}>
        Verder winkelen
      </Link>
    </div>
  );
}
