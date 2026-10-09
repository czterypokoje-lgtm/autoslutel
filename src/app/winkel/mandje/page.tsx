import type { Metadata } from 'next';
import { SITE_CONFIG } from '@/config/site.config';
import CartScreen from './CartScreen';

export const metadata: Metadata = {
  title: { absolute: 'Uw mandje | Autosleutel24 winkel' },
  description: 'Uw mandje en afrekenen.',
  alternates: { canonical: `${SITE_CONFIG.domain}/winkel/mandje` },
  // A basket is per-visitor and has nothing to index.
  robots: { index: false, follow: false },
};

export default function MandjePage() {
  return <CartScreen />;
}
