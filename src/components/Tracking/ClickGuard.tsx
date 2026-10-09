'use client';

import { useEffect } from 'react';
import { readAdClickId } from '@/lib/adClickId';

/**
 * ClickGuard — click-fraud protection for the Google and Microsoft Ads spend.
 *
 * ClickGuard watches the paid clicks this site is billed for, and pushes the
 * IPs it judges fraudulent into the Ads account's exclusion list. It is the
 * bought counterpart to src/lib/clickFraud.ts, which scores the same landings
 * from our own /api/ad-visit signals; the two are independent on purpose, so a
 * verdict from one can be checked against the other.
 *
 * LOADED ONLY FOR AD VISITORS, and that is the whole design of this file.
 *
 * ClickGuard identifies a browser by a device id it stores in a cookie, so
 * under the Telecommunicatiewet art. 11.7a and the AVG it is not a tag that
 * may simply run on everyone the way Vercel Analytics does. The ground it does
 * stand on is art. 6(1)(f) — a gerechtvaardigd belang in not paying for
 * fraudulent clicks — and that interest only exists where a click was actually
 * paid for. An organic visitor's device id would buy nothing and justify
 * nothing, so their browser never contacts pulse.clickguard.com at all.
 *
 * Scoping it this way costs no protection: ClickGuard can only act on traffic
 * that arrived through an ad, which is exactly the traffic readAdClickId()
 * identifies. Gating it on marketing consent instead would have cost a great
 * deal — every visitor who declines or ignores the banner would go unmeasured,
 * which is most of them, and the fraud it is bought to catch would sail
 * through while the subscription was still being paid.
 *
 * readAdClickId() reads the click id from this URL, and failing that from the
 * 90-day as24_clickid cookie AdParameterTracker and captureAdClickIdFromUrl()
 * write — so the whole of a paid visitor's session is covered, not just the
 * landing page they arrived on, and no ordering dependency on those
 * components exists either way.
 *
 * Injected from an effect rather than through next/script because the decision
 * needs window.location and document.cookie: rendering <Script> conditionally
 * on those would differ between the server HTML and the first client render.
 * This is the same shape as loadClarity() and loadOpenAIPixel() in
 * src/lib/consent.ts, for the same reason.
 */

/*
 * Public identifiers, the same kind as the GTM container and AW- conversion id
 * in src/app/layout.tsx: they are shipped to every browser that loads the tag,
 * so there is nothing here to keep in an env var.
 */
const CLICKGUARD_SRC = 'https://pulse.clickguard.com/s/acca1ZX3xB9WR/astqnF3gg1bj2';

const SCRIPT_ID = 'clickguard-pulse';

/*
 * Preview deploys and localhost render this layout too. A dev session is not
 * traffic ClickGuard was paid to judge, and feeding it developer behaviour
 * teaches it nothing true about customers.
 */
const PROD_HOSTNAMES = ['www.autosleutel24.nl', 'autosleutel24.nl'];

export default function ClickGuard() {
  useEffect(() => {
    if (!PROD_HOSTNAMES.includes(window.location.hostname)) return;

    /*
     * The /admin guard is not redundant, which is easy to assume given the
     * click-id check below it. A staff member who once clicked the firm's own
     * ad — testing it, or checking a landing page — carries as24_clickid for
     * 90 days afterwards, and would otherwise have every CRM page they open
     * reported to ClickGuard as activity on that paid click. That is staff
     * traffic shaping a fraud verdict about a real customer's click, and at
     * worst it is the office IP ending up excluded from the firm's own ads.
     */
    if (window.location.pathname.startsWith('/admin')) return;

    if (!readAdClickId()) return;

    // StrictMode runs effects twice in dev; one tag is enough.
    if (document.getElementById(SCRIPT_ID)) return;

    const s = document.createElement('script');
    s.id = SCRIPT_ID;
    s.src = CLICKGUARD_SRC;
    /* `defer` as the vendor ships the tag — it has no work to do before the
       page is parsed, and must not compete with it. */
    s.defer = true;
    document.head.appendChild(s);
  }, []);

  return null;
}
