import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { DEMO_BOT_AGENT, demoChannels, isDemoChannel } from '@/lib/kfcDemoBotRules';
import { PreviewText } from '../PreviewLanguage';
import { runDemoBot } from './actions';

export const dynamic = 'force-dynamic';

export default async function AgentCenter({ searchParams }: {
  searchParams: Promise<{ channel?: string; lang?: string; error?: string }>;
}) {
  const user = await requireCrmUser('/admin/agent-centrum');
  if (user.role !== 'owner' || process.env.KFC_DEMO_MODE !== '1') notFound();
  const params = await searchParams;
  const channel = isDemoChannel(params.channel) ? params.channel : 'chat';
  const language = params.lang === 'en' ? 'en' : 'nl';
  const storedChannel = channel === 'chat' ? 'web' : channel;
  const [gateway, browser, history] = await Promise.all([
    fetch('http://127.0.0.1:18789/healthz', { cache: 'no-store', signal: AbortSignal.timeout(1000) })
      .then(async (response) => response.ok && (await response.json()).status === 'live').catch(() => false),
    fetch('http://127.0.0.1:18800/json/version', { cache: 'no-store', signal: AbortSignal.timeout(1000) })
      .then(async (response) => response.ok && typeof (await response.json()).Browser === 'string').catch(() => false),
    createSupabaseAdminClient().from('agent_conversations').select('conversation_id,summary,transcript,metadata')
      .eq('metadata->kfc_call_review->>agent_id', DEMO_BOT_AGENT).eq('channel', storedChannel)
      .order('created_at', { ascending: false }).limit(5),
  ]);

  return <div className="grid max-w-3xl gap-4">
    <header><h1 className="text-2xl font-semibold"><PreviewText>Agentcentrum</PreviewText></h1></header>
    <Card>
      <CardHeader><CardTitle>OpenClaw</CardTitle>
        <CardDescription className="flex flex-wrap gap-3">
          <PreviewText>{gateway ? 'Gateway bereikbaar' : 'Gateway niet bereikbaar'}</PreviewText>
          <PreviewText>{browser ? 'Browser bereikbaar' : 'Browser niet bereikbaar'}</PreviewText>
        </CardDescription>
      </CardHeader>
    </Card>
    <Card>
      <CardHeader><CardTitle><PreviewText>Kanaalsimulatie</PreviewText></CardTitle>
        <CardDescription><PreviewText>Gebruik uitsluitend voorbeeldgegevens. Er wordt geen bericht verstuurd.</PreviewText></CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <nav className="flex flex-wrap gap-2">
          {Object.entries(demoChannels).map(([key, [label]]) => <Button key={key} variant={key === channel ? 'default' : 'outline'} asChild>
            <Link href={'?' + new URLSearchParams({ lang: language, channel: key })} aria-current={key === channel ? 'page' : undefined}>
              <PreviewText>{label}</PreviewText>
            </Link>
          </Button>)}
        </nav>
        {params.error && <p role="alert" className="text-sm text-destructive"><PreviewText>
          {params.error === 'input' ? 'Controleer de invoer en probeer opnieuw.' : 'De bot kon het verzoek niet verwerken.'}
        </PreviewText></p>}
        <form className="grid gap-3" action={runDemoBot}>
          <input type="hidden" name="channel" value={channel} />
          <label className="grid gap-1 text-sm"><PreviewText>Klantbericht</PreviewText>
            <textarea className="min-h-20 rounded-md border bg-background p-2" name="message" required maxLength={700} />
          </label>
          <div className="grid gap-2 sm:grid-cols-3">
            {([['order','Bestelnummer',21],['email','E-mailadres',254],['postcode','Postcode',16],['sku','SKU',40],['vehicle','Merk, model en bouwjaar',100]] as const)
              .map(([name, label, length]) => <label key={name} className="grid gap-1 text-sm"><PreviewText>{label}</PreviewText>
                <input className="min-w-0 rounded-md border bg-background p-2" name={name} maxLength={length} autoComplete="off" />
              </label>)}
            <label className="grid gap-1 text-sm"><PreviewText>Taal van het antwoord</PreviewText>
              <select className="rounded-md border bg-background p-2" name="lang" defaultValue={language}>
                <option value="nl">Nederlands</option><option value="en">English</option>
              </select>
            </label>
          </div>
          <Button type="submit" className="w-fit"><PreviewText>Vraag aan bot</PreviewText></Button>
        </form>
      </CardContent>
    </Card>
    <Card>
      <CardHeader><CardTitle><PreviewText>Recente voorbeeldgesprekken</PreviewText></CardTitle></CardHeader>
      <CardContent className="grid gap-3">
        {history.error ? <p><PreviewText>Gegevens niet beschikbaar</PreviewText></p> : !history.data.length ? <p><PreviewText>Nog geen voorbeeldgesprekken</PreviewText></p> :
          history.data.map((item) => <article key={item.conversation_id} className="grid gap-2 rounded-md border p-3 text-sm">
            <p className="text-muted-foreground whitespace-pre-wrap">{Array.isArray(item.transcript) ? item.transcript[0]?.message : ''}</p>
            <p className="whitespace-pre-wrap">{item.summary}</p>
            <Link className="w-fit underline" href={'/admin/bot-conversations?call=' + encodeURIComponent(item.conversation_id)}>
              <PreviewText>Open gesprek</PreviewText>
            </Link>
          </article>)}
      </CardContent>
    </Card>
  </div>;
}
