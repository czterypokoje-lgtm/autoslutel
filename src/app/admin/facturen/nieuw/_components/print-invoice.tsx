'use client';

import * as React from 'react';

import { createPortal } from 'react-dom';

import type { InvoiceFormValues } from './data';
import { InvoicePaper } from './invoice-paper';

/* A second copy of the sheet on <body>, hidden on screen; kfc.css prints only this. */
export function PrintInvoice({ invoice }: { invoice: InvoiceFormValues }) {
  // false on the server render, true once hydrated: document.body exists only then.
  const mounted = React.useSyncExternalStore(() => () => {}, () => true, () => false);

  if (!mounted) return null;

  return createPortal(
    <div data-print-root>
      <InvoicePaper invoice={invoice} />
    </div>,
    document.body,
  );
}
