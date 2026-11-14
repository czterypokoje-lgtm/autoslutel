import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CITY_URL_PILOT, isPilotCity } from '@/config/cityUrls';
import { CityPageBody, cityMetadata } from '../../steden/[citySlug]/cityPage';

/*
 * The pilot URL: /autosleutel-bijmaken/utrecht.
 *
 * Both query words are in the path, which is what every page outranking us
 * for "autosleutel bijmaken <stad>" does and what /steden/utrecht could never
 * do. Same page, same content, same component -- only the address differs, so
 * the test measures the URL and nothing else.
 *
 * Restricted to the pilot set rather than open to every city: two live URLs
 * for one page is the thing a canonical has to resolve, and the fewer of them
 * there are while this is being judged, the cleaner the reading.
 */
// Must be a literal: Next cannot statically read an imported constant here.
export const revalidate = 3600;

export function generateStaticParams() {
  return [...CITY_URL_PILOT].map((stad) => ({ stad }));
}

export async function generateMetadata({ params }: { params: Promise<{ stad: string }> }): Promise<Metadata> {
  const { stad } = await params;
  return isPilotCity(stad) ? cityMetadata(stad) : {};
}

export default async function PilotCityPage({ params }: { params: Promise<{ stad: string }> }) {
  const { stad } = await params;
  if (!isPilotCity(stad)) notFound();
  return <CityPageBody citySlug={stad} />;
}
