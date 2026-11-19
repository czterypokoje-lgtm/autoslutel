import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import { cityPath, isPilotCity } from '@/config/cityUrls';
import { CityPageBody, cityMetadata, cityStaticParams } from './cityPage';

/*
 * The original home of every city page, and still the home of 58 of them.
 *
 * The four pilot cities moved to /autosleutel-bijmaken/<stad> (see
 * src/config/cityUrls.ts for why and for how to judge it). This route keeps
 * serving the rest unchanged and 301s the four, so no link anywhere -- ours,
 * Google's, or a customer's bookmark -- breaks on the way.
 */
// Must be a literal: Next cannot statically read an imported constant here.
export const revalidate = 3600;

export async function generateStaticParams() {
  const all = await cityStaticParams();
  return all.filter((p) => !isPilotCity(p.citySlug));
}

export async function generateMetadata({ params }: { params: Promise<{ citySlug: string }> }): Promise<Metadata> {
  const { citySlug } = await params;
  return isPilotCity(citySlug) ? {} : cityMetadata(citySlug);
}

export default async function CityPage({ params }: { params: Promise<{ citySlug: string }> }) {
  const { citySlug } = await params;
  if (isPilotCity(citySlug)) permanentRedirect(cityPath(citySlug));
  return <CityPageBody citySlug={citySlug} />;
}
