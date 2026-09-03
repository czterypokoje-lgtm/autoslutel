import axios from 'axios';
import * as cheerio from 'cheerio';

const url = 'https://a-key-gmbh.com/geeignet-fuer-MAZDA_1';
const pagedUrl = `${url}?page=1`;

async function test() {
  const { data } = await axios.get(pagedUrl);
  const $ = cheerio.load(data);
  
  const products = [];
  $('.productbox').each((i, el) => {
    const productLink = $(el).find('.productbox-title a').attr('href');
    const title = $(el).find('.productbox-title a').text().trim();
    const delivery = $(el).find('.estimated_delivery .value').text().trim();
    const status = $(el).find('.signal_image').text().trim();
    
    if (delivery.includes('2 - 3') && status.includes('Sofort')) {
      products.push(title);
    }
  });
  console.log("Found:", products);
}
test();
