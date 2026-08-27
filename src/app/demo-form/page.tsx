import React from 'react';
import MultiStepLeadForm from '@/components/MultiStepLeadForm/MultiStepLeadForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Demo: Multi-Step Lead Form',
  robots: 'noindex, nofollow',
};

export default function DemoFormPage() {
  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '4rem 1rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>
          Demo: High-Conversion Form
        </h1>
        <p style={{ color: '#475569', fontSize: '1.1rem' }}>
          Dit is een testomgeving voor het nieuwe interactieve multi-step formulier gebaseerd op het KeyMe design. Test het op mobiel om de perfecte responsive layout te zien.
        </p>
      </div>
      
      <MultiStepLeadForm />
    </div>
  );
}
