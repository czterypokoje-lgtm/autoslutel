import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PageHead, Notice } from '../../_ui';
import brands from '@/lib/brands.json';
import NetworkAdmin, { type ServerRow, type ChannelRow } from './NetworkAdmin';

export const dynamic = 'force-dynamic';

/**
 * Servers and channels, without SQL.
 *
 * Migration 0014 seeded Nederland with three channels and left no way to add a
 * fourth — so "add a #toyota channel" or "open België" meant a hand-written
 * insert against production. For a network meant to grow by make and by
 * country, that is the difference between a feature and a demo.
 *
 * Office only: a channel is a room the whole trade walks into, and who gets to
 * open one is not a technician's call.
 */
export default async function NetwerkBeheerPage() {
  const user = await requireOfficeUser('/admin/netwerk/beheer');
  const supabase = await createSupabaseServerClient();

  const [{ data: servers }, { data: channels }, { data: counts }] = await Promise.all([
    supabase.from('chat_servers').select('id, name, created_at').order('name'),
    supabase
      .from('chat_channels')
      .select('id, server_id, name, slug, type, target_make, created_at')
      .order('name'),
    supabase.from('technicians').select('id, server_id').eq('active', true),
  ]);

  /** How many technicians sit on each server, so deleting one is an informed act. */
  const perServer = new Map<string, number>();
  for (const tech of counts ?? []) {
    if (!tech.server_id) continue;
    perServer.set(tech.server_id, (perServer.get(tech.server_id) ?? 0) + 1);
  }

  const serverRows: ServerRow[] = (servers ?? []).map((server) => ({
    id: server.id,
    name: server.name,
    technicians: perServer.get(server.id) ?? 0,
    channels: (channels ?? []).filter((c) => c.server_id === server.id).length,
  }));

  return (
    <>
      <PageHead
        title="Netwerk beheren"
        sub="Een server is een land — het prijsblad, de btw en het contract verschillen erover. Een kanaal is een onderwerp: een merk, een regio, of gewoon een plek om te praten."
      />

      {serverRows.length === 0 && (
        <Notice tone="bad">
          Er zijn nog geen servers. Voer <code>0014_network.sql</code> uit, of maak er hieronder een.
        </Notice>
      )}

      <NetworkAdmin
        servers={serverRows}
        channels={(channels ?? []) as ChannelRow[]}
        makes={(brands as { make: string }[]).map((b) => b.make)}
        canDelete={user.role === 'owner'}
      />
    </>
  );
}
