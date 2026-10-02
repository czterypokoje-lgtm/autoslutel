import { requireOfficeUser } from '@/lib/crmSession';
import { PageHead, Card, CardHead, Notice } from '../_ui';
import styles from './instellingen.module.css';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

export const dynamic = 'force-dynamic';

/**
 * Which integrations are actually wired up.
 *
 * The rule this page is built on: it reports what the server can see, and
 * nothing else. Every row below is `Boolean(process.env.X)` — never a stored
 * "connected" flag somebody set once and never cleared, and never a green
 * badge that means "we implemented support for this".
 *
 * That distinction matters here more than it sounds. Two of these — Google
 * Ads and Bing — have credentials that can be present while the API client
 * behind them is still unimplemented (see api/cron/sync-marketing), so they
 * get their own state rather than being called connected.
 *
 * Reading env on the server and shipping only booleans to the page: no secret
 * value, or length, or prefix reaches the browser.
 */

type State = 'live' | 'off' | 'partial';

interface Integration {
  name: string;
  what: string;
  state: State;
  detail: string;
  vars: string[];
}

function has(name: string): boolean {
  return Boolean(process.env[name]);
}

/** Every var set → live; none → off; some → partial. */
function stateOf(vars: string[]): State {
  const set = vars.filter(has).length;
  if (set === 0) return 'off';
  return set === vars.length ? 'live' : 'partial';
}

export default async function InstellingenPage() {
  await requireOfficeUser('/admin/instellingen');

  const mail: Integration = {
    name: 'E-mail (Resend)',
    what: 'Bestelbevestigingen naar de klant en de lead-melding naar kantoor.',
    state: stateOf(['RESEND_API_KEY']),
    detail: has('RESEND_API_KEY')
      ? `Afzender: ${process.env.MAIL_FROM ?? 'standaard afzender uit site.config'}`
      : 'Zonder sleutel wordt er niets verstuurd — een klant krijgt dan geen bevestiging.',
    vars: ['RESEND_API_KEY', 'MAIL_FROM'],
  };

  /*
   * Split deliberately: the bot token alone makes technician-berichten work,
   * but the lead alert also needs a chat to send to. Rolling both into one
   * row would show "live" while every new lead still reached nobody.
   */
  const telegramBot = stateOf(['TELEGRAM_BOT_TOKEN']);
  const leadAlert: Integration = {
    name: 'Lead-melding (Telegram)',
    what: 'Een duw op de telefoon zodra er een lead binnenkomt, ook buiten kantooruren.',
    state:
      telegramBot === 'live' && has('TELEGRAM_OFFICE_CHAT_ID')
        ? 'live'
        : telegramBot === 'live'
          ? 'partial'
          : 'off',
    detail:
      telegramBot === 'live' && has('TELEGRAM_OFFICE_CHAT_ID')
        ? 'Elke nieuwe lead wordt direct doorgestuurd.'
        : telegramBot === 'live'
          ? 'De bot werkt, maar TELEGRAM_OFFICE_CHAT_ID ontbreekt — leads gaan alleen per e-mail.'
          : 'Niet ingesteld. Leads komen alleen per e-mail binnen.',
    vars: ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_OFFICE_CHAT_ID'],
  };

  const telegram: Integration = {
    name: 'Monteursberichten (Telegram)',
    what: 'Klusaanbod met Accepteren/Weigeren-knoppen, en statusmeldingen.',
    state: stateOf(['TELEGRAM_BOT_TOKEN', 'TELEGRAM_BOT_USERNAME', 'TELEGRAM_WEBHOOK_SECRET']),
    detail:
      telegramBot === 'live'
        ? 'Een monteur koppelt zichzelf één keer via Mijn profiel.'
        : 'Zonder bot-token worden monteurs niet op de hoogte gebracht.',
    vars: ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_BOT_USERNAME', 'TELEGRAM_WEBHOOK_SECRET'],
  };

  const whatsapp: Integration = {
    name: 'WhatsApp (ElevenLabs)',
    what: 'De AI-agent die WhatsApp-gesprekken voert en klussen inboekt.',
    state: stateOf(['ELEVENLABS_API_KEY', 'ELEVENLABS_WHATSAPP_PHONE_NUMBER_ID', 'ELEVENLABS_WEBHOOK_SECRET']),
    detail: has('ELEVENLABS_WHATSAPP_PHONE_NUMBER_ID')
      ? 'Gesprekken komen binnen via de webhook.'
      : 'Alleen de wa.me-knoppen in het CRM werken: een medewerker opent de chat zelf.',
    vars: ['ELEVENLABS_API_KEY', 'ELEVENLABS_WHATSAPP_PHONE_NUMBER_ID', 'ELEVENLABS_WEBHOOK_SECRET'],
  };

  /*
   * Inbound mail, which is a different thing from outbound and fails
   * differently: without the webhook secret the route refuses every request,
   * including real ones, so "sleutel aanwezig" is not the same as "post komt
   * binnen". Split from `mail` for the same reason the lead alert is split
   * from the bot token.
   */
  const inbound: Integration = {
    name: 'E-mail ontvangen (Resend)',
    what: 'Mail aan info@autosleutel24.nl komt in het postvak bij Berichten.',
    state:
      has('RESEND_WEBHOOK_SECRET') && has('RESEND_API_KEY')
        ? 'live'
        : has('RESEND_WEBHOOK_SECRET') || has('RESEND_API_KEY')
          ? 'partial'
          : 'off',
    detail:
      has('RESEND_WEBHOOK_SECRET') && has('RESEND_API_KEY')
        ? 'Zet in de webmail van de host een doorstuurregel naar het Resend-adres, dan landt elke mail hier.'
        : has('RESEND_API_KEY')
          ? 'RESEND_WEBHOOK_SECRET ontbreekt — de webhook weigert alles, ook echte mail.'
          : 'Niet ingesteld. Mail blijft in de mailbox en het CRM weet niet dat iemand geschreven heeft.',
    vars: ['RESEND_WEBHOOK_SECRET', 'RESEND_API_KEY'],
  };

  /*
   * Instagram and Messenger are one app, one token and one review — which is
   * why they are one row here rather than two. The thing this row cannot see,
   * and the thing that actually blocks going live, is whether Meta has granted
   * Advanced Access: the credentials look identical before and after.
   */
  const meta: Integration = {
    name: 'Instagram & Facebook (Meta)',
    what: 'DM\u2019s van Instagram en Messenger komen in het postvak bij Berichten.',
    state: stateOf(['META_APP_SECRET', 'META_VERIFY_TOKEN', 'META_PAGE_ID', 'META_PAGE_ACCESS_TOKEN']),
    detail:
      stateOf(['META_APP_SECRET', 'META_VERIFY_TOKEN', 'META_PAGE_ID', 'META_PAGE_ACCESS_TOKEN']) === 'live'
        ? 'Gegevens compleet. Werkt pas echt zodra Meta App Review Advanced Access heeft gegeven — tot die tijd komen alleen berichten binnen van mensen met een rol op de app.'
        : 'Niet gekoppeld. DM\u2019s blijven in de Meta Business Suite en het CRM weet er niets van.',
    vars: ['META_APP_SECRET', 'META_VERIFY_TOKEN', 'META_PAGE_ID', 'META_PAGE_ACCESS_TOKEN'],
  };

  const payments: Integration = {
    name: 'Betalingen (Mollie)',
    what: 'iDEAL-betalingen in de webshop.',
    state: stateOf(['MOLLIE_API_KEY']),
    detail: has('MOLLIE_API_KEY') ? 'Actief.' : 'De webshop kan geen betaling starten.',
    vars: ['MOLLIE_API_KEY'],
  };

  /*
   * These two are the reason `partial` exists. sync-marketing throws rather
   * than returning a figure when the credentials are set but the API client
   * is not written yet — so "credentials aanwezig" is the honest label, and
   * "live" would be a claim the code itself refuses to make.
   */
  const googleAds: Integration = {
    name: 'Google Ads',
    what: 'Dagelijkse advertentiekosten in het financieel overzicht.',
    state: stateOf(['GOOGLE_ADS_DEVELOPER_TOKEN', 'GOOGLE_ADS_REFRESH_TOKEN', 'GOOGLE_ADS_CUSTOMER_ID']) === 'off'
      ? 'off'
      : 'partial',
    detail:
      stateOf(['GOOGLE_ADS_DEVELOPER_TOKEN', 'GOOGLE_ADS_REFRESH_TOKEN', 'GOOGLE_ADS_CUSTOMER_ID']) === 'off'
        ? 'Niet gekoppeld. Uitgaven en brutowinst blijven leeg.'
        : 'Gegevens aanwezig, maar de API-koppeling is nog niet gebouwd — er worden bewust geen cijfers ingevuld.',
    vars: ['GOOGLE_ADS_DEVELOPER_TOKEN', 'GOOGLE_ADS_REFRESH_TOKEN', 'GOOGLE_ADS_CUSTOMER_ID'],
  };

  const bing: Integration = {
    name: 'Microsoft Advertising',
    what: 'Advertentiekosten van Bing.',
    state: stateOf(['BING_ADS_DEVELOPER_TOKEN', 'BING_ADS_REFRESH_TOKEN']) === 'off' ? 'off' : 'partial',
    detail:
      stateOf(['BING_ADS_DEVELOPER_TOKEN', 'BING_ADS_REFRESH_TOKEN']) === 'off'
        ? 'Niet gekoppeld.'
        : 'Gegevens aanwezig, API-koppeling nog niet gebouwd.',
    vars: ['BING_ADS_DEVELOPER_TOKEN', 'BING_ADS_REFRESH_TOKEN'],
  };

  /*
   * The one row here whose value is worth showing rather than hiding. The rate
   * is not a secret — it is a business decision, and reading it back is the
   * only way to check that production is costing jobs at what you think.
   */
  const fuel: Integration = {
    name: 'Brandstof per klus',
    what: 'Rekent na afronding de reiskosten van een klus uit: heen en terug maal het tarief per kilometer.',
    state: has('GOOGLE_MAPS_API_KEY') ? 'live' : 'off',
    detail: has('GOOGLE_MAPS_API_KEY')
      ? `Tarief: € ${(Number(process.env.FUEL_EUR_PER_KM) > 0 ? Number(process.env.FUEL_EUR_PER_KM) : 0.23)
          .toFixed(2)
          .replace('.', ',')} per km${process.env.FUEL_EUR_PER_KM ? '' : ' (standaard — FUEL_EUR_PER_KM is niet gezet)'}.`
      : 'Zonder Maps-sleutel wordt er geen afstand gemeten en blijft Reis/Brandstof leeg — nooit nul.',
    vars: ['GOOGLE_MAPS_API_KEY', 'FUEL_EUR_PER_KM'],
  };

  const groups: { title: string; items: Integration[] }[] = [
    { title: 'Leads', items: [leadAlert, mail] },
    { title: 'Communicatie', items: [inbound, meta, whatsapp, telegram] },
    { title: 'Advertenties', items: [googleAds, bing] },
    { title: 'Betalingen', items: [payments] },
    { title: 'Kosten', items: [fuel] },
  ];

  const leadsReachNobody = leadAlert.state !== 'live' && mail.state === 'off';

  return (
    <>
      <PageHead
        title="Instellingen"
        sub="Welke koppelingen actief zijn. Deze pagina leest de serverinstellingen — ze toont nooit een sleutel."
      />

      {leadsReachNobody && (
        <Notice tone="bad">
          Er is geen enkel kanaal ingesteld voor nieuwe leads. Een aanvraag wordt
          wel opgeslagen, maar niemand krijgt er bericht van.
        </Notice>
      )}

      <div className={styles.groups}>
        {groups.map((group) => (
          <Card key={group.title}>
            <CardHead>{group.title}</CardHead>
            <ul className={styles.list}>
              {group.items.map((item) => (
                <li key={item.name} className={styles.row}>
                  <span className={`${styles.icon} ${styles[item.state]}`}>
                    {item.state === 'live' ? (
                      <CheckCircle2 size={18} />
                    ) : item.state === 'partial' ? (
                      <AlertTriangle size={18} />
                    ) : (
                      <XCircle size={18} />
                    )}
                  </span>

                  <span className={styles.body}>
                    <span className={styles.name}>
                      {item.name}
                      <span className={`${styles.tag} ${styles[item.state]}`}>
                        {item.state === 'live' ? 'actief' : item.state === 'partial' ? 'deels' : 'uit'}
                      </span>
                    </span>
                    <span className={styles.what}>{item.what}</span>
                    <span className={styles.detail}>{item.detail}</span>
                    <span className={styles.vars}>
                      {item.vars.map((v) => (
                        <code key={v} className={has(v) ? styles.varSet : styles.varMissing}>
                          {v}
                        </code>
                      ))}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <p className={styles.foot}>
        Een grijze naam betekent dat de instelling ontbreekt. Zet ze in Vercel
        onder Project → Settings → Environment Variables; een nieuwe waarde
        werkt pas na de eerstvolgende deploy.
      </p>
    </>
  );
}
