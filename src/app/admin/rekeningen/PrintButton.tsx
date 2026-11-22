'use client';

import { Printer } from 'lucide-react';
import { usePreviewLanguage } from '@/app/admin/PreviewLanguage';
import { Button } from '@/components/ui/button';

/** Print the current report (browser print → "Opslaan als PDF"). */
export default function PrintButton() {
  const { t } = usePreviewLanguage();
  return <Button type="button" variant="outline" size="sm" className="print:hidden" onClick={() => window.print()}><Printer className="size-4" /> {t('Afdrukken')}</Button>;
}
