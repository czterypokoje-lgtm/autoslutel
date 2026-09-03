'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from './admin.module.css';

export default function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    // A route handler, not the browser client: the session cookies are
    // httpOnly and only the server can clear them.
    await fetch('/admin/auth/signout', { method: 'POST' });
    router.replace('/admin/login');
    router.refresh();
  }

  return (
    <button className={styles.signout} onClick={signOut} disabled={busy}>
      {busy ? '…' : 'Uitloggen'}
    </button>
  );
}
