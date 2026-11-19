import { requireCrmUser, OFFICE_ROLES } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import styles from '../vandaag/vandaag.module.css';
import pf from './profiel.module.css';
import ProfileForm, { type Profile, type Business } from './ProfileForm';
import { technicianColour } from '@/lib/crmColours';
import { connectToken } from '@/lib/telegramConnect';

/**
 * The connect link.
 *
 * Carries a one-time code, never an id. The old version put the technician's
 * or office user's own uuid in the link, and the bot connected whichever chat
 * sent it back — so the link was a password that never changed and that
 * anyone who saw a uuid could forge.
 */
function telegramConnectUrl(token: string | null): string | null {
  if (!token || !process.env.TELEGRAM_BOT_USERNAME) return null;
  return `https://t.me/${process.env.TELEGRAM_BOT_USERNAME}?start=${token}`;
}

export const dynamic = 'force-dynamic';

export default async function MijnProfielPage() {
  const user = await requireCrmUser('/admin/mijn-profiel');
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('technicians')
    .select(
      'id, name, phone, werkgebied, color, photo_url, online, online_since, active, employment_type, telegram_chat_id'
    )
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    const missing = /column|does not exist/i.test(error.message);
    const missingMigration = error.message.includes('telegram_chat_id')
      ? '0025_telegram_chat_id.sql'
      : '0012_technician_profile.sql';
    return (
      <div className={styles.wrap}>
        <p className={styles.warning}>
          Profiel kon niet worden geladen: {error.message}
          {missing && (
            <>
              <br />
              Voer <code>supabase/migrations/{missingMigration}</code> uit.
            </>
          )}
        </p>
      </div>
    );
  }

  if (!data) {
    // Office roles have no technicians row at all — that's expected, not an
    // error, and this is where their own (admin_telegram) connect card lives
    // instead of a technician profile there's nothing to show for them.
    if (user.role && OFFICE_ROLES.includes(user.role)) {
      const { data: adminTelegram } = await supabase
        .from('admin_telegram')
        .select('telegram_chat_id')
        .eq('user_id', user.id)
        .maybeSingle();

      /* Only minted when it is going to be shown — a code written on every
         page view would be a row per refresh and a link in the history of
         anyone who ever opened this page. */
      const adminConnect = adminTelegram?.telegram_chat_id
        ? null
        : telegramConnectUrl(await connectToken(supabase, 'admin', user.id));

      return (
        <div className={styles.wrap}>
          <div className={styles.head}>
            <h1 className={styles.title}>Mijn profiel</h1>
            <span className={styles.sub}>{user.email}</span>
          </div>
          <div className={styles.card}>
            <div className={styles.body}>
              <span className={styles.label}>Meldingen via Telegram</span>
              {adminTelegram?.telegram_chat_id ? (
                <p className={styles.meta}>
                  Gekoppeld — nieuwe klantgesprekken en meldingen komen hier binnen.
                </p>
              ) : adminConnect ? (
                <>
                  <p className={styles.meta}>Nog niet gekoppeld.</p>
                  <a
                    className={`${styles.tap} ${styles.tapPrimary} ${pf.full}`}
                    href={adminConnect}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open Telegram en druk op Start
                  </a>
                  <p className={styles.note}>
                    Opent de Autosleutel24-bot in Telegram. Druk daar op <strong>Start</strong> — daarna
                    komen gesprektranscripten van de spraakassistent en andere meldingen hier automatisch binnen.
                  </p>
                </>
              ) : (
                <p className={styles.note}>Nog niet beschikbaar op deze omgeving.</p>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.wrap}>
        <p className={styles.warning}>
          Je account is nog niet aan een monteur gekoppeld. Kantoor doet dat bij
          <strong> Monteurs</strong>; tot dan is er geen profiel om te tonen.
        </p>
      </div>
    );
  }

  /*
   * Business details live in columns added by 0062 (and 0007/0058). Read
   * separately so the rest of the profile still works on a database that has
   * not run 0062 yet — the Bedrijf tab then says so instead of failing.
   */
  const { data: biz, error: bizError } = await supabase
    .from('technicians')
    .select(
      'company_name, kvk_nummer, btw_nummer, iban, business_street, business_postcode, business_city, contact_email, insurance_company, insurance_policy, insurance_valid_until, base_city, certifications, gbp_url'
    )
    .eq('id', data.id as string)
    .maybeSingle();

  const business: Business | null =
    bizError || !biz
      ? null
      : {
          company_name: (biz.company_name as string) ?? '',
          kvk_nummer: (biz.kvk_nummer as string) ?? '',
          btw_nummer: (biz.btw_nummer as string) ?? '',
          iban: (biz.iban as string) ?? '',
          business_street: (biz.business_street as string) ?? '',
          business_postcode: (biz.business_postcode as string) ?? '',
          business_city: (biz.business_city as string) ?? '',
          contact_email: (biz.contact_email as string) ?? '',
          insurance_company: (biz.insurance_company as string) ?? '',
          insurance_policy: (biz.insurance_policy as string) ?? '',
          insurance_valid_until: (biz.insurance_valid_until as string) ?? '',
          base_city: (biz.base_city as string) ?? '',
          certifications: Array.isArray(biz.certifications) ? (biz.certifications as string[]) : [],
          gbp_url: (biz.gbp_url as string) ?? '',
        };

  const profile: Profile = {
    name: (data.name as string) ?? '',
    phone: (data.phone as string) ?? '',
    werkgebied: Array.isArray(data.werkgebied) ? (data.werkgebied as string[]) : [],
    color: technicianColour(data.color as string | null),
    photoUrl: (data.photo_url as string) ?? null,
    online: data.online === true,
    onlineSince: (data.online_since as string) ?? null,
    active: data.active === true,
    employmentType: (data.employment_type as string) ?? 'zzp',
    email: user.email ?? '',
    telegramConnected: Boolean(data.telegram_chat_id),
    /* Same one-time code as the office card above: never the technician's
       own id, which is public enough to appear in storage paths. */
    telegramConnectUrl: data.telegram_chat_id
      ? null
      : telegramConnectUrl(await connectToken(supabase, 'technician', data.id as string)),
    business,
  };

  return <ProfileForm profile={profile} />;
}
