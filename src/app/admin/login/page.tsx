import styles from '../admin.module.css';
import LoginForm from './LoginForm';
import { safeNext } from '../auth/safeNext';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <div className={`crm ${styles.centre}`}>
      <div className={styles.card}>
        <h1>Autosleutel24 CRM</h1>
        <p>
          Log in met je e-mailadres en wachtwoord. Geen account? De eigenaar
          maakt die aan — dit scherm maakt er zelf geen.
        </p>
        {error && <div className={`${styles.note} ${styles.noteBad}`}>{error}</div>}
        <LoginForm next={safeNext(next)} />
      </div>
    </div>
  );
}
