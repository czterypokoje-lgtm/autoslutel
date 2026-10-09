import { BRANDS_WITH_LOGOS } from '@/components/BrandsLogoGrid/BrandsLogoGrid';

/**
 * Returns the exact SVG logo URL if the brand exists in the curated list.
 * Normalizes input (e.g. "Mercedes-Benz" vs "Mercedes", "VW" vs "Volkswagen").
 */
export function getBrandLogo(brandName: string | null | undefined): string | null {
  if (!brandName) return null;

  const normalized = brandName.toLowerCase().trim();
  
  // Handle common variations
  const aliases: Record<string, string> = {
    'vw': 'volkswagen',
    'mercedes': 'mercedes-benz',
    'mb': 'mercedes-benz',
    'mini cooper': 'mini',
    'alfa': 'alfa romeo',
    'landrover': 'land rover',
    'range rover': 'land rover',
  };

  const target = aliases[normalized] || normalized;

  const match = BRANDS_WITH_LOGOS.find(b => b.name.toLowerCase() === target);
  
  return match?.svg || null;
}
