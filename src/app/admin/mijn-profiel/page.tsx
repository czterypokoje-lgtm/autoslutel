import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import styles from '../vandaag/vandaag.module.css';
import ProfileForm, { type Profile } from './ProfileForm';

export const dynamic = 'force-dynamic';

export default async function MijnProfielPage() {
  const user = await requireCrmUser('/admin/mijn-profiel');
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('technicians')
    .select('id, name, phone, werkgebied, color, photo_url, online, online_since, active, employment_type')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    const missing = /column|does not exist/i.test(error.message);
    return (
      <div className={styles.wrap}>
        <p className={styles.warning}>
          Profiel kon niet worden geladen: {error.message}
          {missing && (
            <>
              <br />
              Voer <code>supabase/migrations/0012_technician_profile.sql</code> uit.
            </>
          )}
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={styles.wrap}>
        <p className={styles.warning}>
          Je account is nog niet aan een monteur gekoppeld. Kantoor doet dat bij
          <strong> Monteurs</strong>; tot dan is er geen profiel om te tonen.
        </p>
      </div>
    );
  }

  const profile: Profile = {
    name: (data.name as string) ?? '',
    phone: (data.phone as string) ?? '',
    werkgebied: Array.isArray(data.werkgebied) ? (data.werkgebied as string[]) : [],
    color: (data.color as string) ?? '#2c4a63',
    photoUrl: (data.photo_url as string) ?? null,
    online: data.online === true,
    onlineSince: (data.online_since as string) ?? null,
    active: data.active === true,
    employmentType: (data.employment_type as string) ?? 'zzp',
    email: user.email ?? '',
  };

  return <ProfileForm profile={profile} />;
}
