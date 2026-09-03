'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../admin.module.css';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

/**
 * Two ways in, one form.
 *
 * Password is the primary route because that is how the accounts are being
 * created — set in the Supabase dashboard by the owner. The magic link stays
 * as the fallback for the case a password gets lost, which in a team this size
 * is the only "password reset" flow worth maintaining.
 *
 * `shouldCreateUser: false` on the link: accounts are made deliberately, with a
 * role attached. Anyone typing an unknown address gets the same neutral
 * confirmation, so this form cannot be used to discover who has an account.
 */
export default function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function signInWithPassword(event: React.FormEvent) {
    event.preventDefault();
    setState('busy');
    setMessage('');

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        // Deliberately one message for both "no such account" and "wrong
        // password": the difference is only useful to someone guessing.
        setMessage(
          error.status === 429
            ? 'Te veel pogingen. Wacht een minuut en probeer opnieuw.'
            : 'E-mailadres of wachtwoord klopt niet.'
        );
        setState('error');
        return;
      }

      // The session cookies are set by the Supabase client; refresh so the
      // server components pick them up on the next render.
      router.replace(next);
      router.refresh();
    } catch {
      setMessage('Inloggen is op deze omgeving niet geconfigureerd.');
      setState('error');
    }
  }

  async function sendMagicLink() {
    if (!email.trim()) {
      setMessage('Vul eerst je e-mailadres in.');
      setState('error');
      return;
    }

    setState('busy');
    setMessage('');

    try {
      const supabase = createSupabaseBrowserClient();
      const redirect = new URL('/admin/auth/callback', window.location.origin);
      redirect.searchParams.set('next', next);

      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: false, emailRedirectTo: redirect.toString() },
      });

      if (error && error.status === 429) {
        setMessage('Te veel pogingen. Wacht een minuut en probeer opnieuw.');
        setState('error');
        return;
      }

      setState('sent');
    } catch {
      setMessage('Inloggen is op deze omgeving niet geconfigureerd.');
      setState('error');
    }
  }

  if (state === 'sent') {
    return (
      <div className={`${styles.note} ${styles.noteOk}`}>
        Als er een account bestaat voor <strong>{email}</strong>, is de inloglink
        onderweg. De link is 1 uur geldig.
      </div>
    );
  }

  return (
    <form onSubmit={signInWithPassword}>
      <label className={styles.label} htmlFor="crm-email">
        E-mailadres
      </label>
      <input
        id="crm-email"
        className={styles.input}
        type="email"
        name="email"
        autoComplete="username"
        required
        autoFocus
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <label className={styles.label} htmlFor="crm-password" style={{ marginTop: 14 }}>
        Wachtwoord
      </label>
      <input
        id="crm-password"
        className={styles.input}
        type="password"
        name="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button className={styles.button} type="submit" disabled={state === 'busy'}>
        {state === 'busy' ? 'Bezig…' : 'Inloggen'}
      </button>

      <button
        type="button"
        className={styles.linkButton}
        onClick={sendMagicLink}
        disabled={state === 'busy'}
      >
        Wachtwoord kwijt? Stuur een inloglink
      </button>

      {state === 'error' && (
        <div className={`${styles.note} ${styles.noteBad}`}>{message}</div>
      )}
    </form>
  );
}
