'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { markSold, deleteListing } from './actions';
import { Button } from '@/components/ui/button';
import { PreviewText } from '../../PreviewLanguage';

/** Studio restyle of ListingActions: same markSold/deleteListing calls, same confirm() guard. */
export default function StudioListingActions({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function act(fn: (id: string) => Promise<{ ok: true } | { error: string }>) {
    setBusy(true);
    const result = await fn(id);
    setBusy(false);
    if ('error' in result) {
      alert(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" disabled={busy} onClick={() => act(markSold)}>
        <PreviewText>Markeer verkocht</PreviewText>
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={busy}
        onClick={() => {
          if (confirm('Deze advertentie verwijderen?')) act(deleteListing);
        }}
      >
        <PreviewText>Verwijderen</PreviewText>
      </Button>
    </div>
  );
}
