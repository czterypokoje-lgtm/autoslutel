/*
 * Deep-dive articles, keyed by the make they actually describe.
 *
 * These three posts — BDC2, SFD, Ghost — carry the site's real technical
 * authority and had three inbound links each, while a boilerplate page like
 * /contact had 178 from the footer. They are linked from the brand page and
 * from city pages that list the make among their popular brands, so every
 * link has a reader behind it rather than being placed to move PageRank.
 */
/**
 * Brands whose keys have a documented security system we have written about.
 *
 * Only where the article genuinely covers that make — BDC2 is BMW's body
 * controller, SFD is the VW group's online-service lock. A mapping that
 * pointed every brand at the same post would be the link farm this is meant
 * to avoid.
 */
export const DEEP_DIVE: Record<string, { slug: string; title: string; blurb: string }> = {
  BMW: {
    slug: 'bmw-bdc2-sleutel-bijmaken-2026',
    title: 'BMW BDC2: sleutel bijmaken in 2026',
    blurb: 'Nieuwere BMW-modellen gebruiken de BDC2-bodycontroller, die het bijmaken van een sleutel anders aanpakt dan de oudere CAS-systemen. Wat dat betekent voor doorlooptijd en kosten leest u hier.',
  },
  Volkswagen: {
    slug: 'sfd-lock-vw-golf-8-uitleg',
    title: 'SFD-lock op de Golf 8 uitgelegd',
    blurb: 'Vanaf de Golf 8 zit er een SFD-slot op de stuurmodule, waardoor niet elke specialist zomaar een sleutel kan inleren. Wat het is en hoe wij ermee werken.',
  },
  Audi: {
    slug: 'sfd-lock-vw-golf-8-uitleg',
    title: 'SFD-lock binnen de VAG-groep',
    blurb: 'Audi deelt het SFD-slot met Volkswagen, Seat en Skoda. Dezelfde online-vrijgave is nodig voordat er een sleutel ingeleerd kan worden.',
  },
  Seat: {
    slug: 'sfd-lock-vw-golf-8-uitleg',
    title: 'SFD-lock binnen de VAG-groep',
    blurb: 'Seat valt onder dezelfde SFD-beveiliging als Volkswagen en Audi. Wat dat voor uw sleutel betekent.',
  },
  Skoda: {
    slug: 'sfd-lock-vw-golf-8-uitleg',
    title: 'SFD-lock binnen de VAG-groep',
    blurb: 'Skoda gebruikt de VAG-elektronica en dus ook het SFD-slot. De uitleg staat in dit artikel.',
  },
  'Land Rover': {
    slug: 'ghost-immobiliser-utrecht',
    title: 'Ghost immobiliser tegen keyless diefstal',
    blurb: 'Land Rover staat hoog in de diefstalcijfers door relay-aanvallen op keyless systemen. Een Ghost immobiliser voegt een pincode toe die met geen enkele sleutel te omzeilen is.',
  },
  Toyota: {
    slug: 'toyota-hybride-sleutel-vervangen',
    title: 'Toyota hybride: sleutel vervangen',
    blurb: 'De hybride modellen van Toyota hebben een eigen inleerprocedure. Wat daarbij komt kijken.',
  },
};

/**
 * Makes routinely taken by relay attack on their keyless entry.
 *
 * The Ghost immobiliser article is about that specific threat, so it belongs
 * on pages where these cars are common rather than on every page. Kept
 * separate from DEEP_DIVE because it is a second, different reason to link —
 * not "this is how your key works" but "this is how your car gets stolen".
 */
export const RELAY_THEFT_MAKES = new Set([
  'BMW',
  'Mercedes-Benz',
  'Audi',
  'Land Rover',
  'Lexus',
  'Toyota',
  'Volkswagen',
]);

export const GHOST_ARTICLE = {
  slug: 'ghost-immobiliser-utrecht',
  title: 'Ghost immobiliser: bescherming tegen relay-diefstal',
};
