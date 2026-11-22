'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

/**
 * A failed admin page, shown inside the shell: the menu stays, the person
 * reads what happened and can try again. Without this file a read that threw
 * (a balance, a report, a stock list) fell through to the bare framework error
 * page and took the navigation with it.
 *
 * Next 16: the retry prop is `unstable_retry`
 * (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md).
 */
export default function AdminError({ error, unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="mx-auto flex max-w-xl flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-6">
      <h2 className="text-lg font-semibold">Deze pagina kon niet worden geladen</h2>
      <p className="text-muted-foreground text-sm">
        De gegevens zijn niet opgehaald. Daarom staat hier geen leeg overzicht: dat zou eruitzien alsof er niets openstaat.
        Probeer het opnieuw. Blijft het misgaan, geef dan de code hieronder door.
      </p>
      {error.digest && <p className="text-muted-foreground font-mono text-xs">Code: {error.digest}</p>}
      <div>
        <Button onClick={() => unstable_retry()}>Opnieuw proberen</Button>
      </div>
    </div>
  );
}
