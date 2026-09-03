'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Navigation from '@/components/Navigation/Navigation';
import Footer from '@/components/Footer/Footer';
import WebshopNavigation from '@/components/webshop/WebshopNavigation';
import WebshopFooter from '@/components/webshop/WebshopFooter';
import UrgencyBanner from '@/components/UrgencyBanner/UrgencyBanner';
import StickyCallBar from '@/components/StickyCallBar/StickyCallBar';

/*
 * The CRM is not a page of the website.
 *
 * It lives in the same Next app — one deploy, one env set, one Supabase client
 * — but a sales navigation and a "bel ons nu" bar on top of a lead table is
 * noise, and the sticky bars eat the vertical space a dense list needs.
 */
function isCrm(pathname: string): boolean {
  return pathname.startsWith('/admin');
}

export function GlobalHeader() {
  const pathname = usePathname() || '';
  const isWebshop = pathname.startsWith('/webshop');

  if (isCrm(pathname)) return null;

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

  if (isCrm(pathname)) return null;

  if (isWebshop) {
    return <WebshopFooter />;
  }

  return <Footer />;
}

/** Chrome that has no business on an internal panel. */
export function GlobalWidgets({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  if (isCrm(pathname)) return null;
  return <>{children}</>;
}

export function GlobalStickyBar() {
  const pathname = usePathname() || '';
  const isWebshop = pathname.startsWith('/webshop');

  if (isCrm(pathname)) return null;

  if (isWebshop) {
    return null; // hide on webshop
  }

  return <StickyCallBar />;
}
