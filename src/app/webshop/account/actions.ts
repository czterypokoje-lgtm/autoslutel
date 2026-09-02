'use server';

import { cookies } from 'next/headers';

export async function loginB2B(password: string) {
  if (password === 'VAKHANDEL24') {
    const cookieStore = await cookies();
    cookieStore.set('b2b_session', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    });
    return { success: true };
  }
  return { success: false, error: 'Ongeldig wachtwoord.' };
}

export async function logoutB2B() {
  const cookieStore = await cookies();
  cookieStore.delete('b2b_session');
  return { success: true };
}
