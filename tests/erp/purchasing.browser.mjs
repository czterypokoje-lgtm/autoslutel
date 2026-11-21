import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { db } from './helpers.mjs';
import { createRequire } from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base=process.env.ERP_TEST_BASE_URL || 'http://127.0.0.1:3011';
const anon=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const {data,error}=await anon.auth.signInWithPassword({email:process.env.CRM_TEST_EMAIL,password:process.env.CRM_TEST_PASSWORD});assert.ifError(error);
const browser=await chromium.launch({channel:'chrome',headless:true});
const prefix='REF-'+Date.now().toString(36).toUpperCase();
const context=await browser.newContext(); const page=await context.newPage(); page.setDefaultTimeout(30000); const created=[];
let order;
try{
await page.context().addCookies([{url:base,name:'sb-ysrebelulbmnbzyvnsic-auth-token',value:'base64-'+Buffer.from(JSON.stringify(data.session)).toString('base64url')}]);
for(const [i,suffix] of ['ONE','TWO','TWO'].entries()){
 const r=await page.request.post(base+'/api/admin/inkoop',{data:{action:'article',name:prefix+' part '+i,sku:prefix+'-'+i,ref:prefix+'-'+suffix,condition:i?'used':'new'}});assert.equal(r.status(),200);created.push((await r.json()).article.id);
}
await page.goto(base+'/admin/inkoop');
await page.getByRole('button',{name:'EN',exact:true}).click();
await page.getByPlaceholder('Barcode, SKU or supplier reference').waitFor();
await page.getByRole('button',{name:'NL',exact:true}).click();
const scan=page.locator('#po-search');await page.locator('#po-supplier').fill(prefix);
async function lookup(s){await scan.fill(prefix+'-'+s);await scan.press('Enter');}
const draft=scan.locator('xpath=ancestor::form');
await lookup('ONE');await draft.locator('td').filter({hasText:created[0]}).waitFor();
await lookup('TWO');await draft.getByRole('button').filter({hasText:created[2]}).click();
await draft.locator('td').filter({hasText:created[2]}).waitFor();
await lookup('NEW');assert.equal(await page.locator('#qa-ref').inputValue(),prefix+'-NEW');
await page.locator('#qa-name').fill(prefix+' fresh');await page.locator('#qa-cost').fill('12.50');
await page.locator('#qa-name').locator('xpath=ancestor::form').locator('button[type=submit],button:not([type])').first().click();
await draft.locator('td').filter({hasText:prefix+' fresh'}).waitFor();
const fresh=await db.from('kfc_articles').select('code,purchase_price_cents').eq('supplier_ref',prefix+'-NEW').single();assert.ifError(fresh.error);created.push(fresh.data.code);assert.equal(fresh.data.purchase_price_cents,1250);
await draft.getByRole('button',{name:/Concept opslaan|Save draft/i}).click();
for(let i=0;i<40 && !order;i++){
 const found=await db.from('kfc_purchase_orders').select('id').eq('supplier',prefix).maybeSingle();
 assert.ifError(found.error);order=found.data?.id;
 if(!order)await new Promise(resolve=>setTimeout(resolve,250));
}
assert.ok(order);
const lines=await db.from('kfc_purchase_order_lines').select('article_code,quantity,unit_cost_cents').eq('po_id',order);assert.ifError(lines.error);
assert.deepEqual(lines.data.map(x=>x.article_code).sort(),[created[0],created[2],created[3]].sort());assert.equal(lines.data.find(x=>x.article_code===created[2]).quantity,1);assert.equal(lines.data.find(x=>x.article_code===created[3]).unit_cost_cents,1250);
const endpoint=base+'/api/admin/inkoop';
async function paid(){
 const view=await page.context().newPage();
 try{await view.goto(base+'/admin/financien');const card=view.locator('[data-slot=card]').filter({has:view.getByRole('link',{name:/Betaalde uitgaven|Paid expenses/i})});const amount=await card.locator('[data-slot=card-title]').innerText();return Number(amount.replace(/[^0-9,-]/g,'').replace(',','.'));}finally{await view.close();}
}
const before=await paid();
const {PDFDocument}=await import('pdf-lib'); const doc=await PDFDocument.create();doc.addPage();const pdf=Buffer.from(await doc.save());
const image=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==','base64');
const card=page.locator('[data-slot=card]').filter({has:page.getByText(prefix,{exact:true})});
await page.reload(); await page.getByRole('button',{name:'EN',exact:true}).click(); await page.getByPlaceholder('Barcode, SKU or supplier reference').waitFor(); await page.getByRole('button',{name:'NL',exact:true}).click(); await page.getByPlaceholder('Barcode, SKU of leveranciersreferentie').waitFor();
await card.locator('input[type=file]').setInputFiles({name:'supplier.pdf',mimeType:'application/pdf',buffer:pdf});
await card.locator('a[href*="?document="]').waitFor();
await card.getByRole('button',{name:/Markeer als besteld|Mark as ordered/i}).click();
const row=card.locator('tr').filter({hasText:prefix+' fresh'});
await row.locator('input[name=scan]').fill(created[3]);
await row.locator('input[name=photo]').setInputFiles({name:'product.png',mimeType:'image/png',buffer:image});
await row.locator('input[type=number]').fill('8');
await row.locator('input[placeholder=Stelling]').fill(prefix);
await row.locator('input[placeholder=Bak]').fill('01');
let packet; page.on('request',r=>{if(r.method()==='POST'&&r.url()===endpoint&&r.postDataJSON()?.action==='receive')packet=r.postDataJSON();});
await row.locator('form button').click();
await row.locator('a[href*="receiptPhoto"]').waitFor();
assert.deepEqual((await row.locator('td').allTextContents()).slice(2,5),['10','8','2']);
const repeat=await page.request.post(endpoint,{data:packet});assert.equal(repeat.status(),200,await repeat.text());
const movement=await db.from('kfc_stock_moves').select('id,delta').eq('purchase_order_line_id',packet.line);
assert.ifError(movement.error);assert.deepEqual(movement.data.map(r=>r.delta),[8]);
const stock=await db.from('kfc_stock_position').select('physical').eq('article_code',created[3]).single();assert.ifError(stock.error);assert.equal(stock.data.physical,8);
assert.deepEqual(await (await page.request.get(endpoint+'?receiptPhoto='+movement.data[0].id)).body(),image);
assert.deepEqual(await (await page.request.get(endpoint+'?document='+order)).body(),pdf);
assert.equal(await paid(),before);
const expense={category:'supplier',amount:7.5,date_incurred:new Date().toISOString().slice(0,10),purchase_order_id:order,description:prefix+' freight'};
for(const expected of [200,409]){const result=await page.request.post(base+'/api/admin/expenses',{data:expense});assert.equal(result.status(),expected,await result.text());}
const marked=await db.from('expenses').update({status:'paid'}).eq('purchase_order_id',order).select('amount').single();assert.ifError(marked.error);
assert.equal(await paid(),before+7.5);
console.log(JSON.stringify({order,receipt:movement.data[0].id,expected:10,received:8,open:2,before,after:before+7.5}));

console.log(JSON.stringify({prefix,order,created,lines:lines.data}));
}catch(err){console.error(err);console.error((await page.locator("body").innerText()).slice(0,2200));throw err;}finally{await browser.close();if (process.env.ERP_KEEP_PURCHASE_DEMO !== '1') {if(order){await db.from('expenses').delete().eq('purchase_order_id',order);await db.from('kfc_stock_moves').delete().eq('article_code',created[3]);await db.from('kfc_stock_levels').delete().eq('article_code',created[3]);await db.from('kfc_locations').delete().eq('shelf',prefix);}if(order)await db.from('kfc_purchase_orders').delete().eq('id',order);if(created.length)await db.from('kfc_articles').delete() .in('code',created);}}
