'use client';

import { useEffect } from 'react';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

/* Opens the print dialog as soon as the sheet is on screen; the button is for a second run. */
export function PrintNow({ auto }: { auto: boolean }) {
  useEffect(() => {
    if (!auto) return;
    const t = window.setTimeout(() => window.print(), 400);
    return () => window.clearTimeout(t);
  }, [auto]);
  return (
    <Button type="button" size="sm" variant="outline" className="w-fit" onClick={() => window.print()}>
      <Printer data-icon="inline-start" /> Afdrukken
    </Button>
  );
}
