'use client';

import { useState, useSyncExternalStore, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { usePreviewLanguage } from './PreviewLanguage';
import styles from './admin.module.css';

const storageKey = 'keyforcars-appearance';
const classic = () => {
  try { return localStorage.getItem(storageKey) === 'classic'; } catch { return false; }
};

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(storageKey, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(storageKey, callback);
  };
}

export default function KeyForCarsAppearance({ children, className }: { children: ReactNode; className: string }) {
  const pathname = usePathname();
  const { english } = usePreviewLanguage();
  const storedClassic = useSyncExternalStore(subscribe, classic, () => false);
  const [temporaryChoice, setTemporaryChoice] = useState<boolean>();
  const isClassic = temporaryChoice ?? storedClassic;
  const documentPage = /^\/admin\/(facturen|klanten|uitgaven|boekhoudtest|integraties)(\/|$)/.test(pathname ?? '');

  function choose(value: boolean) {
    try {
      localStorage.setItem(storageKey, value ? 'classic' : 'studio');
      window.dispatchEvent(new Event(storageKey));
      setTemporaryChoice(undefined);
    } catch {
      setTemporaryChoice(value);
    }
  }

  return (
    <div className={className} data-appearance={isClassic ? 'classic' : 'studio'} data-surface={documentPage ? 'document' : undefined}>
      {children}
      <div role="group" aria-label={english ? 'Panel appearance' : 'Paneelweergave'} className={styles.appearanceSwitch}>
        <button type="button" aria-pressed={isClassic} onClick={() => choose(true)}>{english ? 'Classic' : 'Klassiek'}</button>
        <button type="button" aria-pressed={!isClassic} onClick={() => choose(false)}>Studio</button>
      </div>
    </div>
  );
}
