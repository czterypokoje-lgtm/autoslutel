import { PreviewText } from '@/app/admin/PreviewLanguage';
import { requireOfficeUser } from '@/lib/crmSession';
import { STUDIO_UI } from '@/config/install';
import { PageHead, Card, CardHead, Notice } from '../_ui';
import styles from './instellingen.module.css';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Card as SCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
    { title: 'Communicatie', items: [whatsapp, telegram] },
    { title: 'Advertenties', items: [googleAds, bing] },
    { title: 'Betalingen', items: [payments] },
    { title: 'Kosten', items: [fuel] },
  ];

  const leadsReachNobody = leadAlert.state !== 'live' && mail.state === 'off';

  if (STUDIO_UI) {
    const stateBadge = (state: State) => (
      <Badge
        variant={state === 'off' ? 'destructive' : 'outline'}
        className={
          state === 'live'
            ? 'border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300'
            : state === 'partial'
              ? 'border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-300'
              : undefined
        }
      >
        {state === 'live' ? <CheckCircle2 data-icon="inline-start" /> : state === 'partial' ? <AlertTriangle data-icon="inline-start" /> : <XCircle data-icon="inline-start" />}
        <PreviewText>{state === 'live' ? 'actief' : state === 'partial' ? 'deels' : 'uit'}</PreviewText>
      </Badge>
    );

    return (
      <div className="kfc-neutral flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl leading-none font-medium tracking-tight"><PreviewText>Instellingen</PreviewText></h1>
          <p className="text-muted-foreground text-sm">
            <PreviewText>Welke koppelingen actief zijn. Deze pagina leest de serverinstellingen — ze toont nooit een sleutel.</PreviewText>
          </p>
        </div>

        {leadsReachNobody && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <PreviewText>
              Er is geen enkel kanaal ingesteld voor nieuwe leads. Een aanvraag wordt wel opgeslagen, maar niemand krijgt er
              bericht van.
            </PreviewText>
          </p>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          {groups.map((group) => (
            <SCard key={group.title}>
              <CardHeader>
                <CardTitle><PreviewText>{group.title}</PreviewText></CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {group.items.map((item, i) => (
                  <div key={item.name} className={i > 0 ? 'flex flex-col gap-1.5 border-t pt-4' : 'flex flex-col gap-1.5'}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium"><PreviewText>{item.name}</PreviewText></span>
                      {stateBadge(item.state)}
                    </div>
                    <p className="text-muted-foreground text-sm"><PreviewText>{item.what}</PreviewText></p>
                    <p className="text-sm"><PreviewText>{item.detail}</PreviewText></p>
                    <div className="flex flex-wrap gap-1.5">
                      {item.vars.map((v) => (
                        <code
                          key={v}
                          className={`rounded border px-1.5 py-0.5 text-xs ${has(v) ? 'border-border text-foreground' : 'border-dashed text-muted-foreground'}`}
                        >
                          {v}
                        </code>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </SCard>
          ))}
        </div>

        <p className="text-muted-foreground text-sm">
          <PreviewText>
            Een grijze naam betekent dat de instelling ontbreekt. Zet ze in Vercel onder Project → Settings → Environment
            Variables; een nieuwe waarde werkt pas na de eerstvolgende deploy.
          </PreviewText>
        </p>
      </div>
    );
  }

  return (
    <>
      <PageHead
        title="Instellingen"
        sub="Welke koppelingen actief zijn. Deze pagina leest de serverinstellingen — ze toont nooit een sleutel."
      />

      {leadsReachNobody && (
        <Notice tone="bad">
          <PreviewText>{"Er is geen enkel kanaal ingesteld voor nieuwe leads. Een aanvraag wordt wel opgeslagen, maar niemand krijgt er bericht van."}</PreviewText>
        </Notice>
      )}

      <div className={styles.groups}>
        {groups.map((group) => (
          <Card key={group.title}>
            <CardHead><PreviewText>{group.title}</PreviewText></CardHead>
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
                      <PreviewText>{item.name}</PreviewText>
                      <span className={`${styles.tag} ${styles[item.state]}`}>
                        <PreviewText>{item.state === 'live' ? 'actief' : item.state === 'partial' ? 'deels' : 'uit'}</PreviewText>
                      </span>
                    </span>
                    <span className={styles.what}><PreviewText>{item.what}</PreviewText></span>
                    <span className={styles.detail}><PreviewText>{item.detail}</PreviewText></span>
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
        <PreviewText>{"Een grijze naam betekent dat de instelling ontbreekt. Zet ze in Vercel onder Project → Settings → Environment Variables; een nieuwe waarde werkt pas na de eerstvolgende deploy."}</PreviewText>
      </p>
    </>
  );
}
