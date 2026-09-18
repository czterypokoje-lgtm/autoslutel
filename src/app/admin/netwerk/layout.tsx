import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import styles from './netwerk.module.css';
import NetworkSidebar from './NetworkSidebar';

export const dynamic = 'force-dynamic';

/**
 * The network shell: servers down the left, that server's channels beside it.
 *
 * A server is a country. Nederland today, België and Deutschland later — and
 * that boundary is not decoration: the price list, the VAT and the contract all
 * differ across it, so a technician in Antwerp has no business in the Dutch
 * pricing channel.
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

  const [{ data: servers }, { data: channels }] = await Promise.all([
    supabase.from('chat_servers').select('id, name').order('name'),
    supabase.from('chat_channels').select('id, server_id, name, slug, type').order('name'),
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
  const mine = channels ?? [];

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

  const isOffice = user.role === 'owner' || user.role === 'kantoor';

  return (
    <div className={styles.layout}>
      <NetworkSidebar servers={all} isOffice={isOffice} groups={groups} channels={mine} />
      <div className={styles.main}>{children}</div>
    </div>
  );
}
