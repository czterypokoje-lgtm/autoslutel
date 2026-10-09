import 'server-only';
import { createSupabaseServerClient } from './supabase/server';
import { getCrmUser } from './crmSession';
import { DEFAULT_CRM_LOCALE, isCrmLocale, type CrmLocale } from './crmLocale';

/**
 * The signed-in person's CRM language, read from their own technicians row.
 *
 * Separate from crmLocale.ts, and not because of tidiness: the sidebar, the
 * phone tab bar and the offer list are client components and need the types
 * and the Intl map, so that module cannot carry `server-only` — importing it
 * into the client bundle would throw at build. Everything that touches
 * Supabase lives here instead.
 *
 * Falls back to Dutch on anything unexpected — no row (office and owner
 * accounts have none), an unconfigured deployment, a value the check
 * constraint somehow let through. A CRM in the wrong language is survivable; a
 * CRM that throws on the way to rendering its own shell is not.
 */
export async function getCrmLocale(): Promise<CrmLocale> {
  try {
    const user = await getCrmUser();
    if (!user) return DEFAULT_CRM_LOCALE;

    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from('technicians')
      .select('locale')
      .eq('user_id', user.id)
      .maybeSingle();

    const locale = data?.locale;
    return isCrmLocale(locale) ? locale : DEFAULT_CRM_LOCALE;
  } catch {
    return DEFAULT_CRM_LOCALE;
  }
}
