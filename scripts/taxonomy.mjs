/**
 * What we sell, and where each article belongs.
 *
 * One file, because the previous build decided a category in eleven different
 * places — a keyword in the title here, a CSV column there, a section
 * membership somewhere else — and when two of them disagreed the last one to
 * run won. That is how a Mercedes key ended up filed under Dodge and a bare
 * circuit board ended up among the transponders.
 *
 * The rules here are deliberately boring:
 *
 *   • A category is decided by A-Key's own filing of the article — the
 *     breadcrumb in the structured data of their product page. Not by words in
 *     a title, which describe the article and not its place in a shop.
 *   • Every path they use is mapped by hand, below. An unmapped path is a
 *     build error, never a silent null and never a guess.
 *   • Words in the title may *narrow* a category (a remote key that says
 *     "Smart Key" is a smart key) but may never move an article to a category
 *     that contradicts the breadcrumb.
 *   • Anything the rules cannot settle is parked for a human. A product held
 *     back costs one sale; a product filed wrong costs a return, a refund and
 *     a customer.
 */

/* ── our categories ──────────────────────────────────────────────────── */

/**
 * `is` and `isNot` are not documentation. classify() enforces them: an article
 * whose text matches an `isNot` pattern of the category it landed in is held
 * back for review, whatever the breadcrumb said.
 */
export const CATEGORIES = {
  /* ── complete keys ── */
  afstandsbedieningen: {
    label: 'Afstandsbedieningen',
    group: 'Autosleutels',
    blurb: 'Complete sleutel met afstandsbediening: elektronica en behuizing in één.',
    isNot: [/\bGeh[äa]use\b/i, /\bPCB\b/, /\bBoard\b/i, /^Transponder\b/i],
  },
  'smart-keys': {
    label: 'Smart keys / keyless',
    group: 'Autosleutels',
    blurb: 'Keyless entry en start — de sleutel blijft in uw zak.',
    isNot: [/\bGeh[äa]use\b/i, /\bPCB\b/],
  },
  transpondersleutels: {
    label: 'Transpondersleutels',
    group: 'Autosleutels',
    blurb: 'Sleutel met chip in de kop, zonder afstandsbediening.',
    isNot: [/\bGeh[äa]use\b/i, /\bPCB\b/],
  },
  'sleutels-zonder-chip': {
    label: 'Sleutels zonder startonderbreker',
    group: 'Autosleutels',
    blurb: 'Mechanische autosleutel voor auto’s zonder startonderbreker.',
    isNot: [/\bPCB\b/, /\bTransponder\b/i, /MHz/i],
  },
  noodsleutels: {
    label: 'Noodsleutels',
    group: 'Autosleutels',
    blurb: 'Het mechanische blad uit een smart key. Opent het portier, start de auto niet.',
    isNot: [/\bPCB\b/, /MHz/i],
  },
  'universal-remotes': {
    label: 'Universele sleutels',
    group: 'Autosleutels',
    blurb: 'Blanco sleutel die met Xhorse, KeyDIY, Autel of IEA op uw auto wordt gezet.',
    isNot: [],
  },
  motorsleutels: {
    label: 'Motorsleutels',
    group: 'Autosleutels',
    blurb: 'Sleutels voor motorfietsen en scooters.',
    isNot: [],
  },

  /* ── parts ── */
  behuizingen: {
    label: 'Sleutelbehuizingen',
    group: 'Onderdelen',
    blurb: 'Alleen de behuizing — u zet uw eigen elektronica erin.',
    isNot: [/\bPCB\b/, /\bBoard f[üu]r\b/i],
  },
  printplaten: {
    label: 'Printplaten (PCB)',
    group: 'Onderdelen',
    blurb: 'Alleen de elektronica, zonder behuizing.',
    isNot: [/\bGeh[äa]use\s*$/i],
  },
  transponders: {
    label: 'Transponders',
    group: 'Onderdelen',
    blurb: 'Alleen de chip die de startonderbreker herkent.',
    // A radio frequency in the title means a remote, not a chip. 13.56 MHz is
    // the RFID band a transponder itself works on, so it is not a giveaway.
    isNot: [/\bPCB\b/, /\b[3489]\d\d(?:[.,]\d+)?\s*MHz\b/i, /\bGeh[äa]use\b/i],
  },
  sleutelbaarden: {
    label: 'Sleutelbaarden',
    group: 'Onderdelen',
    blurb: 'Ongefreesd sleutelblad. Wij frezen het op uw slot.',
    isNot: [/\bPCB\b/, /MHz/i],
  },
  batterijen: {
    label: 'Batterijen',
    group: 'Onderdelen',
    blurb: 'Knoopcellen voor autosleutels.',
    isNot: [/\bPCB\b/],
  },

  /* ── workshop ── */
  programmeerapparatuur: {
    label: 'Programmeerapparatuur',
    group: 'Werkplaats',
    blurb: 'Apparatuur om sleutels uit te lezen en te programmeren.',
    isNot: [],
  },
  sleutelmachines: {
    label: 'Sleutelmachines',
    group: 'Werkplaats',
    blurb: 'Freesmachines voor sleutels.',
    isNot: [],
  },
  'frezen-en-tasters': {
    label: 'Frezen & tasters',
    group: 'Werkplaats',
    blurb: 'Frezen en tastnaalden voor sleutelmachines.',
    isNot: [],
  },
  gereedschap: {
    label: 'Gereedschap',
    group: 'Werkplaats',
    blurb: 'Handgereedschap voor slotenmakers en sleutelspecialisten.',
    isNot: [],
  },
  accessoires: {
    label: 'Accessoires',
    group: 'Werkplaats',
    blurb: 'Adapters, kabels, emulators en toebehoren.',
    isNot: [],
  },

  /* ── locksmithing ── */
  woningsleutels: {
    label: 'Woning- & bedrijfssleutels',
    group: 'Slotenmakerij',
    blurb: 'Sleutels voor deuren, cilinders en kasten — geen autosleutels.',
    isNot: [/MHz/i, /\bPCB\b/, /\bTransponder\b/i],
  },
  sloten: {
    label: 'Sloten & cilinders',
    group: 'Slotenmakerij',
    blurb: 'Cilinders, hangsloten en insteeksloten.',
    isNot: [],
  },

  diensten: {
    label: 'Diensten',
    group: 'Diensten',
    blurb: 'Werk dat wij voor u doen: frezen, overzetten, programmeren.',
    isNot: [],
  },
};

/* ── A-Key's shelves, mapped to ours ─────────────────────────────────── */

/**
 * Keyed by the breadcrumb path as they publish it, joined with " > ".
 *
 * Longest match wins, so a leaf may override its parent: everything under
 * "Autoschlüssel > Autoschlüssel Funkschlüssel" is a remote key, except the
 * universal ranges, which are listed there but are a different product.
 *
 * `sub` is our subcategory. `make` marks the "geeignet für <merk>" leaves,
 * whose last crumb is a car make rather than a kind of product.
 */
export const AKEY_PATHS = {
  /* ── Autoschlüssel ── */
  'Autoschlüssel': { category: null, sub: null, note: 'root — needs a deeper crumb' },
  'Autoschlüssel > Autoschlüssel Funkschlüssel': { category: 'afstandsbedieningen', sub: 'afstandsbediening', make: true },
  'Autoschlüssel > Autoschlüssel Funkschlüssel > XHORSE Universal': { category: 'universal-remotes', sub: 'Xhorse universal' },
  'Autoschlüssel > Autoschlüssel Funkschlüssel > KEYDIY Universal': { category: 'universal-remotes', sub: 'KeyDIY universal' },
  'Autoschlüssel > Autoschlüssel Funkschlüssel > AUTEL Universal': { category: 'universal-remotes', sub: 'Autel universal' },
  'Autoschlüssel > IEA Universal Fernbedienung': { category: 'universal-remotes', sub: 'IEA universal' },
  'Autoschlüssel > Funkschlüssel Gehäuse': { category: 'behuizingen', sub: 'sleutelbehuizing', make: true },
  'Autoschlüssel > Boards für Funkschlüssel (PCB)': { category: 'printplaten', sub: 'printplaat', make: true },
  'Autoschlüssel > Transponder': { category: 'transponders', sub: 'transponder', make: true },
  'Autoschlüssel > Transponderschlüssel': { category: 'transpondersleutels', sub: 'transpondersleutel', make: true },
  'Autoschlüssel > Notschlüssel': { category: 'noodsleutels', sub: 'noodsleutel', make: true },
  'Autoschlüssel > Autoschlüssel ohne Wegfahrsperre': { category: 'sleutels-zonder-chip', sub: 'sleutel zonder startonderbreker', make: true },
  'Autoschlüssel > Autoschlüsselblatt ( Spitze )': { category: 'sleutelbaarden', sub: 'sleutelbaard', make: true },
  'Autoschlüssel > Zubehör / Werkzeug': { category: 'gereedschap', sub: 'sleutelgereedschap' },
  'Autoschlüssel > Garagenöffner': { category: 'universal-remotes', sub: 'garageopener' },
  'Autoschlüssel > Microtaster & Antenne': { category: 'accessoires', sub: 'microtaster & antenne' },

  /* ── Codiergeräte ── */
  'Codiergeräte': { category: 'programmeerapparatuur', sub: 'programmeerapparaat' },
  'Codiergeräte > XHORSE Zubehör': { category: 'accessoires', sub: 'Xhorse accessoires' },
  'Codiergeräte > OBDSTAR Zubehör': { category: 'accessoires', sub: 'OBDSTAR accessoires' },
  'Codiergeräte > Zed-FULL Zubehör': { category: 'accessoires', sub: 'Zed-FULL accessoires' },
  'Codiergeräte > Autel Zubehör': { category: 'accessoires', sub: 'Autel accessoires' },
  'Codiergeräte > Lonsdor Zubehör': { category: 'accessoires', sub: 'Lonsdor accessoires' },

  /* ── Maschinen, Fräser ── */
  'Maschinen': { category: 'sleutelmachines', sub: 'sleutelmachine' },
  'Maschinen > Zubehör': { category: 'accessoires', sub: 'machineaccessoires' },
  'Maschinen > Xhorse': { category: 'sleutelmachines', sub: 'Xhorse machine' },
  'Maschinen > Ansan': { category: 'sleutelmachines', sub: 'Ansan machine' },
  'Maschinen > Keyline': { category: 'sleutelmachines', sub: 'Keyline machine' },
  'Maschinen > Silca': { category: 'sleutelmachines', sub: 'Silca machine' },
  'Fräser & Taster': { category: 'frezen-en-tasters', sub: 'frees of taster' },
  'Fräser & Taster > Fräser': { category: 'frezen-en-tasters', sub: 'frees' },
  'Fräser & Taster > Taster': { category: 'frezen-en-tasters', sub: 'taster' },

  /* ── Schlüssel: everything that is not a car key ── */
  'Schlüssel': { category: 'woningsleutels', sub: 'sleutel' },
  'Schlüssel > Zylinderschlüssel': { category: 'woningsleutels', sub: 'cilindersleutel' },
  'Schlüssel > Buntbartschlüssel': { category: 'woningsleutels', sub: 'baardsleutel' },
  'Schlüssel > Bohrmuldenschlüssel': { category: 'woningsleutels', sub: 'boormoedersleutel' },
  'Schlüssel > Stahlschlüssel Vollbart': { category: 'woningsleutels', sub: 'stalen baardsleutel' },
  'Schlüssel > Motorradschlüssel': { category: 'motorsleutels', sub: 'motorsleutel' },
  'Schlüssel > A-Key Rohlinge': { category: 'woningsleutels', sub: 'sleutelblank' },
  'Schlüssel > X-Cut Rohlinge': { category: 'woningsleutels', sub: 'sleutelblank' },
  'Schlüssel > EE Rohlinge': { category: 'woningsleutels', sub: 'sleutelblank' },
  'Schlüssel > Tresorschlüssel': { category: 'woningsleutels', sub: 'kluissleutel' },
  'Schlüssel > Möbelschlüssel': { category: 'woningsleutels', sub: 'meubelsleutel' },
  'Schlüssel > Dornschlüssel - Neubautenschlüssel': { category: 'woningsleutels', sub: 'bouwsleutel' },
  'Schlüssel > Bahnenschlüssel': { category: 'woningsleutels', sub: 'baansleutel' },
  'Schlüssel > sonstige Schlüssel': { category: 'woningsleutels', sub: 'overige sleutel' },
  'Schlüssel > Buntbartschlüssel > Keilbartschlüssel': { category: 'woningsleutels', sub: 'keilbaardsleutel' },
  'Schlüssel > Buntbartschlüssel > Kreuzbartschlüssel': { category: 'woningsleutels', sub: 'kruisbaardsleutel' },
  'Schlüssel > Terminator Rohlinge': { category: 'woningsleutels', sub: 'sleutelblank' },
  'Schlüssel > Anlageschlüssel': { category: 'woningsleutels', sub: 'systeemsleutel' },

  /* ── Zylinder & Schlösser ── */
  'Zylinder': { category: 'sloten', sub: 'cilinder' },
  'Zylinder > A-Key Bohrmuldenzylinder': { category: 'sloten', sub: 'cilinder' },
  'Zylinder > A-Key Zylinder': { category: 'sloten', sub: 'cilinder' },
  'Zylinder > Wilka S1 Zylinder': { category: 'sloten', sub: 'cilinder' },
  'Vorhangschlösser': { category: 'sloten', sub: 'hangslot' },
  'Vorhangschlösser > Einsteckschlösser': { category: 'sloten', sub: 'insteekslot' },

  /* ── the rest ── */
  'Batterien': { category: 'batterijen', sub: 'batterij' },
  'Schlüsselanhänger & Sonstiges': { category: 'accessoires', sub: 'sleutelhanger' },
  'Klebstoffe': { category: 'accessoires', sub: 'lijm & hulpmiddelen' },
  'Sonderposten': { category: null, sub: null, note: 'clearance shelf — mixed goods, decide per article' },
  'Hersteller': { category: null, sub: null, note: 'a manufacturer landing page, not a shelf' },
  'News': { category: null, sub: null, note: 'not a product' },
};

/**
 * Leaves that are not a shelf.
 *
 * A-Key hangs three kinds of leaf under a real category, and none of them
 * describes a different product: the article number a range is sold under
 * ("Art.:9 - B36 - 951"), the brand that makes it ("Fräser für Silca"), and
 * the colour of an Xhorse remote ("Rot XK"). Folding them onto the parent is
 * how twenty shelves become one, without any of them being guessed at.
 */
const ARTICLE_LEAF = /^(Art\.?\s*[:.]|Nr\.?\s*[:.])/i;
const COLOUR_LEAF = /^(Rot|Blau|Gelb|Grün|Schwarz|Weiss|Weiß|Grau|Orange|Lila)\b/i;
const COMPONENT_BRAND =
  /\b(Silca|Keyline|Xhorse|KEYDIY|KESA|Lonsdor|Ansan|Börkey|Boerkey|JMA|Errebi|Wilka|Iseo|Abus|Kaba|DOM|Burg|Novoferm|Piaggio|ZADI|Autel|OBDSTAR|Zed-FULL|Tibbe|Miracle)\b/i;

/** "Fräser für Silca" — the same tool, sorted by the machine it fits. */
const FOR_BRAND = /^(Fräser|Taster|Zubehör|Ersatzteile)\s+f[üu]r\s+/i;

// The brand may sit anywhere in the leaf: "Spannbacke Xhorse" is a clamping
// jaw for their machine, filed under the machine's own name.
const foldable = (leaf) =>
  ARTICLE_LEAF.test(leaf) || COLOUR_LEAF.test(leaf) || COMPONENT_BRAND.test(leaf) || FOR_BRAND.test(leaf);

/**
 * The path we look up.
 *
 * Folds one leaf at a time and stops the moment the shorter path is one we
 * have mapped, so an unmapped shelf still reaches the report rather than
 * being folded away into its parent.
 */
export function normalisePath(crumbs) {
  let path = [...crumbs];
  while (path.length > 1 && !AKEY_PATHS[path.join(' > ')] && foldable(path.at(-1))) {
    path = path.slice(0, -1);
  }
  return path.join(' > ');
}

/** "geeignet für Toyota" -> "Toyota". A make, not a shelf. */
export const MAKE_CRUMB = /^(?:geeignet|passend)\s+f[üu]r\s+(.+)$/i;
