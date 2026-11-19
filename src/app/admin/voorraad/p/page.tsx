import { redirect } from 'next/navigation';
import { requireOfficeUser } from '@/lib/crmSession';
import { findProfile, profileCount, searchProfiles } from '@/lib/productProfiles';
import ProfileSearch from '../ProfileSearch';
import styles from '../keyforcars.module.css';
import catalog from '@/data/keyforcars-stock.json';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Productprofiel | KeyForCars', robots: { index: false } };

/** Scan or search; an exact code (SKU, EAN or label link) opens its profile at once. */
export default async function ProfileSearchPage({ searchParams }: { searchParams: Promise<{ q?: string; demo?: string }> }) {
  const { q = '', demo } = await searchParams;
  const suffix = demo === '1' ? '?demo=1' : '';
  await requireOfficeUser(`/admin/voorraad/p${q ? `?q=${encodeURIComponent(q)}` : ''}`);
  const labelArticle = /^KFC-[123]-\d+$/i.test(q) ? catalog.find(article => article.id === q.toUpperCase()) : undefined;
  const exact = q ? findProfile(labelArticle?.sku || q) : undefined;
  if (exact) redirect(`/admin/voorraad/p/${encodeURIComponent(exact.sku)}${suffix}`);
  const hits = q ? searchProfiles(q).map(({ profile, fits }) => ({
    sku: profile.sku, name: profile.name, nameNl: profile.nameNl, image: profile.image, fits: fits.slice(0, 3).map((fit) => fit.text),
  })) : undefined;
  return (
    <main className={styles.workspace}>
      <ProfileSearch query={q} hits={hits} demo={demo === '1'} total={profileCount().total} />
    </main>
  );
}
