const https = require('https');

const urls = [
    "https://a-key-gmbh.com/OBDSTAR-Zubehoer",
    "https://a-key-gmbh.com/XHORSE-Zubehoer",
    "https://a-key-gmbh.com/Zed-FULL-Zubehoer",
    "https://a-key-gmbh.com/Autel-Zubehoer"
];

function fetchHTML(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

async function scrape() {
    const results = [];
    for (let url of urls) {
        const brand = url.split('/').pop().split('-')[0];
        const html = await fetchHTML(url);
        
        // Very basic regex scraping
        const regex = /class="product-title"[^>]*>\s*<a href="([^"]+)"[^>]*>(.*?)<\/a>/gs;
        let match;
        while ((match = regex.exec(html)) !== null) {
            results.push({
                brand: brand,
                link: match[1],
                title: match[2].trim()
            });
        }
    }
    console.log(JSON.stringify(results, null, 2));
}

scrape();
