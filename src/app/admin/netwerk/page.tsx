import { MessagesSquare } from 'lucide-react';
import styles from './netwerk.module.css';

export const dynamic = 'force-dynamic';

/** Nothing picked yet: say what this place is and what to do. */
export default function NetwerkIndex() {
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
