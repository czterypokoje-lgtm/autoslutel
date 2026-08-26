'use client';
import { useEffect } from 'react';

export default function PhoneConversionTracker() {
  useEffect(() => {
    const handlePhoneClick = (e: MouseEvent) => {
      const target = (e.target as Element).closest('a');
      if (target && target.href && target.href.startsWith('tel:')) {
        const win = window as any;
        
        // Push event to GTM dataLayer
        win.dataLayer = win.dataLayer || [];
        win.dataLayer.push({
          'event': 'click_to_call',
          'link_url': target.href,
        });

        if (typeof win !== 'undefined' && win.gtag_report_conversion) {
          e.preventDefault();
          win.gtag_report_conversion(target.href);
        }
      }
    };

    document.addEventListener('click', handlePhoneClick);
    return () => document.removeEventListener('click', handlePhoneClick);
  }, []);

  return null;
}
