/**
 * The evidence kinds the conversion matcher uses, with their Dutch labels.
 * No imports on purpose: the browser panel on /admin/conversies reads these,
 * and the matcher itself pulls in server-only code.
 */

export type MatchRule =
  | 'own_click'
  | 'lead_form'
  | 'office_claim'
  | 'review_code'
  | 'quote_code'
  | 'chat_code'
  | 'same_phone'
  | 'time';
export type Strength = 'hard' | 'strong' | 'medium' | 'weak';

export const RULE_ORDER: readonly MatchRule[] = [
  'own_click',
  'lead_form',
  'office_claim',
  'review_code',
  'quote_code',
  'chat_code',
  'same_phone',
  'time',
];

export const RULE_INFO: Readonly<Record<MatchRule, { label: string; strength: Strength }>> = {
  own_click: { label: 'Klik staat op de klus', strength: 'hard' },
  lead_form: { label: 'Webformulier van deze klus', strength: 'hard' },
  office_claim: { label: 'Door kantoor gekoppeld', strength: 'hard' },
  review_code: { label: 'WhatsApp-code (beoordeling)', strength: 'strong' },
  quote_code: { label: 'WhatsApp-code in het gesprek', strength: 'strong' },
  chat_code: { label: 'WhatsApp-code vanaf dit nummer', strength: 'strong' },
  same_phone: { label: 'Ander formulier, zelfde nummer', strength: 'medium' },
  time: { label: 'Alleen tijd (gok)', strength: 'weak' },
};

export const STRENGTH_LABEL: Readonly<Record<Strength, string>> = {
  hard: 'Hard bewijs',
  strong: 'Sterk',
  medium: 'Matig',
  weak: 'Gok',
};

export const VAT_RATE = 0.21;
