import axios from 'axios';
import * as cheerio from 'cheerio';

async function getLinks() {
  const { data } = await axios.get('https://a-key-gmbh.com');
  const $ = cheerio.load(data);
  const links = new Set();
  
  // Find all category menu items
  $('.nav-item a, .dropdown-item, .category-link, .nav-link').each((i, el) => {
    let href = $(el).attr('href');
    if (href) {
      if (href.startsWith('https://a-key-gmbh.com/')) {
        href = href.replace('https://a-key-gmbh.com', '');
      }
      if (href.startsWith('/geeignet-fuer-') || href.includes('schluessel') || href.includes('Gehaeuse') || href.includes('Transponder') || href.includes('Werkzeug')) {
        links.add(href);
      }
    }
  });
  
  console.log("Total unique category links found:", links.size);
  console.log(Array.from(links).join('\n'));
}

getLinks();
