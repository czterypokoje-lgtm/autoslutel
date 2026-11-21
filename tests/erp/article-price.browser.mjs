import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createClient} from '@supabase/supabase-js';
import {db} from './helpers.mjs';

const base = process.env.ERP_TEST_BASE_URL ?? 'http://localhost:3001';
assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(base).hostname));
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
assert.equal(new URL(url).hostname,'ysrebelulbmnbzyvnsic.supabase.co');
const auth = createClient(url,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const {data,error} = await auth.auth.signInWithPassword({email:process.env.CRM_TEST_EMAIL,password:process.env.CRM_TEST_PASSWORD});
assert.ifError(error);
const {chromium} = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({channel:'chrome',headless:true});
const code = 'AS24-3-'+Date.now();
const name = 'Prijsacceptatie '+code;
let seeded = false;
try {
  assert.ifError((await db.from('kfc_articles').insert({code,name,sale_price_cents:1500})).error);
  seeded = true;
  const page = await browser.newPage();
  page.setDefaultTimeout(45000);
  await page.context().addCookies([{url:base,name:'sb-ysrebelulbmnbzyvnsic-auth-token',value:'base64-'+Buffer.from(JSON.stringify(data.session)).toString('base64url')}]);
  const api = base+'/api/admin/article-price?code='+code;
  assert.equal((await fetch(api)).status,401);
  async function openArticle() {
    await page.goto(base+'/admin/voorraad',{waitUntil:'domcontentloaded'});
    await page.locator('#stock-search').fill(code);
    await page.getByRole('button',{name:new RegExp(name)}).first().click();
    await page.waitForFunction(code=>document.querySelector('label[for="article-sale-price"]')?.textContent.includes(code) && !document.querySelector('#article-sale-price').disabled,code);
    return page.locator('#article-sale-price');
  }
  const price = await openArticle();
  assert.equal(await price.inputValue(),'15,00');
  await price.fill('19,95');
  await page.getByRole('button',{name:'Prijs opslaan'}).click();
  await page.getByText('Prijs opgeslagen.',{exact:true}).waitFor();
  assert.equal((await db.from('kfc_articles').select('sale_price_cents').eq('code',code).single()).data.sale_price_cents,1995);
  assert.equal(await (await openArticle()).inputValue(),'19,95');
  assert.equal((await page.request.patch(api,{data:{previous:1500,cents:1000}})).status(),409);
  assert.equal((await page.request.patch(api,{data:{previous:1995,cents:-1}})).status(),400);
  assert.deepEqual(await (await page.request.get(api)).json(),{cents:1995});
  console.log('PASS: edit, save, reopen, persisted cents, conflict, invalid price and access control');
} finally {
  await browser.close();
  if(seeded) assert.ifError((await db.from('kfc_articles').delete().eq('code',code)).error);
}
