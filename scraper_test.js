const https = require('https');
const cheerio = require('cheerio');

https.get('https://a-key-gmbh.com/geeignet-fuer-BMW', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const $ = cheerio.load(data);
    const box = $('.productbox').first().html();
    console.log(box);
  });
}).on('error', (err) => console.error(err));
