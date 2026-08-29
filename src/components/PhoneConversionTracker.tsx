'use client';
import { useEffect } from 'react';

export default function PhoneConversionTracker() {
  useEffect(() => {
    const handlePhoneClick = (e: MouseEvent) => {
      const target = (e.target as Element).closest('a');
      if (target && target.href) {
        const win = window as any;
        win.dataLayer = win.dataLayer || [];

        // Phone click
        if (target.href.startsWith('tel:')) {
          win.dataLayer.push({
            'event': 'click_to_call',
            'link_url': target.href,
          });

          if (typeof win !== 'undefined' && win.gtag_report_conversion) {
            // Using the global gtag_report_conversion function
            e.preventDefault();
            win.gtag_report_conversion(target.href);
          }
        }

        // WhatsApp click
        if (target.href.startsWith('https://wa.me') || target.href.includes('/whatsapp') || target.href.startsWith('https://api.whatsapp.com')) {
          win.dataLayer.push({
            'event': 'click_to_whatsapp',
            'link_url': target.href,
          });

          if (typeof win.gtag === 'function') {
            win.gtag('event', 'conversion', {
              'send_to': 'AW-18315813515/WHATSAPP_CLICK_PLACEHOLDER',
              'event_callback': () => {
                // Let the browser naturally navigate to the href
              }
            });
          }
        }
      }
    };

    document.addEventListener('click', handlePhoneClick);
    return () => document.removeEventListener('click', handlePhoneClick);
  }, []);

  return null;
}
