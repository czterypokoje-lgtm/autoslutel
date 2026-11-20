'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { requestPayout } from './actions';

/** Same requestPayout() server action as the classic PayoutForm — the whole
    balance at once, approval stays the office's. */
export default function StudioPayoutForm({ available }: { available: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const nothingToDraw = available <= 0;

  async function submit() {
    if (nothingToDraw) return;
    setBusy(true);
    setMessage(null);

    const result = await requestPayout(available);
    setBusy(false);

    setMessage(
      'error' in result && result.error
        ? { text: result.error, ok: false }
        : { text: 'Aangevraagd. Kantoor betaalt het uit.', ok: true }
    );
    router.refresh();
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        size="lg"
        className="h-11 bg-white text-base text-black hover:bg-white/90"
        onClick={submit}
        disabled={busy || nothingToDraw || (message?.ok ?? false)}
        title={nothingToDraw ? 'Je hebt op dit moment niets openstaan' : undefined}
      >
        <Banknote size={18} strokeWidth={2} data-icon="inline-start" />
        {busy ? 'Bezig…' : nothingToDraw ? 'Niets op te nemen' : `€ ${available.toFixed(2).replace('.', ',')} opnemen`}
      </Button>
      {message && <span className={message.ok ? 'text-sm text-green-400' : 'text-sm text-red-400'}>{message.text}</span>}
    </div>
  );
}
