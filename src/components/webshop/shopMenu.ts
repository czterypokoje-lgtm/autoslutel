import counts from '@/lib/navCounts.json';
import brands from '@/lib/brands.json';

/**
 * The shop menu, in one place.
 *
 * What it replaced was fifteen flat links in a strip that ran off the edge of
 * a 1440px screen: Merken, Autosleutels, Behuizingen, Behuizingen
 * (AccessFobs), Batterijen, Printplaten, Smart Keys, Overige sleutels,
 * Transponders, Noodsleutels, Universal Keys, Xhorse accessoires, Autel
 * accessoires, OBDSTAR accessoires, Zed-FULL accessoires, Aanbiedingen. Every
 * range we added made it worse, and the last four were unreachable.
 *
 * Six headings now, each opening one panel. The grouping is how a locksmith
 * thinks about the job — a whole key, a housing, the electronics inside, a
 * universal to programme, the tools — not how our categories happen to be
 * named.
 *
 * Counts come from the catalogue at build time (scripts/build-catalog.mjs
 * writes navCounts.json), so an entry can never promise a range that turns
 * out to be empty: a link with nothing behind it is dropped before render.
 */

const CATEGORY_COUNTS = (counts as { categories: Record<string, number> }).categories;
const SUBCATEGORY_COUNTS = (counts as { subcategories: Record<string, number> }).subcategories;

export interface MenuLink {
  label: string;
  href: string;
  count: number;
  /** One line under the label, in the wider panels. */
  note?: string;
}

export interface MenuGroup {
  label: string;
  /** Where the heading itself goes — every heading is a real page. */
  href: string;
  /** Rendered as a brand grid rather than a list of links. */
  variant?: 'brands';
  columns: { title?: string; links: MenuLink[] }[];
}

const byCategory = (label: string, slug: string, note?: string): MenuLink | null => {
  const count = CATEGORY_COUNTS[slug] ?? 0;
  return count ? { label, href: `/webshop/catalogus?category=${slug}`, count, note } : null;
};

const bySubcategory = (label: string, name: string, note?: string): MenuLink | null => {
  const count = SUBCATEGORY_COUNTS[name] ?? 0;
  return count
    ? { label, href: `/webshop/catalogus?subcategory=${encodeURIComponent(name)}`, count, note }
    : null;
};

const keep = (...links: (MenuLink | null)[]): MenuLink[] => links.filter((l): l is MenuLink => Boolean(l));

export const MENU: MenuGroup[] = [
  {
    label: 'Autosleutels',
    href: '/webshop/catalogus?category=afstandsbedieningen',
    columns: [
      {
        title: 'Naar type',
        links: keep(
          byCategory('Afstandsbedieningen', 'afstandsbedieningen', 'Complete sleutel met afstandsbediening'),
          bySubcategory('Smart keys / keyless', 'smart key', 'Instappen zonder de sleutel te pakken'),
          bySubcategory('Transpondersleutels', 'transpondersleutel', 'Sleutel met chip, zonder afstandsbediening'),
          bySubcategory('Zonder startonderbreker', 'sleutel zonder startonderbreker'),
          byCategory('Noodsleutels', 'noodsleutels', 'Opent het portier, start de auto niet'),
          byCategory('Overige sleutels', 'overige-sleutels')
        ),
      },
    ],
  },
  {
    label: 'Behuizingen',
    href: '/webshop/catalogus?category=behuizingen',
    columns: [
      {
        title: 'Twee reeksen',
        links: keep(
          bySubcategory('A-Key behuizingen', 'sleutelbehuizing', 'Ruimste keuze, per artikelcode'),
          bySubcategory('AccessFobs behuizingen', 'AccessFobs behuizing', 'Eigen foto’s, met modellijst'),
          byCategory('Alle behuizingen', 'behuizingen')
        ),
      },
    ],
  },
  {
    label: 'Onderdelen',
    href: '/webshop/catalogus?category=printplaten',
    columns: [
      {
        title: 'In de sleutel',
        links: keep(
          byCategory('Printplaten (PCB)', 'printplaten', 'De elektronica los'),
          byCategory('Transponders', 'transponders', 'De chip die de auto herkent'),
          byCategory('Batterijen', 'batterijen', 'Knoopcellen, per type'),
          byCategory('Sleutelbaarden', 'sleutelbaarden', 'Ongefreesd, wij frezen op uw slot')
        ),
      },
    ],
  },
  {
    label: 'Universele sleutels',
    href: '/webshop/catalogus?category=universal-remotes',
    columns: [
      {
        title: 'Per merk gereedschap',
        links: keep(
          bySubcategory('Xhorse', 'Xhorse universal'),
          bySubcategory('KeyDIY', 'KeyDIY universal'),
          bySubcategory('Autel', 'Autel universal'),
          bySubcategory('IEA', 'IEA universal'),
          bySubcategory('Universele afstandsbedieningen', 'universele afstandsbediening'),
          byCategory('Alles bekijken', 'universal-remotes')
        ),
      },
    ],
  },
  {
    label: 'Gereedschap',
    href: '/webshop/catalogus?category=accessoires',
    columns: [
      {
        title: 'Accessoires per merk',
        links: keep(
          bySubcategory('Xhorse accessoires', 'Xhorse accessoires', 'Adapters, kabels, emulators'),
          bySubcategory('Zed-FULL accessoires', 'Zed-FULL accessoires'),
          bySubcategory('Autel accessoires', 'Autel accessoires'),
          bySubcategory('OBDSTAR accessoires', 'OBDSTAR accessoires')
        ),
      },
      {
        title: 'Werkplaats',
        links: keep(
          byCategory('Handgereedschap', 'gereedschap'),
          bySubcategory('Garageopeners', 'garageopener'),
          bySubcategory('Microtaster & antenne', 'microtaster & antenne'),
          byCategory('Alle accessoires', 'accessoires')
        ),
      },
    ],
  },
  {
    label: 'Merken',
    href: '/webshop/merken',
    variant: 'brands',
    columns: [],
  },
];

/** The makes with the most products, for the brand panel. */
export const TOP_BRANDS = [...(brands as { make: string; count: number }[])]
  .sort((a, b) => b.count - a.count)
  .slice(0, 18);
