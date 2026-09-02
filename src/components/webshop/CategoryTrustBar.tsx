import React from 'react';
import Link from 'next/link';

export default function CategoryTrustBar() {
  return (
    <div style={{
      background: '#e2e8f0', // darker gray from the screenshot
      borderBottom: '1px solid #cbd5e1',
      padding: '0.4rem 0',
      display: 'flex',
      justifyContent: 'center',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', fontSize: '0.75rem', fontWeight: 800 }}>
        
        <Link href="#" style={{ textDecoration: 'none', color: '#fff', background: '#dc2626', padding: '0.2rem 0.6rem', borderRadius: '999px', border: '1px solid #b91c1c' }}>
          NEW PRODUCTS
        </Link>

        <Link href="#" style={{ textDecoration: 'none', color: '#0f172a' }}>
          BEST SELLER
        </Link>

        <Link href="#" style={{ textDecoration: 'none', color: '#0f172a' }}>
          OFFERS
        </Link>

        <Link href="#" style={{ textDecoration: 'none', color: '#0f172a' }}>
          SOON
        </Link>

        <Link href="#" style={{ textDecoration: 'none', color: '#0f172a' }}>
          FREE SHIPPING
        </Link>

        <Link href="#" style={{ textDecoration: 'none', color: '#fff', background: '#dc2626', padding: '0.2rem 0.6rem', borderRadius: '999px', border: '1px solid #b91c1c' }}>
          SUPER DEAL
        </Link>
        
      </div>
    </div>
  );
}
