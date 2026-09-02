import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Webshop - Autosleutel24',
  description: 'Koop uw autosleutels, batterijen, behuizingen en accessoires online.',
  /**
   * The webshop is not ready to be indexed.
   *
   * The catalogue currently carries 2,093 products whose titles, descriptions
   * and photographs come from a third-party Shopify store, and 2,075 of those
   * descriptions are in English on a Dutch site. Publishing that to Google is a
   * scraped-content problem for the whole domain, not just these pages.
   *
   * Every product page also inherits this layout's title and the root
   * canonical, so all 2,093 of them currently claim to be the homepage.
   *
   * Remove this block once the product data comes from a licensed source and
   * each page emits its own title, description and canonical.
   */
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
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
