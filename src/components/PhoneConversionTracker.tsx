'use client';
import { useEffect } from 'react';
import { captureAdClickIdFromUrl, readAdClickId } from '@/lib/adClickId';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    uetq?: unknown[];
    oaiq?: ((...args: unknown[]) => void) & { q: unknown[][] };
  }
}

export default function PhoneConversionTracker() {
  // If this landing carries an ad click id, remember it — a phone call from
  // this visitor never touches /api/leads, so this is the only place that id
  // can be captured before it's gone. See src/lib/adClickId.ts.
  useEffect(() => {
    captureAdClickIdFromUrl();
  }, []);

  useEffect(() => {
    const handlePhoneClick = (e: MouseEvent) => {
      const target = (e.target as Element).closest('a');
      if (!target || !target.href) return;

      const isTel = target.href.startsWith('tel:');
      const isWhatsApp = target.href.startsWith('https://wa.me') || target.href.includes('/whatsapp') || target.href.startsWith('https://api.whatsapp.com');

      if (!isTel && !isWhatsApp) return;

      // Prevent immediate navigation so the tracking beacon has time to fire
      e.preventDefault();
      const destination = target.href;

      // 1. DataLayer for GTM
      window.dataLayer = window.dataLayer || [];
      if (isTel) {
        window.dataLayer.push({ event: 'click_to_call', link_url: destination });
      } else {
        window.dataLayer.push({ event: 'click_to_whatsapp', link_url: destination });
      }

      // 2. Direct Google Ads Conversion Ping (Guaranteed!)
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'conversion', {
          'send_to': 'AW-18315813515/FoiPCLLl7NocEIvF1J1E'
        });
      }

      // 3. Microsoft UET
      window.uetq = window.uetq || [];
      window.uetq.push('event', isTel ? 'click_to_call' : 'click_to_whatsapp', { event_category: isTel ? 'phone' : 'whatsapp' });

      // 4. OpenAI Ads
      window.oaiq?.('track', 'lead_created', { content_name: isTel ? 'phone_call' : 'whatsapp_click' });

      // 5. Server-side fallback (survives an ad blocker dropping the client
      // pixels above) — also anonymously records the click id so a phone
      // call that never fills in the web form can still be attributed to a
      // completed job later. See src/lib/adClickId.ts.
      fetch('/api/track-call-conversion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceUrl: window.location.href, ...readAdClickId() }),
        keepalive: true,
      }).catch(() => {});

      // Proceed with navigation after 300ms to guarantee network request completion
      setTimeout(() => {
        window.location.href = destination;
      }, 300);
    };

    document.addEventListener('click', handlePhoneClick);
    return () => document.removeEventListener('click', handlePhoneClick);
  }, []);

  return null;
}
