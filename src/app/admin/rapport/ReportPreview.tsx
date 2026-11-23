'use client';

import Link from 'next/link';
import { BRAND } from '@/config/install';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PreviewText } from '@/app/admin/PreviewLanguage';
import styles from './reportPreview.module.css';

type Column = { id: 'location' | 'cost' | 'price' | 'discount'; label: string };

export default function ReportPreview({ back, children, columns }: { back: string; children: React.ReactNode; columns: Column[] }) {
  return <div className={styles.layout} data-report-preview>
    <aside className={styles.tools}>
      <h2><PreviewText>PDF-voorbeeld</PreviewText></h2>
      <label className={styles.field}>
        <PreviewText>Pagina-indeling</PreviewText>
        <select defaultValue="landscape" name="report-orientation">
          <option value="landscape"><PreviewText>Liggend</PreviewText></option>
          <option value="portrait"><PreviewText>Staand</PreviewText></option>
        </select>
      </label>
      <fieldset className={styles.columns}>
        <legend><PreviewText>Optionele kolommen</PreviewText></legend>
        {columns.map(({ id, label }) => <label key={id}>
          <input type="checkbox" name={id} defaultChecked />
          <PreviewText>{label}</PreviewText>
        </label>)}
      </fieldset>
      <p><PreviewText>Kies Opslaan als PDF in het afdrukvenster.</PreviewText></p>
      <Button onClick={() => window.print()}><Printer aria-hidden="true" /><PreviewText>Afdrukken of opslaan als PDF</PreviewText></Button>
      <Button asChild variant="outline"><Link href={back}><PreviewText>Terug naar rapport</PreviewText></Link></Button>
    </aside>
    <article className={styles.sheet} data-report-sheet>
      <header className={styles.brand}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="" width={120} />
        <strong>{BRAND.name}</strong>
      </header>
      {children}
    </article>
  </div>;
}
