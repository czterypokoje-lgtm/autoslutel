import { MessagesSquare } from 'lucide-react';
import { STUDIO_UI } from '@/config/install';
import { PreviewText } from '../PreviewLanguage';
import styles from './netwerk.module.css';

export const dynamic = 'force-dynamic';

/** Nothing picked yet: say what this place is and what to do. */
export default function NetwerkIndex() {
  if (STUDIO_UI) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <span className="bg-muted text-muted-foreground flex size-14 items-center justify-center rounded-full" aria-hidden="true">
          <MessagesSquare className="size-7" />
        </span>
        <h2 className="text-lg font-medium"><PreviewText>Netwerk</PreviewText></h2>
        <p className="text-muted-foreground max-w-sm text-sm">
          <PreviewText>Kies links een kanaal om berichten te lezen en te sturen, of open de Marktplaats voor tools en onderdelen.</PreviewText>
        </p>
      </div>
    );
  }

  return (
    <div className={styles.welcome}>
      <span className={styles.welcomeIcon} aria-hidden="true">
        <MessagesSquare size={28} />
      </span>
      <h2>Netwerk</h2>
      <p>Kies links een kanaal om berichten te lezen en te sturen, of open de Marktplaats voor tools en onderdelen.</p>
    </div>
  );
}
