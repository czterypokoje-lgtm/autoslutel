'use client';
import { usePathname } from 'next/navigation';
import React from 'react';

export default function FooterSwitcher({
  mainFooter,
  webshopFooter,
}: {
  mainFooter: React.ReactNode;
  webshopFooter: React.ReactNode;
}) {
  const pathname = usePathname();

  if (pathname?.startsWith('/webshop')) {
    return <>{webshopFooter}</>;
  }

  return <>{mainFooter}</>;
}
