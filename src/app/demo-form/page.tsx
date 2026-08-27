import React from 'react';
import MultiStepLeadForm from '@/components/MultiStepLeadForm/MultiStepLeadForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Demo: Multi-Step Lead Form',
  robots: 'noindex, nofollow',
};

export default function DemoFormPage() {
  return (
    <div style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', padding: '2rem 1rem' }}>
      <MultiStepLeadForm />
    </div>
  );
}
