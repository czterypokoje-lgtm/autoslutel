'use client';
import { usePathname } from 'next/navigation';
import Navigation from './Navigation';
import WebshopNavigation from '../webshop/WebshopNavigation';

import UrgencyBanner from '../UrgencyBanner/UrgencyBanner';

export default function HeaderSwitcher() {
  const pathname = usePathname();
  
  if (pathname?.startsWith('/webshop')) {
    return <WebshopNavigation />;
  }
  
  return (
    <>
      <UrgencyBanner />
      <Navigation />
    </>
  );
}
