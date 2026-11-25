import { PreviewText } from '@/app/admin/PreviewLanguage';
import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import styles from '../klanten/klanten.module.css';

export const dynamic = 'force-dynamic';

/**
 * E-mailmarketing van de webshop, alleen voor kantoor: wie kreeg welke
 * automatische mail, wie heeft zich afgemeld, en hoeveel klanten het vakje
 * aanvinken. Leest de tabellen die de webshop schrijft (shop:
 * supabase/0081_marketing_consent.sql); de schakelaar zelf staat in Vercel,
 * project "shop" (MARKETING_MAIL_ENABLED, MARKETING_FLOWS).
 */

const FLOW_LABEL: Record<string, string> = {
  abandoned_checkout: 'Niet afgeronde bestelling',
  program_help: 'Hulp bij inleren (dag 3)',
  review_request: 'Reviewverzoek',
  spare_key: 'Reservesleutel (30 dagen)',
  battery: 'Batterijtip (11 maanden)',
  lead_followup: 'Opvolging prijsaanvraag',
};
const REASON_LABEL: Record<string, string> = { unsubscribed: 'Afgemeld', complained: 'Als spam gemeld', bounced: 'Adres bestaat niet' };

const DATE = new Intl.DateTimeFormat('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' });
const PCT = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : '—');

/** Data loading lives outside the component: the clock is read here, not during render. */
async function loadMarketing() {
  const supabase = await createSupabaseServerClient();
  const since = (days: number) => new Date(Date.now() - days * 86400000).toISOString();
  const [sends, sup, orders] = await Promise.all([
    supabase.from('marketing_sends').select('flow, ref, email, status, sent_at').gte('sent_at', since(90)).order('sent_at', { ascending: false }),
    supabase.from('marketing_suppressions').select('email, reason, source, created_at').order('created_at', { ascending: false }).limit(200),
    supabase.from('orders').select('id, status, consent_marketing, created_at').gte('created_at', since(30)),
  ]);
  return { sends, sup, orders, since };
}

export default async function MarketingPage() {
  await requireOfficeUser('/admin/marketing');
  const { sends, sup, orders, since } = await loadMarketing();

  const err = sends.error ?? sup.error;
  if (err) {
    return (
      <div className={styles.warning}>
        Marketinggegevens konden niet worden geladen: {err.message}
        {/does not exist|relation|permission denied/i.test(err.message) && <><br />Voer in de webshop-repo <code>supabase/0081_marketing_consent.sql</code> uit.</>}
      </div>
    );
  }

  const rows = sends.data ?? [];
  const last30 = rows.filter((r) => r.sent_at >= since(30));
  const failed = rows.filter((r) => r.status === 'failed').length;
  const perFlow = Object.keys(FLOW_LABEL).map((flow) => ({
    flow,
    d30: last30.filter((r) => r.flow === flow).length,
    d90: rows.filter((r) => r.flow === flow).length,
  }));
  const paid = (orders.data ?? []).filter((o) => ['paid', 'processing', 'shipped', 'delivered'].includes(o.status));
  const consented = paid.filter((o) => o.consent_marketing === true).length;
  const consentUnknown = !!orders.error;

  return (
    <>
      <div className={styles.head}>
        <h1 className={styles.title}><PreviewText>{"E-mailmarketing"}</PreviewText></h1>
        <span className={styles.count}>{last30.length} mails in 30 dagen</span>
      </div>

      <div className={styles.cards}>
        <div className={styles.card}><div className={styles.cardLabel}>Toestemming bij betaalde bestellingen (30 dagen)</div><div className={styles.cardValue}>{consentUnknown ? '—' : PCT(consented, paid.length)}</div><div className={styles.sub}>{consentUnknown ? 'orders niet leesbaar' : `${consented} van ${paid.length} vinkten het vakje aan`}</div></div>
        <div className={styles.card}><div className={styles.cardLabel}>Verstuurd (30 dagen)</div><div className={styles.cardValue}>{last30.length}</div><div className={styles.sub}>{rows.length} in 90 dagen</div></div>
        <div className={styles.card}><div className={styles.cardLabel}>Mislukt</div><div className={styles.cardValue}>{failed}</div><div className={styles.sub}>door de mailprovider geweigerd</div></div>
        <div className={styles.card}><div className={styles.cardLabel}>Afgemeld / geweigerd</div><div className={styles.cardValue}>{(sup.data ?? []).length}</div><div className={styles.sub}>krijgen nooit meer marketingmail</div></div>
      </div>

      <p className={styles.note}>
        De mails gaan alleen naar klanten die bij het afrekenen het vakje aanvinkten. Aan- en uitzetten gebeurt in Vercel, project <code>shop</code>: <code>MARKETING_MAIL_ENABLED</code> en <code>MARKETING_FLOWS</code>. Staat alles op nul, dan is de schakelaar uit of zijn er nog geen klanten met toestemming.
      </p>

      <h2 className={styles.cardTitle}><PreviewText>{"Per e-mail"}</PreviewText></h2>
      <div className={styles.wrap}>
        <table className={styles.table}>
          <thead><tr><th>E-mail</th><th>Wanneer</th><th>30 dagen</th><th>90 dagen</th></tr></thead>
          <tbody>
            {perFlow.map((f) => (
              <tr key={f.flow}><td>{FLOW_LABEL[f.flow]}</td><td className={styles.sub}><code>{f.flow}</code></td><td>{f.d30}</td><td>{f.d90}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className={styles.cardTitle}><PreviewText>{"Laatst verstuurd"}</PreviewText></h2>
      <div className={styles.wrap}>
        <table className={styles.table}>
          <thead><tr><th>Datum</th><th>E-mail</th><th>Aan</th><th>Status</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={4} className={styles.empty}>Nog niets verstuurd.</td></tr>}
            {rows.slice(0, 100).map((r) => (
              <tr key={`${r.flow}-${r.ref}`}><td>{DATE.format(new Date(r.sent_at))}</td><td>{FLOW_LABEL[r.flow] ?? r.flow}</td><td>{r.email}</td><td><span className={r.status === 'failed' ? styles.danger : styles.ok}>{r.status === 'failed' ? 'mislukt' : 'verstuurd'}</span></td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className={styles.cardTitle}><PreviewText>{"Afgemeld of geweigerd"}</PreviewText></h2>
      <div className={styles.wrap}>
        <table className={styles.table}>
          <thead><tr><th>Datum</th><th>Adres</th><th>Reden</th><th>Via</th></tr></thead>
          <tbody>
            {(sup.data ?? []).length === 0 && <tr><td colSpan={4} className={styles.empty}>Niemand.</td></tr>}
            {(sup.data ?? []).map((s) => (
              <tr key={s.email}><td>{DATE.format(new Date(s.created_at))}</td><td>{s.email}</td><td>{REASON_LABEL[s.reason] ?? s.reason}</td><td className={styles.sub}>{s.source}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
