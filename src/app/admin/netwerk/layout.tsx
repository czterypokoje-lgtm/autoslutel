import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import styles from './netwerk.module.css';
import NetworkSidebar from './NetworkSidebar';

export const dynamic = 'force-dynamic';

/**
 * The network shell: servers down the left, that server's channels beside it.
 *
 * A server is a country: Nederland, Duitsland, België. The boundary sorts the
 * conversation, not the people — every monteur can read all three (0042).
 * Pricing, VAT and contracts do differ per country, but these channels move
 * knowledge rather than money, and the person who solved this exact car last
 * week is as likely to be over a border as not.
 *
 * Which server you are looking at rides in the URL rather than in state, so a
 * channel link can be shared and the page works before it hydrates. The whole
 * shell is server-rendered for the same reason.
 */
export default async function NetwerkLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<Record<string, string>>;
}) {
  const user = await requireCrmUser('/admin/netwerk');
  const supabase = await createSupabaseServerClient();
  await params;

  const [{ data: servers }, { data: channels }, { data: presence }, { data: me }] =
    await Promise.all([
      supabase.from('chat_servers').select('id, name').order('name'),
      supabase.from('chat_channels').select('id, server_id, name, slug, type').order('name'),
      /*
       * Presence comes from a view, not a count here: chat_servers is
       * readable by every monteur while technicians is not, so this is how a
       * starter account learns four people are online in Nederland without
       * being able to list who they are.
       */
      supabase.from('chat_server_presence').select('server_id, online_count, member_count'),
      /*
       * Whether this monteur may actually open a channel. Mirrors
       * can_access_channel's rule so the UI can lock the door before the
       * database refuses — a list of channels that all error on click is
       * worse than one that says why.
       */
      supabase
        .from('technicians')
        .select('id, verified, technician_subscription (tier)')
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);

  const all = servers ?? [];
  /*
   * Which server is open is decided in the sidebar, not here.
   *
   * This used to pin it to all[0] and filter the channels to match, which
   * meant the server bubbles linked to ?server=<id> and nothing happened —
   * a layout in the App Router is never handed searchParams, so it could not
   * see which one had been picked. Every server therefore showed Nederland's
   * channels. The full list goes down instead and the client component, which
   * can read the query string, does the filtering.
   */
  const isOffice = user.role === 'owner' || user.role === 'kantoor';
  const mine = channels ?? [];

  const tier =
    (me?.technician_subscription as { tier?: string } | { tier?: string }[] | null) ?? null;
  const tierName = Array.isArray(tier) ? tier[0]?.tier : tier?.tier;
  /* Office always in; a monteur needs a paid tier or a verified badge. */
  const canEnter =
    isOffice || me?.verified === true || tierName === 'pro' || tierName === 'premium';

  const presenceById: Record<string, { online: number; members: number }> = {};
  for (const row of presence ?? []) {
    presenceById[row.server_id as string] = {
      online: Number(row.online_count ?? 0),
      members: Number(row.member_count ?? 0),
    };
  }

  const groups: { title: string; type: string; prefix: string }[] = [
    { title: 'Algemeen', type: 'general', prefix: '#' },
    /*
     * Problems before makes: twenty make channels push everything under them
     * off a phone screen, and "mijn programmer doet het niet" is the reason
     * someone opens this at all.
     */
    { title: 'Problemen', type: 'probleem', prefix: '#' },
    { title: 'Automerken', type: 'make', prefix: '#' },
    { title: 'Regio’s', type: 'region', prefix: '#' },
    { title: 'Gesprekken', type: 'dm', prefix: '@' },
  ];

  return (
    <div className={styles.layout}>
      <NetworkSidebar
        servers={all}
        isOffice={isOffice}
        groups={groups}
        channels={mine}
        presence={presenceById}
        canEnter={canEnter}
      />
      <div className={styles.main}>{children}</div>
    </div>
  );
}
