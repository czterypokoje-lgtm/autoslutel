import type { Metadata } from 'next';
import { CityPageBody, cityMetadata } from '../steden/[citySlug]/cityPage';

/* Pilot URL for Amsterdam. See src/config/cityUrls.ts for why this shape and how to judge it. */
export const revalidate = 3600;

export function generateMetadata(): Promise<Metadata> {
  return cityMetadata('amsterdam');
}

export default function Page() {
  return <CityPageBody citySlug="amsterdam" />;
}
