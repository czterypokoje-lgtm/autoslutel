'use client';
import React from 'react';
import Link from 'next/link';

const columns = [
  {
    title: 'A-F',
    brands: ['Acura', 'Alfa Romeo', 'Aftermarket', 'Audi', 'Bentley', 'BMW', 'Buick', 'Cadillac', 'Chevrolet', 'Chrysler', 'Dodge', 'Eagle', 'Fiat', 'Ford']
  },
  {
    title: 'G-K',
    brands: ['GMC', 'Honda', 'Hummer', 'Hyundai', 'Infiniti', 'Isuzu', 'Jaguar', 'Jeep', 'Kia']
  },
  {
    title: 'L-O',
    brands: ['Land Rover', 'Lexus', 'Lincoln', 'Maserati', 'Mazda', 'Mercedes-Benz', 'Mercury', 'MINI', 'Mitsubishi', 'Nissan', 'Oldsmobile']
  },
  {
    title: 'P-Z',
    brands: ['Plymouth', 'Pontiac', 'Porsche', 'Saab', 'Saturn', 'Scion', 'Smart', 'Subaru', 'Suzuki', 'Tesla', 'Toyota', 'Volkswagen', 'Volvo']
  }
];

export default function BrandMegaMenu() {
  return (
    <div style={{
      position: 'absolute',
      top: '100%',
      left: '1.5rem',
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: '0 0 8px 8px',
      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
      padding: '2rem',
      width: '800px',
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '2rem',
      zIndex: 100,
      cursor: 'default' // prevent link cursor from parent
    }}>
      {columns.map((col, idx) => (
        <div key={idx} style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '0.75rem',
          borderRight: idx !== columns.length - 1 ? '1px solid #f1f5f9' : 'none',
          paddingRight: idx !== columns.length - 1 ? '2rem' : '0'
        }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
            {col.title}
          </h3>
          {col.brands.map(brand => (
            <Link 
              href={`/webshop/catalogus?make=${brand.toLowerCase().replace(/ /g, '-')}`}
              key={brand}
              style={{
                color: '#475569',
                textDecoration: 'none',
                fontSize: '0.95rem',
                transition: 'color 0.2s',
                fontWeight: 500
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = '#b93c20')}
              onMouseOut={(e) => (e.currentTarget.style.color = '#475569')}
            >
              {brand}
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
}
