import React from 'react';
import { SITE_CONFIG } from '@/config/site.config';

/**
 * Trust signals — only claims we can actually stand behind.
 *
 * This component previously rendered a Trustpilot score of 4.8 from "2.000+
 * reviews", a "Beste Service Award — 5 jaar op rij", an "A+ gecertificeerd
 * door Webshop Keurmerk" badge and four fabricated customer testimonials.
 * None of it was real: there is no Trustpilot account, no Keurmerk
 * certification, and the Google profile holds 8 reviews.
 *
 * In the Netherlands that is a misleidende handelspraktijk (BW 6:193c) and the
 * ACM enforces it; displaying a certification mark you do not hold is a
 * separate infringement, and Merchant Center rejects accounts over it.
 *
 * What is left is verifiable: the real Google rating, the real founding year,
 * the guarantee we actually give, and the service that genuinely sets the shop
 * apart — our own technicians. Add the badges back when the accounts exist.
 */

const FACTS = [
  {
    value: SITE_CONFIG.rating,
    label: 'op Google',
    note: `${SITE_CONFIG.reviewCount} beoordelingen`,
    href: SITE_CONFIG.social.google,
  },
  {
    value: '2014',
    label: 'actief sinds',
    note: 'mobiele autosleutelservice',
  },
  {
    value: '12',
    label: 'maanden garantie',
    note: 'op sleutel én programmering',
  },
  {
    value: '30–60',
    label: 'minuten ter plaatse',
    note: 'onze eigen monteurs, heel Nederland',
  },
];

export default function TrustSection() {
  return (
    <section
      style={{ background: '#fff', padding: '3rem 1.5rem', borderTop: '1px solid #e5e5e5' }}
      aria-label="Waarom klanten ons vertrouwen"
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <h2
          style={{
            textAlign: 'center',
            fontSize: '1.4rem',
            marginBottom: '2rem',
            color: '#0f172a',
          }}
        >
          Waarom klanten ons vertrouwen
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1.5rem',
            textAlign: 'center',
          }}
        >
          {FACTS.map((f) => {
            const body = (
              <>
                <div
                  style={{
                    color: '#c2410c',
                    fontSize: '2.25rem',
                    fontWeight: 300,
                    marginBottom: '.4rem',
                    lineHeight: 1.1,
                  }}
                >
                  {f.value}
                </div>
                <div style={{ fontSize: '.85rem', color: '#0f172a', fontWeight: 600 }}>
                  {f.label}
                </div>
                <div style={{ fontSize: '.75rem', color: '#475569', marginTop: '.2rem' }}>
                  {f.note}
                </div>
              </>
            );

            return f.href ? (
              <a
                key={f.label}
                href={f.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                {body}
              </a>
            ) : (
              <div key={f.label}>{body}</div>
            );
          })}
        </div>

        {/*
          Where the fabricated Trustpilot carousel used to sit. Real reviews go
          here once they are collected — see the post-purchase review flow.
        */}
      </div>
    </section>
  );
}
