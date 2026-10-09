import React from 'react';

/**
 * Illustrations for the option cards.
 *
 * Drawn as SVG rather than sourced as photographs: they stay crisp at any
 * size, inherit the card's colour when selected, add nothing to page weight,
 * and there is no licensing question over stock images of someone's dashboard.
 */

const base = {
  width: 34,
  height: 34,
  viewBox: '0 0 32 32',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/** Keyless start — a finger pressing the engine start button. */
export const PushButtonIcon = () => (
  <svg {...base} aria-hidden="true">
    <circle cx="16" cy="13" r="8.2" />
    <circle cx="16" cy="13" r="3.6" />
    <path d="M16 5.2v2M23.8 13h-2M16 20.8v-2M8.2 13h2" />
    <path d="M11 26.6c1.6-1.5 3.3-2.3 5-2.3s3.4.8 5 2.3" />
  </svg>
);

/** Traditional ignition — a key turning in a barrel. */
export const TurnKeyIcon = () => (
  <svg {...base} aria-hidden="true">
    <circle cx="11.5" cy="12" r="5.2" />
    <circle cx="11.5" cy="12" r="1.5" />
    <path d="M15.6 15.2l7.4 7.4" />
    <path d="M20.3 19.9l2.2-2.2M23 22.6l2.1-2.1" />
  </svg>
);

/** Key fob with lock/unlock buttons. */
export const RemoteYesIcon = () => (
  <svg {...base} aria-hidden="true">
    <rect x="9" y="4.5" width="14" height="20" rx="3.4" />
    <circle cx="13.6" cy="11" r="1.5" />
    <circle cx="18.4" cy="11" r="1.5" />
    <path d="M13 17.5h6" />
    <path d="M25.4 8.6a5 5 0 0 1 0 6M27.8 6.2a8.4 8.4 0 0 1 0 10.8" />
  </svg>
);

/** Plain mechanical key — no buttons, no electronics on the head. */
export const RemoteNoIcon = () => (
  <svg {...base} aria-hidden="true">
    <circle cx="10.5" cy="10.5" r="5.4" />
    <circle cx="10.5" cy="10.5" r="1.4" />
    <path d="M14.6 14.4L24.5 24.3" />
    <path d="M20.6 20.4l2.3-2.3M23.1 22.9l2.2-2.2" />
  </svg>
);

export const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

export const PhoneIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
  </svg>
);

export const WhatsAppIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.2-.7.1l-.9 1.2c-.2.2-.3.2-.6.1a8 8 0 0 1-2.4-1.5 9 9 0 0 1-1.6-2c-.2-.3 0-.5.1-.6l.5-.6c.1-.2.2-.3.3-.5a.6.6 0 0 0 0-.6l-1-2.3c-.2-.6-.5-.5-.7-.5h-.6a1.2 1.2 0 0 0-.8.4A3.4 3.4 0 0 0 6 9.1a5.9 5.9 0 0 0 1.3 3.1 13.5 13.5 0 0 0 5.1 4.5c.7.3 1.3.5 1.7.6a4 4 0 0 0 1.9.1 3 3 0 0 0 2-1.4 2.5 2.5 0 0 0 .2-1.4c-.1-.1-.3-.2-.6-.3zM12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.3A10 10 0 1 0 12 2z" />
  </svg>
);
