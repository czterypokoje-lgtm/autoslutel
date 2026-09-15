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
   * A monteur belongs to one server; the office sees them all and lands on the
   * first. There is no server switcher for a technician because there is
   * nothing to switch to — showing one they cannot enter is a dead end.
   */
  const active = all[0] ?? null;
  const mine = (channels ?? []).filter((c) => !active || c.server_id === active.id);

  const groups: { title: string; type: string; prefix: string }[] = [
    { title: 'Algemeen', type: 'general', prefix: '#' },
    { title: 'Automerken', type: 'make', prefix: '#' },
    { title: 'Regio’s', type: 'region', prefix: '#' },
    { title: 'Gesprekken', type: 'dm', prefix: '@' },
  ];

  const isOffice = user.role === 'owner' || user.role === 'kantoor';

  return (
    <div className={styles.layout}>
      <NetworkSidebar servers={all} active={active} isOffice={isOffice} groups={groups} channels={mine} />
      <div className={styles.main}>{children}</div>
    </div>
  );
}
