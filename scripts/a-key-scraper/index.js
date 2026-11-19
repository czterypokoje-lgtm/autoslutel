const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const BASE_URL = 'https://a-key-gmbh.com';

const CATEGORIES = [
  '/Autoschluessel',
  '/Batterien',
  '/Autoschluessel-Funkschluessel',
  '/Zubehoer'
  // More can be added
];

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeCategory(url) {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const products = [];
    
    $('.productbox').each((i, el) => {
      const productLink = $(el).find('.productbox-title a').attr('href');
      const title = $(el).find('.productbox-title a').text().trim();
      const delivery = $(el).find('.estimated_delivery .value').text().trim();
      const status = $(el).find('.signal_image').text().trim();
      
      // Filter: 2-3 work day delivery and in stock
      if (delivery.includes('2 - 3') && status.includes('Sofort')) {
        products.push(productLink);
      }
    });
    
    return products;
  } catch (error) {
    console.error(`Error scraping category ${url}:`, error.message);
    return [];
  }
}

async function scrapeProduct(url) {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    
    const title = $('h1.product-title').text().trim();
    const price = $('.product-price .price').text().trim();
    
    // Description
    const description = $('#tab-description').html() || $('.desc').html() || '';
    
    // Images
    const images = [];
    $('.product-images img').each((i, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src');
      if (src && !images.includes(src)) {
        images.push(src);
      }
    });
    
    return { title, url, price, description: description.trim(), images };
  } catch (error) {
    console.error(`Error scraping product ${url}:`, error.message);
    return null;
  }
}

async function run() {
  console.log("Starting scraper...");
  const validProductLinks = await scrapeCategory(BASE_URL + CATEGORIES[0]);
  console.log(`Found ${validProductLinks.length} valid products in ${CATEGORIES[0]}`);
  
  if (validProductLinks.length > 0) {
    const pInfo = await scrapeProduct(validProductLinks[0]);
    console.log("Sample product scraped:", pInfo.title, pInfo.images);
  }
}

run();
