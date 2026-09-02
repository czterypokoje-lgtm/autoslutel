'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Navigation from '@/components/Navigation/Navigation';
import Footer from '@/components/Footer/Footer';
import WebshopNavigation from '@/components/webshop/WebshopNavigation';
import WebshopFooter from '@/components/webshop/WebshopFooter';
import UrgencyBanner from '@/components/UrgencyBanner/UrgencyBanner';
import StickyCallBar from '@/components/StickyCallBar/StickyCallBar';

export function GlobalHeader() {
  const pathname = usePathname() || '';
  const isWebshop = pathname.startsWith('/webshop');

  if (isWebshop) {
    return <WebshopNavigation />;
  }

  return (
    <>
      <UrgencyBanner />
      <Navigation />
    </>
  );
}

export function GlobalFooter() {
  const pathname = usePathname() || '';
  const isWebshop = pathname.startsWith('/webshop');

  if (isWebshop) {
    return <WebshopFooter />;
  }

  return <Footer />;
}

export function GlobalStickyBar() {
  const pathname = usePathname() || '';
  const isWebshop = pathname.startsWith('/webshop');

  if (isWebshop) {
    return null; // hide on webshop
  }

  return <StickyCallBar />;
}
