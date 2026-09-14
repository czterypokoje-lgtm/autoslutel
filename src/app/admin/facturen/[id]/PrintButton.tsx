'use client';

import Link from 'next/link';
import styles from './invoice.module.css';

/** Print uses the browser's own dialog — "Save as PDF" there is the export,
    so no PDF library is needed for a page that is only ever this one sheet. */
export default function PrintButton() {
  return (
    <div className={styles.bar}>
      <Link href="/admin/facturen" className={styles.back}>
        ← Facturen
      </Link>
      <button type="button" className={styles.printBtn} onClick={() => window.print()}>
        Afdrukken / Opslaan als PDF
      </button>
    </div>
  );
}
