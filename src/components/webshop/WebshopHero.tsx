import React from 'react';
import Link from 'next/link';

export default function WebshopHero() {
  return (
    <section className="webshop-hero">
      <div className="container" style={{ display: 'flex', alignItems: 'center', height: '100%', position: 'relative' }}>
        
        {/* Left Content */}
        <div className="webshop-hero-content">
          <h1 className="webshop-hero-title">
            Wie slim is, <br />
            <span style={{ fontStyle: 'italic' }}>betaalt minder.</span>
          </h1>
          <p className="webshop-hero-subtitle">
            Autosleutels, behuizingen en printplaten voor vrijwel elk merk — voor minder dan bij de dealer.
          </p>
          <Link href="#categorieen" className="webshop-btn-dark">
            Bespaar nu
          </Link>
        </div>

        {/* Right Image Placeholder (Desktop) */}
        <div 
          style={{
            position: 'absolute',
            right: '0',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            width: '50%',
            height: '120%',
            pointerEvents: 'none'
          }}
          className="hidden md:flex"
        >
          {/* This will be replaced with actual product imagery */}
          <div style={{
             width: '80%', 
             height: '90%', 
             background: 'url(/images/bmw-key-desktop.webp) no-repeat right center',
             backgroundSize: 'contain'
          }} />
        </div>
        
      </div>
    </section>
  );
}
