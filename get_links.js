const axios = require('axios');
const cheerio = require('cheerio');

axios.get('https://a-key-gmbh.com').then(r => {
  const $ = cheerio.load(r.data);
  const links = new Set();
  
  // Find all sidebar or header navigation links
  $('.nav-item a.nav-link').each((i, el) => {
    const href = $(el).attr('href');
    if (href && href.startsWith('https://a-key-gmbh.com/')) {
      links.add(href.replace('https://a-key-gmbh.com', ''));
    }
  });
  
  console.log(Array.from(links).join('\n'));
});
