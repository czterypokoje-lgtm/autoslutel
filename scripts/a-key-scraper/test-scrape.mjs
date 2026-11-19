import axios from 'axios';
import * as cheerio from 'cheerio';

async function test() {
  const url = 'https://a-key-gmbh.com/geeignet-fuer-MAZDA_1?p=1';
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);
  
  $('.productbox').each((i, el) => {
    const title = $(el).find('.productbox-title a').text().trim();
    const delivery = $(el).find('.estimated_delivery .value').text().trim();
    const status = $(el).find('.signal_image').text().trim();
    
    console.log(`Title: ${title}`);
    console.log(`Delivery: ${delivery}`);
    console.log(`Status: ${status}`);
    console.log(`Valid: ${delivery.includes('2 - 3') && status.includes('Sofort')}`);
    console.log('---');
  });
}
test();
