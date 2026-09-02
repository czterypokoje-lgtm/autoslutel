import React from 'react';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import AccountClient from './AccountClient';

export const metadata: Metadata = {
  title: 'Inloggen Vakhandel | Autosleutel24',
};

export default async function AccountPage() {
  const cookieStore = await cookies();
  const isB2B = cookieStore.get('b2b_session')?.value === 'true';

  return <AccountClient isB2B={isB2B} />;
}
