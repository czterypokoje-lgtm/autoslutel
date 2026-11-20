'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setPayoutStatus } from './actions';
import { Button } from '@/components/ui/button';
import { PreviewText } from '../PreviewLanguage';

/** Studio restyle of PayoutActions: same server action, same guards. */
export default function StudioPayoutActions({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function act(status: 'paid' | 'rejected') {
    setBusy(true);
    setError('');
    const result = await setPayoutStatus(id, status);
    setBusy(false);
    if ('error' in result) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={busy} onClick={() => act('rejected')}>
          <PreviewText>Afwijzen</PreviewText>
        </Button>
        <Button size="sm" disabled={busy} onClick={() => act('paid')}>
          <PreviewText>Markeer betaald</PreviewText>
        </Button>
      </div>
      {error && <p className="text-destructive text-sm"><PreviewText>{error}</PreviewText></p>}
    </div>
  );
}
