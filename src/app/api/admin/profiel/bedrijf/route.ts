import { NextResponse } from 'next/server';
import { getCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * A monteur's own business details (Mijn profiel → Bedrijf).
 *
 * Goes through crm_update_own_business (0062), which can only reach the
 * caller's own technicians row and only these columns. This route checks
 * shapes; the database decides whose row it is.
 *
 * A field that is sent as "" is cleared; a field that is not sent is left alone.
 */

function field(body: Record<string, unknown>, key: string, max: number): string | null {
  if (!(key in body)) return null;
  const v = body[key];
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

const KVK = /^\d{8}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const IBAN = /^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function PATCH(request: Request) {
  const user = await getCrmUser();
  if (user?.role !== 'monteur') {
    return NextResponse.json({ error: 'Alleen voor monteurs' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 });
  }

  const kvk = field(body, 'kvk_nummer', 20);
  if (kvk && !KVK.test(kvk.replace(/\s/g, ''))) {
    return NextResponse.json({ error: 'Een KVK-nummer heeft 8 cijfers.' }, { status: 400 });
  }
  const iban = field(body, 'iban', 40);
  if (iban && !IBAN.test(iban.replace(/\s/g, '').toUpperCase())) {
    return NextResponse.json({ error: 'Dit IBAN klopt niet. Voorbeeld: NL91 ABNA 0417 1643 00.' }, { status: 400 });
  }
  const email = field(body, 'contact_email', 200);
  if (email && !EMAIL.test(email)) {
    return NextResponse.json({ error: 'Dit e-mailadres klopt niet.' }, { status: 400 });
  }
  const until = field(body, 'insurance_valid_until', 10);
  if (until && !DATE.test(until)) {
    return NextResponse.json({ error: 'Kies een geldige datum voor de verzekering.' }, { status: 400 });
  }
  const gbp = field(body, 'gbp_url', 500);
  if (gbp && !/^https:\/\//i.test(gbp)) {
    return NextResponse.json({ error: 'Het Google-profiel moet een link zijn die met https:// begint.' }, { status: 400 });
  }

  const certifications =
    'certifications' in body && Array.isArray(body.certifications)
      ? (body.certifications as unknown[])
          .filter((c): c is string => typeof c === 'string')
          .map((c) => c.trim().slice(0, 80))
          .filter(Boolean)
          .slice(0, 20)
      : null;

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: 'CRM is niet geconfigureerd' }, { status: 503 });
  }

  const { data, error } = await supabase.rpc('crm_update_own_business', {
    p_company_name: field(body, 'company_name', 160),
    p_kvk_nummer: kvk === null ? null : kvk.replace(/\s/g, ''),
    p_btw_nummer: field(body, 'btw_nummer', 30),
    p_iban: iban,
    p_business_street: field(body, 'business_street', 160),
    p_business_postcode: field(body, 'business_postcode', 12),
    p_business_city: field(body, 'business_city', 80),
    p_contact_email: email,
    p_insurance_company: field(body, 'insurance_company', 120),
    p_insurance_policy: field(body, 'insurance_policy', 60),
    p_insurance_valid_until: until || null,
    p_base_city: field(body, 'base_city', 80),
    p_certifications: certifications,
    p_gbp_url: gbp,
  });

  if (error) {
    if (error.code === 'P0002') {
      return NextResponse.json({ error: 'Je account is nog niet aan een monteur gekoppeld.' }, { status: 400 });
    }
    if (/function|does not exist/i.test(error.message)) {
      return NextResponse.json({ error: 'Bedrijfsgegevens zijn nog niet geactiveerd (migratie 0062).' }, { status: 503 });
    }
    console.error('Business profile update failed:', error.message);
    return NextResponse.json({ error: 'Opslaan mislukt' }, { status: 500 });
  }

  return NextResponse.json({ business: data }, { headers: { 'Cache-Control': 'no-store' } });
}
