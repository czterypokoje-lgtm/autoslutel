import { test } from 'node:test';
import assert from 'node:assert/strict';
import { topicOf, inboxOf, tagsOf, briefOf } from '../../src/app/admin/gesprekken/_components/topics.ts';
const conversation = (channel, message) => ({channel,turns:[{role:'user',message}]});
test('Shop and lead inboxes stay distinct across email, calls and WhatsApp',()=>{
 for(const channel of ['email','phone','whatsapp']){
  assert.equal(inboxOf(conversation(channel,'Mijn bestelling is kapot')),'webshop');
  assert.equal(inboxOf(conversation(channel,'Prijs voor BMW sleutel bijmaken?')),'leads');
  assert.equal(topicOf(conversation(channel,'Pakket retour sturen')),'retour');
  assert.equal(topicOf(conversation(channel,'Mijn bestelling is kapot')),'service');
 }
});
test('Brief cites customer words and tags exclude agent suggestions',()=>{
 const c=conversation('email','BMW sleutel bijmaken?');c.turns.push({role:'agent',message:'Audi 2021?'});
 assert.deepEqual(tagsOf(c),['bmw','sleutel','bijmaken']);assert.equal(briefOf(c).known,'');
 assert.equal(briefOf(c).question,c.turns[0].message);assert.equal(briefOf(c).index,0);
});
test('Call outcomes have a display label and urgent requests keep their urgency tag',()=>{
 const c = conversation('phone','Dringend een BMW sleutel bijmaken');
 c.outcome='failure';
 assert.equal(briefOf(c).outcome,'Mislukt');
 assert.deepEqual(tagsOf(c),['bmw','sleutel','bijmaken','dringend']);
});
