const axios = require('axios');
async function test() {
  const { data } = await axios.get('https://a-key-gmbh.com/Funkschluessel-kompatibel-fuer-Audi-AUR114X');
  console.log("Any language switchers?", data.includes('lang="nl"') || data.match(/<a[^>]*href="[^"]*lang=[^"]*"[^>]*>/g));
}
test();
