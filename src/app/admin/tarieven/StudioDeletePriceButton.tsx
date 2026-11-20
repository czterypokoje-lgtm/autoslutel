'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deletePrice } from './actions';
import { Button } from '@/components/ui/button';
import { PreviewText } from '../PreviewLanguage';

/** Studio restyle of DeletePriceButton: same server action, same confirm() guard. */
export default function StudioDeletePriceButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!confirm('Dit tarief verwijderen?')) return;
    setBusy(true);
    const result = await deletePrice(id);
    setBusy(false);
    if ('error' in result) {
      alert(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <Button size="sm" variant="outline" disabled={busy} onClick={remove}>
      <PreviewText>Verwijderen</PreviewText>
    </Button>
  );
}
