'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Globe, Hash, Plus, Trash2 } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { ui, Card, CardHead, Row, Badge, Empty, Notice } from '../../_ui';

export interface ServerRow {
  id: string;
  name: string;
  technicians: number;
  channels: number;
}

export interface ChannelRow {
  id: string;
  server_id: string;
  name: string;
  slug: string;
  type: 'general' | 'make' | 'region' | 'dm';
  target_make: string | null;
}

const TYPE_LABEL: Record<ChannelRow['type'], string> = {
  general: 'Algemeen',
  make: 'Automerk',
  region: 'Regio',
  dm: 'Gesprek',
};

/**
 * Creating servers and channels.
 *
 * Written straight to Supabase from the browser: 0014's write policies already
 * restrict both tables to owner and kantoor, so an API route would add a hop
 * and re-implement the same check less carefully.
 *
 * A `make` channel is the one that earns the feature. It carries the make it is
 * about, which means a question asked in it reaches the technicians who
 * declared they can do that make — the question routes itself, and that is
 * something a general chat cannot do.
 */
export default function NetworkAdmin({
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

  /** "VW Groep" -> "vw-groep". The slug is what a link is built from. */
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
    return run(
      async () => supabase.from('chat_servers').insert({ name }),
      `Server ${name} aangemaakt.`
    );
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
    run(
      async () => supabase.from('chat_channels').delete().eq('id', channel.id),
      `Kanaal ${channel.name} verwijderd.`
    );

  return (
    <>
      {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}

      {/* ── servers ── */}
      <h2 className={ui.section}>
        <Globe size={16} strokeWidth={1.9} />
        Servers
      </h2>

      <Card>
        {servers.length === 0 && <Empty>Nog geen servers.</Empty>}

        {servers.map((server) => (
          <Row
            key={server.id}
            title={server.name}
            meta={
              <>
                <Badge>{server.technicians} monteur(s)</Badge>
                <Badge>{server.channels} kanaal/kanalen</Badge>
              </>
            }
          />
        ))}

        <div className={ui.row} style={{ gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
          <input
            className={ui.input}
            style={{ width: 220 }}
            placeholder="Land, bijv. België"
            value={serverName}
            onChange={(event) => setServerName(event.target.value)}
          />
          <button
            className={`${ui.btn} ${ui.btnPrimary}`}
            onClick={addServer}
            disabled={busy || !serverName.trim()}
          >
            <Plus size={15} strokeWidth={2.2} />
            Server toevoegen
          </button>
        </div>
      </Card>

      {/* ── channels ── */}
      <h2 className={ui.section}>
        <Hash size={16} strokeWidth={1.9} />
        Kanalen
      </h2>

      <Card>
        {channels.length === 0 && <Empty>Nog geen kanalen.</Empty>}

        {channels.map((channel) => {
          const server = servers.find((s) => s.id === channel.server_id);
          return (
            <Row
              key={channel.id}
              title={`#${channel.name}`}
              note={channel.slug}
              meta={
                <>
                  <Badge tone={channel.type === 'make' ? 'info' : undefined}>
                    {TYPE_LABEL[channel.type]}
                  </Badge>
                  {channel.target_make && <Badge>{channel.target_make}</Badge>}
                  <Badge>{server?.name ?? 'onbekende server'}</Badge>
                </>
              }
              actions={
                canDelete ? (
                  <button
                    className={`${ui.btn} ${ui.btnIcon} ${ui.btnDanger}`}
                    onClick={() => removeChannel(channel)}
                    disabled={busy}
                    title="Kanaal verwijderen — de berichten erin gaan mee"
                  >
                    <Trash2 size={15} strokeWidth={1.9} />
                  </button>
                ) : undefined
              }
            />
          );
        })}

        <div className={ui.row} style={{ gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
          <select
            className={ui.input}
            style={{ width: 150 }}
            value={target}
            onChange={(event) => setTarget(event.target.value)}
          >
            {servers.map((server) => (
              <option key={server.id} value={server.id}>
                {server.name}
              </option>
            ))}
          </select>

          <select
            className={ui.input}
            style={{ width: 140 }}
            value={channelType}
            onChange={(event) => setChannelType(event.target.value as ChannelRow['type'])}
          >
            <option value="general">Algemeen</option>
            <option value="make">Automerk</option>
            <option value="region">Regio</option>
          </select>

          {channelType === 'make' && (
            <select
              className={ui.input}
              style={{ width: 160 }}
              value={make}
              onChange={(event) => setMake(event.target.value)}
            >
              {makes.map((one) => (
                <option key={one}>{one}</option>
              ))}
            </select>
          )}

          <input
            className={ui.input}
            style={{ width: 200 }}
            placeholder={channelType === 'make' ? `bijv. ${make}` : 'Naam van het kanaal'}
            value={channelName}
            onChange={(event) => setChannelName(event.target.value)}
          />

          <button
            className={`${ui.btn} ${ui.btnPrimary}`}
            onClick={addChannel}
            disabled={busy || !channelName.trim() || !target}
          >
            <Plus size={15} strokeWidth={2.2} />
            Kanaal toevoegen
          </button>
        </div>
      </Card>

      <p className={ui.sub} style={{ marginTop: 'var(--sp-4)' }}>
        Een <strong>automerk</strong>-kanaal draagt het merk waar het over gaat. Daardoor bereikt een
        vraag daarin de monteurs die dat merk in <em>Mijn vak</em> hebben opgegeven — de vraag zoekt
        zelf zijn weg, en dat kan een gewone groepschat niet.
      </p>
    </>
  );
}
