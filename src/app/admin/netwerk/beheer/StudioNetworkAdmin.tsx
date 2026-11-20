'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Globe, Hash, Plus, Trash2 } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import type { ServerRow, ChannelRow } from './NetworkAdmin';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PreviewText } from '../../PreviewLanguage';

const TYPE_LABEL: Record<ChannelRow['type'], string> = {
  general: 'Algemeen',
  make: 'Automerk',
  region: 'Regio',
  dm: 'Gesprek',
};

/**
 * Studio restyle of NetworkAdmin: same direct Supabase writes (0014's RLS
 * does the access check) and the same add/remove calls — only the markup
 * changes, onto shadcn Card/Select/Input/Button.
 */
export default function StudioNetworkAdmin({
  servers,
  channels,
  makes,
  canDelete,
}: {
  servers: ServerRow[];
  channels: ChannelRow[];
  makes: string[];
  canDelete: boolean;
}) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ text: string; tone: 'ok' | 'bad' } | null>(null);

  const [serverName, setServerName] = useState('');
  const [target, setTarget] = useState(servers[0]?.id ?? '');
  const [channelName, setChannelName] = useState('');
  const [channelType, setChannelType] = useState<ChannelRow['type']>('general');
  const [make, setMake] = useState(makes[0] ?? '');

  const slugify = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40);

  async function run(work: () => Promise<{ error: { message: string } | null }>, done: string) {
    setBusy(true);
    setNotice(null);
    const { error } = await work();
    setBusy(false);

    if (error) {
      setNotice({
        text: /duplicate key/i.test(error.message)
          ? 'Er bestaat al een kanaal met die naam op deze server.'
          : /does not exist|relation/i.test(error.message)
            ? 'Voer supabase/migrations/0014_network.sql uit.'
            : error.message,
        tone: 'bad',
      });
      return;
    }
    setNotice({ text: done, tone: 'ok' });
    router.refresh();
  }

  const addServer = () => {
    const name = serverName.trim();
    if (!name) return;
    setServerName('');
    return run(async () => supabase.from('chat_servers').insert({ name }), `Server ${name} aangemaakt.`);
  };

  const addChannel = () => {
    const name = channelName.trim();
    if (!name || !target) return;
    setChannelName('');
    return run(
      async () =>
        supabase.from('chat_channels').insert({
          server_id: target,
          name,
          slug: slugify(name),
          type: channelType,
          target_make: channelType === 'make' ? make : null,
        }),
      `Kanaal ${name} aangemaakt.`
    );
  };

  const removeChannel = (channel: ChannelRow) =>
    run(async () => supabase.from('chat_channels').delete().eq('id', channel.id), `Kanaal ${channel.name} verwijderd.`);

  return (
    <div className="flex flex-col gap-6">
      {notice && (
        <p className={notice.tone === 'bad' ? 'text-destructive text-sm' : 'text-emerald-700 text-sm dark:text-emerald-400'}>
          {notice.text}
        </p>
      )}

      {/* ── servers ── */}
      <div className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold"><Globe className="size-4" /> <PreviewText>Servers</PreviewText></h2>
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6">
            {servers.length === 0 && <p className="text-muted-foreground text-sm"><PreviewText>Nog geen servers.</PreviewText></p>}

            {servers.map((server) => (
              <div key={server.id} className="flex items-center justify-between gap-3 border-t pt-3 first:border-t-0 first:pt-0">
                <span className="font-medium">{server.name}</span>
                <div className="flex gap-1.5">
                  <Badge variant="secondary">{`${server.technicians} monteur(s)`}</Badge>
                  <Badge variant="secondary">{`${server.channels} kanaal/kanalen`}</Badge>
                </div>
              </div>
            ))}

            <div className="flex flex-wrap items-center gap-2 border-t pt-3">
              <Input
                className="w-56"
                placeholder="Land, bijv. België"
                value={serverName}
                onChange={(event) => setServerName(event.target.value)}
              />
              <Button onClick={addServer} disabled={busy || !serverName.trim()}>
                <Plus data-icon="inline-start" /> <PreviewText>Server toevoegen</PreviewText>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── channels ── */}
      <div className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold"><Hash className="size-4" /> <PreviewText>Kanalen</PreviewText></h2>
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6">
            {channels.length === 0 && <p className="text-muted-foreground text-sm"><PreviewText>Nog geen kanalen.</PreviewText></p>}

            {channels.map((channel) => {
              const server = servers.find((s) => s.id === channel.server_id);
              return (
                <div key={channel.id} className="flex flex-wrap items-center justify-between gap-3 border-t pt-3 first:border-t-0 first:pt-0">
                  <div className="flex flex-col">
                    <span className="font-medium">{`#${channel.name}`}</span>
                    <span className="text-muted-foreground text-xs">{channel.slug}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge
                      variant="outline"
                      className={
                        channel.type === 'make'
                          ? 'border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/15 dark:text-blue-300'
                          : undefined
                      }
                    >
                      {TYPE_LABEL[channel.type]}
                    </Badge>
                    {channel.target_make && <Badge variant="secondary">{channel.target_make}</Badge>}
                    <Badge variant="secondary">{server?.name ?? 'onbekende server'}</Badge>
                    {canDelete && (
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => removeChannel(channel)}
                        disabled={busy}
                        title="Kanaal verwijderen — de berichten erin gaan mee"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}

            <div className="flex flex-wrap items-center gap-2 border-t pt-3">
              <Select value={target} onValueChange={setTarget}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {servers.map((server) => (
                    <SelectItem key={server.id} value={server.id}>{server.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={channelType} onValueChange={(v) => setChannelType(v as ChannelRow['type'])}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general"><PreviewText>Algemeen</PreviewText></SelectItem>
                  <SelectItem value="make"><PreviewText>Automerk</PreviewText></SelectItem>
                  <SelectItem value="region"><PreviewText>Regio</PreviewText></SelectItem>
                </SelectContent>
              </Select>

              {channelType === 'make' && (
                <Select value={make} onValueChange={setMake}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {makes.map((one) => (
                      <SelectItem key={one} value={one}>{one}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Input
                className="w-52"
                placeholder={channelType === 'make' ? `bijv. ${make}` : 'Naam van het kanaal'}
                value={channelName}
                onChange={(event) => setChannelName(event.target.value)}
              />

              <Button onClick={addChannel} disabled={busy || !channelName.trim() || !target}>
                <Plus data-icon="inline-start" /> <PreviewText>Kanaal toevoegen</PreviewText>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="text-muted-foreground text-sm">
        <PreviewText>Een</PreviewText> <strong className="text-foreground"><PreviewText>automerk</PreviewText></strong>
        <PreviewText>
          -kanaal draagt het merk waar het over gaat. Daardoor bereikt een vraag daarin de monteurs die dat merk in Mijn vak
          hebben opgegeven — de vraag zoekt zelf zijn weg, en dat kan een gewone groepschat niet.
        </PreviewText>
      </p>
    </div>
  );
}
