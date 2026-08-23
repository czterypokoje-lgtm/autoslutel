import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Webshop - Autosleutel24',
  description: 'Koop uw autosleutels, batterijen, behuizingen en accessoires online.',
};

export default function WebshopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="webshop-layout">
      {/* 
        This is where we will dynamically load the Cart and Header components 
        using next/dynamic later to avoid bundling them in the main app.
      */}
      <main className="webshop-main">
        {children}
      </main>
    </div>
  );
}
