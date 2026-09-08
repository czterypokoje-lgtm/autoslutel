import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import Link from 'next/link';
import styles from './netwerk.module.css';

export const dynamic = 'force-dynamic';

export default async function NetwerkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireCrmUser('/admin/netwerk');
  const supabase = await createSupabaseServerClient();

  // Fetch servers the user can see
  const { data: servers } = await supabase
    .from('chat_servers')
    .select('id, name')
    .order('name');

  // Fetch channels the user can see
  const { data: channels } = await supabase
    .from('chat_channels')
    .select('id, server_id, name, slug, type')
    .order('name');

  // In a real Discord, we'd filter channels by access.
  // For now we rely on the DB returning only accessible channels,
  // or we filter them if the RLS allows reading all.
  // We'll group them by type.
  
  const generalChannels = channels?.filter(c => c.type === 'general') || [];
  const makeChannels = channels?.filter(c => c.type === 'make') || [];
  const regionChannels = channels?.filter(c => c.type === 'region') || [];
  const dmChannels = channels?.filter(c => c.type === 'dm') || [];

  return (
    <div className={styles.layout}>
      {/* Servers Sidebar */}
      <div className={styles.serversSidebar}>
        {servers?.map(s => (
          <div key={s.id} className={styles.serverBubble} title={s.name}>
            {s.name.substring(0, 2).toUpperCase()}
          </div>
        ))}
      </div>

      {/* Channels Sidebar */}
      <div className={styles.channelsSidebar}>
        <div className={styles.serverHeader}>
          {servers?.[0]?.name || 'Netwerk'}
        </div>

        <div className={styles.channelList}>
          {generalChannels.length > 0 && (
            <div className={styles.channelGroup}>
              <div className={styles.groupTitle}>Algemeen</div>
              {generalChannels.map(c => (
                <Link key={c.id} href={`/admin/netwerk/${c.id}`} className={styles.channelLink}>
                  <span className={styles.hash}>#</span> {c.name}
                </Link>
              ))}
            </div>
          )}

          {makeChannels.length > 0 && (
            <div className={styles.channelGroup}>
              <div className={styles.groupTitle}>Automerken</div>
              {makeChannels.map(c => (
                <Link key={c.id} href={`/admin/netwerk/${c.id}`} className={styles.channelLink}>
                  <span className={styles.hash}>#</span> {c.name}
                </Link>
              ))}
            </div>
          )}

          {regionChannels.length > 0 && (
            <div className={styles.channelGroup}>
              <div className={styles.groupTitle}>Regio's</div>
              {regionChannels.map(c => (
                <Link key={c.id} href={`/admin/netwerk/${c.id}`} className={styles.channelLink}>
                  <span className={styles.hash}>#</span> {c.name}
                </Link>
              ))}
            </div>
          )}

          {dmChannels.length > 0 && (
            <div className={styles.channelGroup}>
              <div className={styles.groupTitle}>Direct Messages</div>
              {dmChannels.map(c => (
                <Link key={c.id} href={`/admin/netwerk/${c.id}`} className={styles.channelLink}>
                  <span className={styles.hash}>@</span> {c.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={styles.main}>
        {children}
      </div>
    </div>
  );
}
