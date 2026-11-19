import { NextResponse } from 'next/server';
import sitemap from '../../sitemap';
import { isAuthorized } from '@/lib/adminAuth';

/**
 * Pushes the sitemap to IndexNow. An operator action, not a public one.
 *
 * It was unauthenticated: anyone could call it, and every call submits ~190
 * URLs under our own IndexNow key. Repeated at speed that is our key being
 * used to spam the endpoint, and the penalty for that lands on this domain.
 * Gated on the same credential the other ops endpoints use.
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 401 });
  }

  // Get all URLs from the sitemap dynamically
  const sitemapData = sitemap();
  const siteUrls = sitemapData.map(item => item.url);

  /*
   * The webshop (/webshop, its own deployment) has its own sitemap, served on
   * this domain through the rewrite. Same host, so the same key covers it.
   * A failed fetch only leaves the shop out of this run.
   */
  const shopUrls = await fetch('https://www.autosleutel24.nl/webshop/sitemap.xml', { cache: 'no-store', signal: AbortSignal.timeout(10000) })
    .then((r) => (r.ok ? r.text() : ''))
    .then((xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!))
    .catch(() => [] as string[]);

  // IndexNow takes at most 10,000 URLs per request.
  const urls = [...new Set([...siteUrls, ...shopUrls])].slice(0, 10000);

  // The key Bing Webmaster Tools issued (22-10-2026); the older 3afd2ed8… file stays valid too.
  const payload = {
    host: "www.autosleutel24.nl",
    key: "f91704150cbe4f6a92a9e841b2f61d5d",
    keyLocation: "https://www.autosleutel24.nl/f91704150cbe4f6a92a9e841b2f61d5d.txt",
    urlList: urls
  };
  
  try {
    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(payload)
    });
    
    if (response.status === 200 || response.status === 202) {
      return NextResponse.json({ 
        success: true, 
        message: `${urls.length} URLs submitted to IndexNow (${shopUrls.length} from the webshop).`,
      });
    } else {
      const text = await response.text();
      return NextResponse.json({ 
        success: false, 
        status: response.status, 
        error: text || 'Failed to submit to IndexNow.' 
      }, { status: response.status });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
