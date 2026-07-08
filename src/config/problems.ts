// Problem/Solution pages — highest conversion rate (emergency intent)
export type Problem = {
  slug: string; title: string; metaTitle: string; metaDesc: string;
  h1: string; nlSearches: number; beSearches: number; cpc: number;
  intent: 'critical' | 'high' | 'medium'; conversionRate: string;
};

export const PROBLEMS: Problem[] = [
  {
    slug: 'autosleutel-kwijt',
    title: 'Autosleutel Kwijt',
    metaTitle: 'Autosleutel Kwijt? | Direct Hulp | 24/7 Mobiele Service | Bel Nu',
    metaDesc: 'Autosleutel kwijt? Wij helpen direct! Nieuwe sleutel programmeren aan huis. Alle merken. 24/7. Bel nu: 06 11 75 12 31',
    h1: 'Autosleutel Kwijt? Direct Hulp – 24/7 Mobiele Service',
    nlSearches: 2400, beSearches: 880, cpc: 4.20, intent: 'critical', conversionRate: '8–12%',
  },
  {
    slug: 'auto-op-slot',
    title: 'Auto Op Slot / Sleutel Vergeten',
    metaTitle: 'Auto Op Slot? Sleutels Vergeten? | Direct Hulp | Schadevrij Openen',
    metaDesc: 'Auto op slot en sleutels erin vergeten? Wij openen uw auto schadevrij. 24/7. Reactietijd 30-60 min. Bel: 06 11 75 12 31',
    h1: 'Auto Op Slot? Sleutel Vergeten? Wij Openen Schadevrij – 24/7',
    nlSearches: 1900, beSearches: 720, cpc: 5.10, intent: 'critical', conversionRate: '9–14%',
  },
  {
    slug: 'auto-openen-zonder-sleutel',
    title: 'Auto Openen Zonder Sleutel',
    metaTitle: 'Auto Openen Zonder Sleutel | Schadevrij | Alle Merken | 24/7',
    metaDesc: 'Auto openen zonder sleutel? Wij openen uw voertuig schadevrij en professioneel. Geen schade aan slot of portier. Bel: 06 11 75 12 31',
    h1: 'Auto Openen Zonder Sleutel – Schadevrij, Professioneel, 24/7',
    nlSearches: 2100, beSearches: 780, cpc: 4.90, intent: 'critical', conversionRate: '8–12%',
  },
  {
    slug: 'spoedhulp-autosleutel',
    title: '24/7 Spoedhulp Autosleutel',
    metaTitle: 'Spoedhulp Autosleutel | 24/7 Mobiel | Direct Aan Huis | Alle Merken',
    metaDesc: 'Autosleutel spoed? 24/7 mobiele hulp. Gemiddeld 30-60 min reactietijd. Alle merken. Bel nu: 06 11 75 12 31',
    h1: 'Spoedhulp Autosleutel – 24/7 Mobiel Aan Huis',
    nlSearches: 920, beSearches: 340, cpc: 6.20, intent: 'critical', conversionRate: '12–18%',
  },
  {
    slug: '24-uur-service',
    title: '24 Uur Autoslotenmaker',
    metaTitle: '24 Uur Autoslotenmaker | Nacht & Weekend | Heel Nederland',
    metaDesc: '24 uur per dag, 7 dagen per week autoslotenmaker. Nacht, weekend, feestdagen. +25% toeslag buiten kantooruren. Bel: 06 11 75 12 31',
    h1: '24 Uur Autoslotenmaker – Nacht, Weekend & Feestdagen',
    nlSearches: 640, beSearches: 240, cpc: 5.80, intent: 'critical', conversionRate: '11–16%',
  },
];

export const PROBLEM_SUBPAGES = [
  { slug: 'afstandsbediening-werkt-niet', title: 'Afstandsbediening Werkt Niet', searches: 1200 },
  { slug: 'startonderbreker', title: 'Startonderbreker Defect', searches: 320 },
  { slug: 'sleutel-niet-herkend', title: 'Sleutel Niet Herkend Door Auto', searches: 560 },
  { slug: 'chip-defect', title: 'Sleutel Chip Defect', searches: 360 },
  { slug: 'sleutel-waterschade', title: 'Sleutel Waterschade', searches: 180 },
  { slug: 'sleutel-gebroken', title: 'Sleutel Gebroken / Afgebroken', searches: 240 },
  { slug: 'alarm-uitschakelen', title: 'Auto Alarm Gaat Niet Uit', searches: 480 },
  { slug: 'push-to-start-defect', title: 'Push to Start Werkt Niet', searches: 240 },
];
