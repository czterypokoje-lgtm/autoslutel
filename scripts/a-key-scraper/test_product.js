const axios = require('axios');
const cheerio = require('cheerio');
async function test() {
  const { data } = await axios.get('https://a-key-gmbh.com/AUB101-Board-geeignet-fuer-Audi-A6L-Q7-3-Tasten-mit-8E-chip-315mhz-434mhz-FSK');
  const $ = cheerio.load(data);
  console.log("High res images:", $('a[data-gallery]').map((i, el) => $(el).attr('href')).get());
}
test();
