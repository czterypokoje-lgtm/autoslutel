import { permanentRedirect, notFound } from 'next/navigation';
import { BRANDS } from '@/config/brands';
import { DIENSTEN } from '@/config/diensten';

export default async function LegacyCombinatorialRedirect(props: { params: Promise<{ citySlug: string, slug: string }> }) {
  const params = await props.params;
  const { slug } = params;
  const decodedSlug = decodeURIComponent(slug).toLowerCase();
  
  // 1. Is it a brand? (e.g. bmw-autosleutel-bijmaken or bmw)
  const brandMatch = BRANDS.find(b => {
    const base = b.nameSlug.toLowerCase();
    return decodedSlug === `${base}-autosleutel-bijmaken` || decodedSlug === base;
  });

  if (brandMatch) {
    permanentRedirect(`/merken/${brandMatch.nameSlug.toLowerCase()}-autosleutel-bijmaken`);
  }

  // 2. Is it a service? (e.g. contactslot-reparatie)
  const serviceMatch = DIENSTEN.find(s => s.slug.toLowerCase() === decodedSlug);
  
  if (serviceMatch) {
    permanentRedirect(`/diensten/${serviceMatch.slug}`);
  }

  // If it's neither, return 404
  notFound();
}
