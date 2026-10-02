import { requireCrmUser, OFFICE_ROLES } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import styles from '../vandaag/vandaag.module.css';
import pf from './profiel.module.css';
import ProfileForm, { type Profile, type Business } from './ProfileForm';
import { technicianColour } from '@/lib/crmColours';

function telegramConnectUrl(startPayload: string): string | null {
  return process.env.TELEGRAM_BOT_USERNAME
    ? `https://t.me/${process.env.TELEGRAM_BOT_USERNAME}?start=${startPayload}`
    : null;
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
              ) : telegramConnectUrl(`admin_${user.id}`) ? (
                <>
                  <p className={styles.meta}>Nog niet gekoppeld.</p>
                  <a
                    className={`${styles.tap} ${styles.tapPrimary} ${pf.full}`}
                    href={telegramConnectUrl(`admin_${user.id}`)!}
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
    telegramConnectUrl: telegramConnectUrl(data.id as string),
    business,
  };

  return <ProfileForm profile={profile} />;
}
