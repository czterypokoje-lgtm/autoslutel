import { requireOfficeUser } from '@/lib/crmSession';
import { findProfile, lookupCode } from '@/lib/productProfiles';
import { EXAMPLE_SKU, stockCatalog } from '@/lib/stockCatalog';
import { BRAND } from '@/config/install';
import ProductProfile from '../../ProductProfile';
import ProfileSearch from '../../ProfileSearch';
import styles from '../../keyforcars.module.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: `Productprofiel | ${BRAND.name}`, robots: { index: false } };

/**
 * The page a label link opens. Staff only: without a CRM session the visitor
 * lands on the login page and sees nothing about the product.
 */
export default async function ProductProfilePage({ params, searchParams }: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ demo?: string }>;
}) {
  const { code } = await params;
  const demo = (await searchParams).demo === '1';
  await requireOfficeUser(`/admin/voorraad/p/${encodeURIComponent(code)}`);
  const profile = findProfile(code);
  const query = lookupCode(code);
  if (!profile) {
    return <main className={styles.workspace}><ProfileSearch query={query} hits={[]} demo={demo} example={EXAMPLE_SKU} /></main>;
  }
  const articles = stockCatalog.filter((article) => article.sku.trim().toUpperCase() === profile.sku).map((article) => article.id);
  return (
    <main className={styles.workspace}>
      <ProfileSearch query="" demo={demo} example={EXAMPLE_SKU} />
      <ProductProfile profile={profile} articles={articles} demo={demo} />
    </main>
  );
}
