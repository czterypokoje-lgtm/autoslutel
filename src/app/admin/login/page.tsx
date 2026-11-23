import { PreviewText } from '@/app/admin/PreviewLanguage';
import styles from '../admin.module.css';
import LoginForm from './LoginForm';
import lg from './login.module.css';
import { safeNext } from '../auth/safeNext';
import { BRAND } from '@/config/install';

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
          <>Autosleutel<span>24</span></>
          <small>CRM</small>
        </span>
        <div>
          <div className={lg.pitch}>Elke klus, elke sleutel, elke euro op één plek.</div>
          <div className={lg.pitchSub}>Voor kantoor en monteurs: aan het bureau of op de telefoon in de bus.</div>
        </div>
        <span className={lg.foot}><PreviewText>{BRAND.staff}</PreviewText></span>
      </div>
      <div className={lg.side}>
        <div className={lg.card}>
          <h1><PreviewText>{"Inloggen"}</PreviewText></h1>
          <p><PreviewText>{"Log in met je e-mailadres en wachtwoord. Een account krijg je van kantoor."}</PreviewText></p>
          {error && <div className={`${styles.note} ${styles.noteBad}`}>{error}</div>}
          <LoginForm next={safeNext(next)} />
        </div>
      </div>
    </div>
  );
}
