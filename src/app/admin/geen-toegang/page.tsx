import Link from 'next/link';
import lg from '../login/login.module.css';
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
    <div className={`crm ${lg.split}`}>
      <div className={lg.brand}>
        <span className={lg.logo}>
          Autosleutel<span>24</span>
          <small>CRM</small>
        </span>
      </div>
      <div className={lg.side}>
        <div className={lg.card}>
          <h1>Geen toegang</h1>
          <p>
            Je bent ingelogd als <strong>{user?.email ?? 'onbekend'}</strong>
            {user?.role ? ` (${user.role === 'monteur' ? 'monteur' : user.role})` : ' zonder rol'}. Dit scherm is alleen
            voor kantoor.
          </p>
          {user?.role ? (
            <Link href="/admin/overzicht" className={lg.back}>
              Terug naar je overzicht
            </Link>
          ) : (
            <p>Klopt dit niet? Vraag kantoor om je rol in te stellen.</p>
          )}
          <div className={lg.signout}>
            <SignOutButton />
          </div>
        </div>
      </div>
    </div>
  );
}
