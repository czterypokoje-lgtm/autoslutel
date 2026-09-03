import styles from '../admin.module.css';
import SignOutButton from '../SignOutButton';
import { getCrmUser } from '@/lib/crmSession';

/**
 * Signed in, but not authorised for this surface — a monteur, or an account
 * whose role has not been set yet. Deliberately not the login page: sending
 * someone who is already authenticated back to login is a loop, not a fix.
 */
export default async function GeenToegangPage() {
  const user = await getCrmUser();

  return (
    <div className={`crm ${styles.centre}`}>
      <div className={styles.card}>
        <h1>Geen toegang</h1>
        <p>
          Je bent ingelogd als <strong>{user?.email ?? 'onbekend'}</strong>
          {user?.role ? ` met de rol ${user.role}` : ' zonder rol'}. Deze
          schermen zijn voor kantoor en eigenaar.
        </p>
        <p>
          Klopt dit niet? Vraag de eigenaar om je rol in te stellen.
        </p>
        <SignOutButton />
      </div>
    </div>
  );
}
