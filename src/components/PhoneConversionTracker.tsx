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

const SOURCE_KEY = 'as24_ad_source';
/** One tap is one event: a second click on the same link inside this window is ignored. */
const DEDUPE_MS = 2000;

type AdSource = { ad_source?: string; ad_medium?: string; ad_campaign?: string; ad_click_id_present?: boolean };

/**
 * Where this visit came from, kept for the whole visit. The first page carries the
 * utm_* parameters and the ad click id; later pages do not, so it is stored once
 * (sessionStorage, this tab only) and read back when the phone button is tapped.
 * Only labels and a yes/no for the click id are kept here — never the id itself.
 */
function rememberAdSource(): void {
  try {
    const params = new URLSearchParams(window.location.search);
    const found: AdSource = {};
    const source = params.get('utm_source');
    const medium = params.get('utm_medium');
    const campaign = params.get('utm_campaign');
    if (source) found.ad_source = source.slice(0, 80);
    if (medium) found.ad_medium = medium.slice(0, 80);
    if (campaign) found.ad_campaign = campaign.slice(0, 120);
    if (['gclid', 'wbraid', 'gbraid', 'msclkid'].some((k) => params.get(k))) found.ad_click_id_present = true;
    // First touch of the visit wins; a later page without parameters must not erase it.
    if (Object.keys(found).length && !sessionStorage.getItem(SOURCE_KEY)) {
      sessionStorage.setItem(SOURCE_KEY, JSON.stringify(found));
    }
  } catch {
    /* storage blocked: the event is still sent, just without the source labels */
  }
}

function readAdSource(): AdSource {
  try {
    const raw = sessionStorage.getItem(SOURCE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === 'object') return parsed as AdSource;
  } catch {
    /* ignore */
  }
  // Same page load, storage unavailable: fall back to the click id cookie's presence.
  return readAdClickId() ? { ad_click_id_present: true } : {};
}

export default function PhoneConversionTracker() {
  // If this landing carries an ad click id, remember it — a phone call from
  // this visitor never touches /api/leads, so this is the only place that id
  // can be captured before it's gone. See src/lib/adClickId.ts.
  useEffect(() => {
    captureAdClickIdFromUrl();
    rememberAdSource();
  }, []);

  useEffect(() => {
    const lastFired = new Map<string, number>();

    const handlePhoneClick = (e: MouseEvent) => {
      const target = (e.target as Element | null)?.closest?.('a');
      if (!target || !target.href) return;

      const isTel = target.href.startsWith('tel:');
      const isWhatsApp = target.href.startsWith('https://wa.me') || target.href.includes('/whatsapp') || target.href.startsWith('https://api.whatsapp.com');

      if (!isTel && !isWhatsApp) return;

      // Once per tap. A double tap, a click that reaches the document twice, or
      // two nested links must not count as two calls.
      const now = Date.now();
      const key = `${isTel ? 'tel' : 'wa'}:${target.href}`;
      if (now - (lastFired.get(key) ?? 0) < DEDUPE_MS) return;
      lastFired.set(key, now);

      // The link is left alone: a tel: link never unloads the page, so the
      // pings below finish on their own, and the call starts on the tap
      // itself (iOS can refuse a dial fired later from a timer).

      // 1. DataLayer for GTM. This is a phone-button tap, not a sale: no value,
      // no currency, no purchase event. Language and ad source ride along so the
      // visit's origin is not lost.
      const details = {
        link_url: target.href,
        page_language: document.documentElement.lang || 'nl',
        browser_language: navigator.language || undefined,
        ...readAdSource(),
      };
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: isTel ? 'click_to_call' : 'click_to_whatsapp', ...details });

      // 1b. Google Analytics 4, once. The GTM container (version 10) only carries the
      // Google tag config, a conversion linker and Clarity: nothing in it turns the
      // dataLayer event above into a GA4 event, so GA4 never saw a phone tap. Sent
      // straight to the GA4 property through the same consent mode as every other
      // Google tag. If a GA4 event tag for click_to_call is ever added in GTM, remove
      // this call, or every tap will be counted twice.
      if (typeof window.gtag === 'function') {
        window.gtag('event', isTel ? 'click_to_call' : 'click_to_whatsapp', {
          send_to: 'G-C4WR7TYCTV',
          transport_type: 'beacon',
          ...details,
        });
      }

      // 2. Direct Google Ads conversion ping, counted as one tap (no value).
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'conversion', {
          send_to: isTel
            ? 'AW-18315813515/FoiPCLLl7NocEIvF1J1E' // Click to call
            : 'AW-18315813515/eQj3CNPYoYwdEIvF1J1E', // WhatsApp click
          transport_type: 'beacon',
        });
      }

      // 3. Microsoft UET
      window.uetq = window.uetq || [];
      window.uetq.push('event', isTel ? 'click_to_call' : 'click_to_whatsapp', { event_category: isTel ? 'phone' : 'whatsapp' });

      // 4. OpenAI Ads
      window.oaiq?.('measure', 'lead_created', { type: 'customer_action' });

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
    };

    document.addEventListener('click', handlePhoneClick);
    return () => document.removeEventListener('click', handlePhoneClick);
  }, []);

  return null;
}
