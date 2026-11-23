// Plain .ts (no JSX) so /api/leads/route.ts can import just the version
// string without pulling the 'use client'-adjacent component tree in.
// Bump this whenever the customer-facing wording in WhatsAppNotice.tsx
// changes, so each lead row keeps recording exactly which text the visitor
// saw at submission time.
export const WHATSAPP_NOTICE_VERSION = 'whatsapp-review-2026-11';
