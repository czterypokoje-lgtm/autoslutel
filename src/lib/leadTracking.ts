/**
 * Report a submitted lead to the ad platforms, from the browser.
 *
 * WHY THIS EXISTS
 *
 * Five components create leads — ContactForm, LeadCaptureForm, the kenteken
 * form, the vehicle wizard and the B2B form — and until now exactly one of
 * them (ContactForm) told anyone about it. Measured against the leads table:
 * 61 from hero_form, 34 from kenteken_form, 28 from hero_wizard, 27 from
 * city_form, and 2 from contact_form. So 150 of 201 leads reached Google Ads
 * as silence, while the account ran Maximize Conversions — a bid strategy
 * deciding where to spend from almost no examples of success.
 *
 * ONE EVENT NAME
 *
 * Everything pushes `lead_form_submit`, so GTM needs one trigger rather than
 * five that drift. ContactForm keeps pushing its original
 * `contact_form_submit` alongside this, because a tag in the container is
 * already listening for that name and renaming it would silently break a
 * thing that currently works.
 *
 * WHAT IS SENT
 *
 * Only what the visitor just typed into the form they submitted, and only on
 * a genuinely successful submission. email and phone ride along for Google
 * Ads' Enhanced conversions for leads: GTM's own tag hashes them in the
 * browser before anything is transmitted, so this just has to hand them over.
 * Consent Mode is configured in layout.tsx and gates what actually leaves.
 *
 * Never throws. A blocked or missing tag manager is normal — an ad blocker,
 * a declined consent banner — and a lead that was already saved to the
 * database must not surface an error because a pixel was unavailable.
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    oaiq?: ((...args: unknown[]) => void) & { q: unknown[][] };
    /* Microsoft Advertising's UET queue. An array until bat.js loads and
       replaces it with a UET instance — both accept .push(), which is all
       any caller here needs. */
    uetq?: unknown[];
  }
}

export interface LeadConversion {
  /** Matches leads.source: 'hero_form', 'kenteken_form', 'hero_wizard', … */
  source: string;
  email?: string | null;
  phone?: string | null;
  postcode?: string | null;
  city?: string | null;
}

/** Empty strings are as absent as undefined; never send "" as a value. */
const clean = (value: string | null | undefined): string | undefined => {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return trimmed ? trimmed : undefined;
};

export function reportLeadConversion(lead: LeadConversion): void {
  if (typeof window === 'undefined') return;

  const email = clean(lead.email);
  const phone = clean(lead.phone);
  const postcode = clean(lead.postcode);
  const city = clean(lead.city);

  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'lead_form_submit',
      lead_source: lead.source,
      email,
      phone_number: phone,
      /* The shape Facebook Pixel's advanced matching expects. */
      user_data: {
        email_address: email,
        phone_number: phone,
        address: { postal_code: postcode, city },
        external_id: email ?? phone,
      },
    });

    /* Direct gtag call as well as the dataLayer push: the container is the
       normal path, but a standalone gtag.js has existed on this site before
       and this costs nothing if no gtag is present. */
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'generate_lead', { event_category: lead.source });
    }

    /*
     * Microsoft Advertising. UET reports a conversion as a named event, and
     * the goal in the Bing account has to be configured to listen for this
     * same name — `lead_form_submit`, deliberately identical to the GTM
     * trigger so there is one name to remember rather than two.
     */
    window.uetq = window.uetq || [];
    window.uetq.push('event', 'lead_form_submit', {
      event_category: lead.source,
    });

    window.oaiq?.('track', 'lead_created', {
      content_name: lead.source,
      email,
      phone_number: phone,
      external_id: email ?? phone,
    });
  } catch {
    /* Deliberately silent. The lead is already stored; a tracking failure is
       not the visitor's problem and must never reach their screen. */
  }
}
