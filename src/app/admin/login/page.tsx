import styles from '../admin.module.css';
import LoginForm from './LoginForm';
import lg from './login.module.css';
import { safeNext } from '../auth/safeNext';
import { BRAND, IS_KEYFORCARS } from '@/config/install';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <div className={`crm ${lg.split}`}>
      <div className={lg.brand}>
        <span className={lg.logo}>
          {IS_KEYFORCARS ? 'KeyForCars' : <>Autosleutel<span>24</span></>}
          <small>CRM</small>
        </span>
        {IS_KEYFORCARS ? (
          <div>
            <div className={lg.pitch}>Drie webshops, één magazijn, één overzicht.</div>
            <div className={lg.pitchSub}>Bestellingen, voorraad en etiketten: aan het bureau of op de telefoon in het magazijn.</div>
          </div>
        ) : (
          <div>
            <div className={lg.pitch}>Elke klus, elke sleutel, elke euro op één plek.</div>
            <div className={lg.pitchSub}>Voor kantoor en monteurs: aan het bureau of op de telefoon in de bus.</div>
          </div>
        )}
        <span className={lg.foot}>{BRAND.staff}</span>
      </div>
      <div className={lg.side}>
        <div className={lg.card}>
          <h1>Inloggen</h1>
          <p>Log in met je e-mailadres en wachtwoord. Een account krijg je van kantoor.</p>
          {error && <div className={`${styles.note} ${styles.noteBad}`}>{error}</div>}
          <LoginForm next={safeNext(next)} />
        </div>
      </div>
    </div>
  );
}
