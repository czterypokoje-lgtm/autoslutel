import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createClient} from '@supabase/supabase-js';
const ref='ysrebelulbmnbzyvnsic';
assert.equal(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname,ref+'.supabase.co');
const base=process.env.ERP_TEST_BASE_URL || 'http://127.0.0.1:3011';
assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(base).hostname));
// Stable non-customer records in the allowlisted test project.
const seed=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const {error:seedError}=await seed.from('agent_conversations').upsert([
 {conversation_id:'ux-test-webchat-lead',channel:'webchat',summary:'Prijsaanvraag voor een reservesleutel van een BMW.',transcript:[{role:'user',message:'Wat kost een BMW sleutel bijmaken?'}]},
 {conversation_id:'ux-test-webchat-shop',channel:'webchat',summary:'Klant wil een pakket retour sturen.',transcript:[{role:'user',message:'Kan ik mijn webshopbestelling retour sturen?'}]},
],{onConflict:'conversation_id',ignoreDuplicates:true});
assert.ifError(seedError);
const auth=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const {data,error}=await auth.auth.signInWithPassword({email:process.env.CRM_TEST_EMAIL,password:process.env.CRM_TEST_PASSWORD});
assert.ifError(error);
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage();
 page.setDefaultTimeout(30000);
 page.setDefaultNavigationTimeout(60000);
 await page.context().addCookies([{url:base,name:'sb-'+ref+'-auth-token',value:'base64-'+Buffer.from(JSON.stringify(data.session)).toString('base64url')}]);
 const hydrationErrors=[];
 page.on('console',msg=>{if(msg.type()==='error' && /hydrat/i.test(msg.text())) hydrationErrors.push(msg.text());});
 // An extension previously inserted a script ahead of the head JSON-LD.
 await page.addInitScript(()=>{
   const insert=()=>{
     if(!document.head) return;
     const marker=document.createElement('script');
     marker.id='extension-marker';
     marker.type='application/json';
     marker.textContent='{}';
     document.head.prepend(marker);
     observer.disconnect();
   };
   const observer=new MutationObserver(insert);
   observer.observe(document,{childList:true,subtree:true});
   insert();
 });
 await page.goto(base+'/admin/gesprekken',{waitUntil:'domcontentloaded'});
 await page.locator('body.kfc-shell').waitFor({state:'attached'});
 assert.equal(await page.locator('body #schema-website').count(),1);
 for(const width of [1280,390]){
  await page.setViewportSize({width,height:850});
  const tab=page.getByRole('button',{name:'Webshop',exact:true});
  await tab.click();
  await page.waitForFunction(()=>Array.from(document.querySelectorAll('button')).some(b=>b.textContent==='Webshop' && b.getAttribute('aria-pressed')==='true'));
  for(const channel of ['email','whatsapp','phone','webchat']){
   await page.locator('[data-channel='+channel+']').click();
   const topic=page.getByRole('button',{name:'Retour',exact:true});await topic.click();assert.equal(await topic.getAttribute('aria-pressed'),'true');await topic.click();
  }
  await page.getByRole('button',{name:'Leads',exact:true}).click();
 }
 await page.locator('[data-channel=phone]').click();
 const phoneCard=page.locator('[data-channel=phone]');
 const unreadBefore=Number((await phoneCard.innerText()).match(/(\d+) ongelezen/)?.[1]);
 await page.locator('button').filter({has:page.locator('div.truncate.text-sm')}).first().click();
 await page.getByRole('heading',{name:'Gespreksverslag'}).waitFor();
 assert.equal(await page.locator('[data-channel=phone]').isVisible(),false);
 await page.getByRole('button',{name:'Terug naar gesprekken'}).click();
 await phoneCard.waitFor();
 assert.match(await phoneCard.innerText(),new RegExp((unreadBefore-1)+' ongelezen'));
 await page.setViewportSize({width:1280,height:850});
 await page.locator('[data-channel=phone]').click();
 const transcript=page.getByRole('button',{name:'Volledig transcript openen'});
 assert.equal(await transcript.getAttribute('aria-expanded'),'false');
 await transcript.click();
 assert.equal(await page.getByRole('button',{name:'Transcript sluiten'}).getAttribute('aria-expanded'),'true');
 await page.getByRole('button',{name:'EN',exact:true}).click();
 await page.getByRole('heading',{name:'Call summary'}).waitFor();
 assert.equal(await page.getByRole('button',{name:'Close transcript'}).count(),1);
 await page.getByRole('button',{name:'NL',exact:true}).click();
 await page.locator('[data-channel=webchat]').click();
 assert.match(await page.locator('[data-channel=webchat]').innerText(),/\d+ gesprekken/);
 await page.getByText('Wat kost een BMW sleutel bijmaken?',{exact:true}).first().waitFor();
 await page.getByRole('button',{name:'Webshop',exact:true}).click();
 await page.getByText('Kan ik mijn webshopbestelling retour sturen?',{exact:true}).first().waitFor();
 for(const [path,heading] of [
  ['/admin/rapport/verkoop','Gefactureerd per maand'],['/admin/rapport/voorraad','Fysieke voorraad per staat'],
  ['/admin/rapport/voorraadbewegingen','Voorraadbewegingen'],['/admin/winst/webshop','Marge per maand en webshop'],
  ['/admin/rapport','Prestaties'],['/admin/winst','Winst & verbruik'],['/admin/rapportage','Rapportage'],
  ['/admin/rapporten?tab=leads','Rapporten']]){
   const res=await page.goto(base+path,{waitUntil:'domcontentloaded'});assert.equal(res.status(),200,path);
   await page.getByText(heading,{exact:true}).last().waitFor();console.log('OK',path);
 }
 for(const width of [390,1440]){
   await page.setViewportSize({width,height:900});
   for(const route of ['/admin/rapporten','/admin/facturen','/admin/gesprekken']){
     await page.goto(base+route,{waitUntil:'domcontentloaded'});
     await page.locator('body.kfc-shell').waitFor({state:'attached'});
     assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth+1),route+' overflows at '+width);
   }
 }
 assert.deepEqual(hydrationErrors,[]);
}finally{await browser.close();}
