import type { Metadata } from 'next';

/*
 * Internal tooling: the offline-conversion export for Google Ads.
 *
 * It was indexable, carried the site's default commercial title and had no
 * H1 at all. Nothing links to it but the proxy, yet "index, follow" is an
 * invitation Google accepts whenever it finds the URL anywhere -- and the
 * page lists lead ids and click ids.
 */
export const metadata: Metadata = {
  title: 'Offline conversies exporteren',
  robots: 'noindex, nofollow',
};

export default function OfflineConversionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
