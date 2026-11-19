import type { StockArticle } from '@/lib/keyforcarsStock';

export const inventoryCategories = [
  ['workshop', 'Werkplaatsartikelen', /^werkplaatsartikel/i],
  ['housings', 'Behuizingen', /behuizing|casing|shell|remote case|sleutelhoes/i],
  ['blades', 'Sleutelbaarden', /(?:sleutel|sleuetel)baard|nood\s*(sleutel|baard)|key.?blade|\bbaard\b/i],
  ['batteries', 'Batterijen', /batterij|battery|\bcr\s?20\d{2}\b/i],
  ['locks', 'Sloten', /slotset|contactslot|deurslot|cilinder|ignition lock|vergrendel(?:ings)?\s*(?:set|onderdeel)/i],
  ['electronics', 'Elektronica', /\bpcb\b|printplaat|circuit board|antenne\s?spoel|\bcan filter\b|\bswitch\s+\d|\bic vervanging|\bezs\/eis\b|\bkvm crystal\b/i],
  ['tools', 'Gereedschap', /software|abrites|programm[ae][a-z]*|diagnos|adapter|avdi|gereedschap|machine|decoder|emulator|\bkabel(?:set)?\b|oplader|\bpakket\b|\b(?:ecu|data|flash|pin|airbag|configuratie)\W+manager|\b(?:pin en sleutel|instrument cluster)|\b(?:codering|flitsmanager|pass-thru|herkalibratie|field detector)\b|\bupdate [a-z]{2}\d/i],
  ['repairs', 'Reparaties', /reparati|repair/i],
  ['chips', 'Transponderchips', /transponderchip|^transponders\b|chiptransponder|\bpcf\d+\w*\s+nxp|(?:^|\s|\()(?:4d\d+[a-z]?|dst\d+|id[4-9]\d|8e)(?:\)|\s|$)[^]*\b(?:pagina|page)\b|^(?:\w+\s+)?(?:4d\d+|id[4-9]\d|8e)\b|\btransponderl?\b(?!\s*sleutel)/i],
  ['non-keyless', 'Niet-keyless sleutels', /\b(?:non|not|zonder|geen|niet)[ -]*keyless\b/i],
  ['keyless', 'Keyless sleutels', /keyless|\bsmart\b|proximity|hands[ -]?free|sleutelkaart|key\s?card/i],
  ['non-keyless', 'Niet-keyless sleutels', /klap\s*(?:sleutel|sluetel)|flip\s*key|transponder\s*sleutel|sleutel zonder chip/i],
  ['accessories', 'Accessoires', /accessoire|sleutelhanger|sleutelring|sticker|rubber\s+(?:\d\s+)?knop|knoppenmat|\bknop\s+\d\b/i],
  ['remotes', 'Afstandsbedieningen', /afstandsbediening|\bremote\b|knops|\b(?:mhz|\d+\s?mhz)\b/i],
] as const;

export function inventoryCategory(article: StockArticle) {
  // shortcut: supplier titles drive grouping until structured product types are available.
  return inventoryCategories.find(([, , pattern]) => pattern.test(`${article.category} ${article.name}`.trim()))
    ?? ['other', 'Overige artikelen'] as const;
}
