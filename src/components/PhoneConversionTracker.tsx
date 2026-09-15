'use client';
import { useEffect } from 'react';

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

/**
 * Every tel: and WhatsApp link on the site, wherever it sits — the hero's
 * "Bel direct", the sticky call bar, a footer link — is caught by this one
 * document-level listener, so there is no "wrong button" to wire up
 * separately. It only ever pushes to the dataLayer and lets the click
 * proceed untouched.
 *
 * It used to also call a global gtag_report_conversion() directly, with
 * preventDefault() first and the actual dial only happening inside that
 * call's callback. That is backwards for a phone click: if the callback
 * never fires — and it silently stopped after the standalone gtag.js script
 * was removed in favour of GTM's own Google Tag — the click did nothing at
 * all, no call, no error, nothing to see in Tag Assistant either. A missed
 * conversion ping costs nothing; a customer who tapped "Bel direct" and
 * nothing happened costs the job.
 *
 * The actual Google Ads "Click to call" tag already exists in GTM,
 * correctly configured — it only needs a Custom Event trigger listening for
 * click_to_call, which this file has always sent. GTM does the reporting;
 * this file's only job is the dataLayer push and staying out of the way of
 * the click itself.
 */
export default function PhoneConversionTracker() {
  useEffect(() => {
    const handlePhoneClick = (e: MouseEvent) => {
      const target = (e.target as Element).closest('a');
      if (!target || !target.href) return;

      window.dataLayer = window.dataLayer || [];

      if (target.href.startsWith('tel:')) {
        window.dataLayer.push({ event: 'click_to_call', link_url: target.href });
      }

      if (
        target.href.startsWith('https://wa.me') ||
        target.href.includes('/whatsapp') ||
        target.href.startsWith('https://api.whatsapp.com')
      ) {
        window.dataLayer.push({ event: 'click_to_whatsapp', link_url: target.href });
      }
    };

    document.addEventListener('click', handlePhoneClick);
    return () => document.removeEventListener('click', handlePhoneClick);
  }, []);

  return null;
}
