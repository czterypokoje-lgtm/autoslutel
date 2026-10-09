import { NextResponse } from 'next/server';
import { SITE_CONFIG } from '@/config/site.config';
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
  const urls = sitemapData.map(item => item.url);
  
  /*
   * Host und Schlüssel dieser Domain, nicht der niederländischen.
   *
   * Nach dem Kopieren stand hier www.autosleutel24.nl mit dem dortigen
   * Schlüssel. IndexNow prüft, ob der Schlüssel unter der angegebenen Domain
   * liegt — deutsche Adressen unter dem niederländischen Host einzureichen
   * wäre also eine abgelehnte Anfrage, und im besseren Fall eine, die
   * Adressen für die falsche Seite meldet.
   */
  const key = SITE_CONFIG.analytics.indexNowKey;
  if (!key) {
    return NextResponse.json(
      { error: 'Kein IndexNow-Schlüssel für diese Domain konfiguriert.' },
      { status: 503 }
    );
  }

  const host = new URL(SITE_CONFIG.domain).hostname;
  const payload = {
    host,
    key,
    keyLocation: `${SITE_CONFIG.domain}/${key}.txt`,
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
        message: `${urls.length} URLs submitted successfully to IndexNow.`,
        urls: urls
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
