import fs from 'fs';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://a-key-gmbh.com';

const CATEGORIES = [
  '/Autoschluessel',
  '/geeignet-fuer-Alfa-Romeo',
  '/geeignet-fuer-Audi',
  '/geeignet-fuer-BMW',
  '/geeignet-fuer-Bentley',
  '/geeignet-fuer-Buick',
  '/geeignet-fuer-Chrysler',
  '/geeignet-fuer-Citroen',
  '/geeignet-fuer-Dacia',
  '/geeignet-fuer-Dodge',
  '/geeignet-fuer-Fiat',
  '/geeignet-fuer-Ford',
  '/geeignet-fuer-Honda',
  '/geeignet-fuer-Hyundai',
  '/geeignet-fuer-Infiniti',
  '/geeignet-fuer-Jaguar',
  '/geeignet-fuer-Jeep',
  '/geeignet-fuer-Kia',
  '/geeignet-fuer-Lada',
  '/geeignet-fuer-Lancia',
  '/geeignet-fuer-Land-Rover',
  '/geeignet-fuer-Lexus',
  '/geeignet-fuer-Lincoln',
  '/geeignet-fuer-Maserati',
  '/geeignet-fuer-Mazda',
  '/geeignet-fuer-Mercedes-Benz',
  '/geeignet-fuer-Mini',
  '/geeignet-fuer-Mitsubishi',
  '/geeignet-fuer-Nissan',
  '/geeignet-fuer-Opel',
  '/geeignet-fuer-Peugeot',
  '/geeignet-fuer-Porsche',
  '/geeignet-fuer-Renault',
  '/geeignet-fuer-Rover',
  '/geeignet-fuer-Seat',
  '/geeignet-fuer-Skoda',
  '/geeignet-fuer-Smart',
  '/geeignet-fuer-Subaru',
  '/geeignet-fuer-Suzuki',
  '/geeignet-fuer-Toyota',
  '/geeignet-fuer-Volvo',
  '/geeignet-fuer-VW',
  '/Autoschluessel-Funkschluessel',
  '/Batterien',

  '/Boards-fuer-Funkschluessel-PCB',
  '/Funkschluessel-Gehaeuse',
  '/Autoschluesselblatt-Spitze',
  '/Autoschluessel-ohne-Wegfahrsperre',
  '/Garagenoeffner',
  '/IEA-Universal-Fernbedienung',
  '/Microtaster-Antenne',
  '/Notschluessel',
  '/Transponder',
  '/Transponderschluessel',
  '/Zubehoer-Werkzeug',
];

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeCategoryPage(url, page = 1) {
  const pageUrl = `${url}?page=${page}`;
  console.log(`Scraping category page: ${pageUrl}`);
  
  try {
    const { data } = await axios.get(pageUrl);
    const $ = cheerio.load(data);
    const products = [];
    
    $('.productbox').each((i, el) => {
      const productLink = $(el).find('.productbox-title a').attr('href');
      const title = $(el).find('.productbox-title a').text().trim();
      const delivery = $(el).find('.estimated_delivery .value').text().trim();
      const status = $(el).find('.signal_image').text().trim();
      const category = url.replace(BASE_URL, '');
      
      // Filter: 2-3 work day delivery and in stock
      if (delivery.includes('2 - 3') && status.includes('Sofort')) {
        products.push({
          title,
          url: productLink,
          category
        });
      }
    });
    
    // Check if there is a next page
    const hasNext = $('.pagination .next').length > 0;
    
    return { products, hasNext };
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return { products: [], hasNext: false };
    }
    console.error(`Error scraping category ${pageUrl}:`, error.message);
    return { products: [], hasNext: false };
  }
}

async function scrapeProduct(productUrl) {
  try {
    console.log(`Scraping product: ${productUrl}`);
    const { data } = await axios.get(productUrl);
    const $ = cheerio.load(data);
    
    const title = $('h1').text().trim();
    const price = $('.price').first().text().trim();
    
    // Description
    const description = $('#tab-description').html() || '';
    
    // Images
    const images = [];
    $('img').each((i, el) => {
      let src = $(el).attr('src') || $(el).attr('data-src');
      if (src && src.includes('/md/')) {
        // Upgrade medium image to large
        src = src.replace('/md/', '/lg/');
        if (!images.includes(src)) {
          images.push(src);
        }
      }
    });
    
    return { title, url: productUrl, price, description: description.trim(), images };
  } catch (error) {
    console.error(`Error scraping product ${productUrl}:`, error.message);
    return null;
  }
}

async function run() {
  console.log("Starting scraper for A-Key GmbH dropshipping...");
  
  let allValidLinks = [];
  
  // 1. Collect all matching product links
  for (const cat of CATEGORIES) {
    let page = 1;
    let hasNext = true;
    
    while (hasNext) {
      const result = await scrapeCategoryPage(BASE_URL + cat, page);
      
      // Deduplicate links
      for (const p of result.products) {
        if (!allValidLinks.some(existing => existing.url === p.url)) {
          allValidLinks.push(p);
        }
      }
      
      hasNext = result.hasNext;
      page++;
      await delay(500); // polite scraping
    }
  }
  
  console.log(`\nFound ${allValidLinks.length} products matching "2-3 Werktage" and "Sofort verfügbar"`);
  
  // 2. Fetch product details
  const finalProducts = [];
  let counter = 1;
  
  for (const item of allValidLinks) {
    console.log(`[${counter}/${allValidLinks.length}]`);
    const details = await scrapeProduct(item.url);
    if (details) {
      finalProducts.push({
        ...details,
        category: item.category
      });
    }
    counter++;
    await delay(500); // polite scraping
    
    // Save progress every 20 products
    if (counter % 20 === 0) {
      fs.writeFileSync('./a-key-products.json', JSON.stringify(finalProducts, null, 2));
      console.log('Progress saved to a-key-products.json');
    }
  }
  
  fs.writeFileSync('./a-key-products.json', JSON.stringify(finalProducts, null, 2));
  console.log('Scraping complete! Data saved to a-key-products.json');
}

run();
