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

    const setCookie = (name: string, value: string, days: number) => {
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      const expires = "; expires=" + date.toUTCString();
      document.cookie = name + "=" + (value || "")  + expires + "; path=/";
    };

    if (gclid) setCookie('gclid', gclid, 90);
    if (wbraid) setCookie('wbraid', wbraid, 90);
    if (gbraid) setCookie('gbraid', gbraid, 90);
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
