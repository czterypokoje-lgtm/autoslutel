const axios = require('axios');
const cheerio = require('cheerio');
async function test() {
  const { data } = await axios.get('https://a-key-gmbh.com/Ersatzschluessel-geeignet-fuer-BMW-Smartkey-F-G-Serie-3-Tasten-868-MHz-ID47-PCF7953-Keyless-Go-inkl-Notschluessel');
  const $ = cheerio.load(data);
  console.log("H1 text:", $('h1').text().trim());
  console.log("Images:", $('img').map((i, el) => $(el).attr('src')).get().filter(s => s.includes('produkt')));
  console.log("Tabs:", $('.nav-tabs').text());
}
test();
