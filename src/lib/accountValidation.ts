/*
 * Shared checks for customer and supplier accounts (cariler, 0130). Pure
 * functions, used by the server (the real gate) and by the forms (early
 * feedback). Messages are Dutch; the screens pass them through t().
 */

/** KvK: Dutch Chamber of Commerce number, exactly 8 digits. Spaces and dots are dropped. */
export const normalizeKvk = (value: unknown) => (typeof value === 'string' ? value.replace(/[\s.]/g, '') : '');
export const validKvk = (kvk: string) => /^\d{8}$/.test(kvk);

/** BTW / VAT number: upper case, no spaces or dots. NL is strict, other EU countries loose. */
export const normalizeVat = (value: unknown) => (typeof value === 'string' ? value.toUpperCase().replace(/[\s.-]/g, '') : '');
const EU = new Set(['AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'EL', 'ES', 'FI', 'FR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK', 'XI']);
export function validVat(vat: string): boolean {
  if (vat.startsWith('NL')) return /^NL\d{9}B\d{2}$/.test(vat);
  const prefix = vat.slice(0, 2);
  // Other EU member states: a known prefix and 2–13 letters/digits (VIES does the real check).
  if (EU.has(prefix)) return /^[A-Z]{2}[0-9A-Z+*]{2,13}$/.test(vat);
  // Outside the EU (CH, GB, NO, TR …): letters and digits, 4–20.
  return /^[A-Z0-9]{4,20}$/.test(vat);
}
export const isEuCountry = (country: string) => EU.has(country === 'GR' ? 'EL' : country);

/** IBAN with the ISO 13616 mod-97 check. */
export const normalizeIban = (value: unknown) => (typeof value === 'string' ? value.toUpperCase().replace(/\s/g, '') : '');
export function validIban(iban: string): boolean {
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban)) return false;
  const moved = iban.slice(4) + iban.slice(0, 4);
  let rest = 0;
  for (const char of moved) {
    const code = char >= 'A' ? String(char.charCodeAt(0) - 55) : char;
    for (const digit of code) rest = (rest * 10 + Number(digit)) % 97;
  }
  return rest === 1;
}

export const validEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
export const validCountry = (country: string) => /^[A-Z]{2}$/.test(country);

/** Problems an account can have, with the message the screens show. */
export const ACCOUNT_PROBLEMS = {
  name: 'Vul de naam in (max. 160 tekens).',
  kind: 'Kies particulier of bedrijf.',
  kvk: 'KvK-nummer: precies 8 cijfers.',
  kvk_required: 'Een Nederlands bedrijf heeft een KvK-nummer (8 cijfers).',
  vat: 'Btw-nummer klopt niet. Nederlands formaat: NL123456789B01.',
  vat_required: 'Een bedrijf heeft een btw-nummer.',
  address: 'Vul straat, postcode en plaats in.',
  postcode: 'Nederlandse postcode: 1234 AB.',
  invoice_email: 'Vul een geldig factuur-e-mailadres in.',
  email: 'Controleer het e-mailadres.',
  iban: 'IBAN klopt niet (controlecijfer).',
  country: 'Land: twee letters, bijv. NL, BE, DE.',
  terms: 'Betalingstermijn: 0 tot 120 dagen.',
  limit: 'Controleer de kredietlimiet.',
  phone: 'Telefoon: internationaal formaat, bijv. +31612345678.',
} as const;
export type AccountProblem = keyof typeof ACCOUNT_PROBLEMS;

export interface CompanyFields {
  kind: 'person' | 'company' | null;
  name: string; kvk: string; vat_number: string; street: string; postcode: string; city: string; country: string;
  invoice_email: string; email: string; iban: string; terms_days: number; credit_limit_cents: number | null;
}

/**
 * The first problem with an account, or null. A company needs a KvK (when
 * Dutch), a BTW number, a full address and an invoice e-mail; a private
 * customer only a name. Format checks apply to whatever is filled in.
 */
export function accountProblem(a: CompanyFields, maxTerms = 120): AccountProblem | null {
  if (!a.name || a.name.length > 160) return 'name';
  if (a.kind !== null && a.kind !== 'person' && a.kind !== 'company') return 'kind';
  if (!validCountry(a.country)) return 'country';
  if (a.kvk && !validKvk(a.kvk)) return 'kvk';
  if (a.vat_number && !validVat(a.vat_number)) return 'vat';
  if (a.iban && !validIban(a.iban)) return 'iban';
  if (a.email && !validEmail(a.email)) return 'email';
  if (a.invoice_email && !validEmail(a.invoice_email)) return 'invoice_email';
  if (a.country === 'NL' && a.postcode && !/^\d{4}\s?[A-Z]{2}$/i.test(a.postcode)) return 'postcode';
  if (!Number.isInteger(a.terms_days) || a.terms_days < 0 || a.terms_days > maxTerms) return 'terms';
  if (a.credit_limit_cents !== null && (!Number.isSafeInteger(a.credit_limit_cents) || a.credit_limit_cents < 0)) return 'limit';
  if (a.kind === 'company') {
    if (a.country === 'NL' && !a.kvk) return 'kvk_required';
    if (!a.vat_number) return 'vat_required';
    if (!a.street || !a.postcode || !a.city) return 'address';
    if (!a.invoice_email) return 'invoice_email';
  }
  return null;
}

/** "1234ab" → "1234 AB" for Dutch postcodes; other countries as typed. */
export const normalizePostcode = (value: string, country: string) => {
  const v = value.trim().toUpperCase();
  const nl = /^(\d{4})\s?([A-Z]{2})$/.exec(v);
  return country === 'NL' && nl ? `${nl[1]} ${nl[2]}` : v;
};

/**
 * Customer account fields from a submitted form (AccountFields): the same
 * names as the kfc_customers columns; the credit limit is typed in euros.
 */
export function customerFromForm(form: FormData) {
  const get = (key: string) => String(form.get(key) ?? '').trim();
  const raw = get('credit_limit').replace(/[€\s]/g, '');
  const limit = raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw;
  return {
    account_kind: (get('account_kind') || null) as 'person' | 'company' | null,
    company: get('company'), contact_name: get('contact_name'), phone: get('phone'), email: get('email'),
    kvk: get('kvk'), vat_number: get('vat_number'), invoice_email: get('invoice_email'), iban: get('iban'), bic: get('bic'), website: get('website'),
    street: get('street'), postcode: get('postcode'), city: get('city'), country: get('country') || 'NL',
    terms_days: Number(get('terms_days') || 30),
    credit_limit_cents: limit === '' ? null : Math.round(Number(limit) * 100),
    reverse_charge: form.get('reverse_charge') === 'on', note: get('note'),
  };
}
