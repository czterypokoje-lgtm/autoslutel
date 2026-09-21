'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function TrackerLogic() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!searchParams) return;

    const gclid = searchParams.get('gclid');
    const wbraid = searchParams.get('wbraid');
    const gbraid = searchParams.get('gbraid');
    /*
     * Microsoft Advertising's click id. leads.msclkid has existed since 0045
     * and nothing ever filled it, because nothing captured the parameter —
     * so a Bing click could never be reported back as a conversion, the same
     * gap Google had before gclid was stored here.
     */
    const msclkid = searchParams.get('msclkid');

    const setCookie = (name: string, value: string, days: number) => {
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      const expires = "; expires=" + date.toUTCString();
      document.cookie = name + "=" + (value || "")  + expires + "; path=/";
    };

    if (gclid) setCookie('gclid', gclid, 90);
    if (wbraid) setCookie('wbraid', wbraid, 90);
    if (gbraid) setCookie('gbraid', gbraid, 90);
    /* Microsoft's conversion window is 90 days too, so the same lifetime. */
    if (msclkid) setCookie('msclkid', msclkid, 90);
  }, [searchParams]);

  return null;
}

export default function AdParameterTracker() {
  return (
    <Suspense fallback={null}>
      <TrackerLogic />
    </Suspense>
  );
}
