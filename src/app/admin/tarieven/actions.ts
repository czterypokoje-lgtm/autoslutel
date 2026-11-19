'use server';

import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isScenario } from '@/lib/scenarios';

export interface PriceInput {
  make: string;
  model: string;
  scenario: string;
  fromYear: string;
  toYear: string;
  keyless: string; // '' = beide, 'true' | 'false'
  price: string;
  note: string;
}

function parseYear(value: string): number | null {
  const n = Number(value);
  return value.trim() && Number.isFinite(n) ? n : null;
}

/**
 * Office-entered dispatch price, independent of the webshop catalogue — see
 * dispatchPricing.ts for how the agent reads these back.
 */
export async function addPrice(input: PriceInput): Promise<{ ok: true } | { error: string }> {
  await requireOfficeUser();

  const make = input.make.trim();
  if (!make) return { error: 'Merk is verplicht.' };
  if (!isScenario(input.scenario)) return { error: 'Ongeldig scenario.' };

  const price = Number(input.price.replace(',', '.'));
  if (!Number.isFinite(price) || price <= 0) return { error: 'Ongeldige prijs.' };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('dispatch_pricing').upsert(
    {
      make,
      model: input.model.trim() || null,
      scenario: input.scenario,
      from_year: parseYear(input.fromYear),
      to_year: parseYear(input.toYear),
      keyless: input.keyless === '' ? null : input.keyless === 'true',
      price,
      note: input.note.trim() || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'make, model, scenario, keyless' }
  );

  if (error) {
    console.error('dispatch_pricing upsert failed:', error.message);
    return { error: 'Opslaan mislukt.' };
  }
  return { ok: true };
}

/**
 * Change one existing tarief in place.
 *
 * Separate from addPrice because that one upserts on
 * (make, model, scenario, keyless) — the natural key. Correcting a typo in
 * the make, or moving a row from "heel merk" to one model, changes that key,
 * so an upsert would leave the old row sitting there and quietly create a
 * second one. Editing by id changes the row the office is actually looking
 * at. Until this existed the only way to change a price was to delete the row
 * and retype every field.
 */
export async function updatePrice(
  id: string,
  input: PriceInput
): Promise<{ ok: true } | { error: string }> {
  await requireOfficeUser();

  if (!id) return { error: 'Ontbrekend id.' };

  const make = input.make.trim();
  if (!make) return { error: 'Merk is verplicht.' };
  if (!isScenario(input.scenario)) return { error: 'Ongeldig scenario.' };

  const price = Number(input.price.replace(',', '.'));
  if (!Number.isFinite(price) || price <= 0) return { error: 'Ongeldige prijs.' };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('dispatch_pricing')
    .update({
      make,
      model: input.model.trim() || null,
      scenario: input.scenario,
      from_year: parseYear(input.fromYear),
      to_year: parseYear(input.toYear),
      keyless: input.keyless === '' ? null : input.keyless === 'true',
      price,
      note: input.note.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    /*
     * The table's unique index on (make, model, scenario, keyless) is what
     * stops two rows claiming the same car — priceFor() would then have no
     * defined answer for it.
     */
    if (/duplicate key|unique/i.test(error.message)) {
      return { error: 'Er bestaat al een tarief voor deze combinatie.' };
    }
    console.error('dispatch_pricing update failed:', error.message);
    return { error: 'Opslaan mislukt.' };
  }
  return { ok: true };
}

export async function deletePrice(id: string): Promise<{ ok: true } | { error: string }> {
  await requireOfficeUser();

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('dispatch_pricing').delete().eq('id', id);
  if (error) {
    console.error('dispatch_pricing delete failed:', error.message);
    return { error: 'Verwijderen mislukt.' };
  }
  return { ok: true };
}
