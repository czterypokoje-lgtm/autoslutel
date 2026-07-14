import { NextResponse } from 'next/server';
import sitemap from '../../sitemap';

export async function GET() {
  // Get all URLs from the sitemap dynamically
  const sitemapData = sitemap();
  const urls = sitemapData.map(item => item.url);
  
  const payload = {
    host: "www.autosleutel24.nl",
    key: "3afd2ed80ce14931a7e74761f40741d6",
    keyLocation: "https://www.autosleutel24.nl/3afd2ed80ce14931a7e74761f40741d6.txt",
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
