import assert from 'node:assert/strict';
import { demoBotIntent, isDemoChannel, matchesDemoOrder } from '../src/lib/kfcDemoBotRules.ts';

for (const channel of ['chat', 'email', 'phone', 'whatsapp']) assert.equal(isDemoChannel(channel), true);
assert.equal(isDemoChannel('__proto__'), false);
assert.equal(demoBotIntent('Can a technician call me back about order 79214?', true, false), 'technician');
assert.equal(demoBotIntent('Waar is mijn bestelling?', false, false), 'order');
assert.equal(demoBotIntent('Is this key compatible?', false, false), 'product');
assert.equal(demoBotIntent('Hello', false, false), 'unknown');
const order = { ship_email: 'alex@example.com', ship_postcode: '8222 SV' };
assert.equal(matchesDemoOrder(order, 'Alex@example.com', '8222sv'), true);
assert.equal(matchesDemoOrder(order, 'nope@example.com', '8222sv'), false);
assert.equal(matchesDemoOrder(order, 'alex@example.com', '1234 AA'), false);
assert.equal(matchesDemoOrder(order, 'alex@example.com', ''), false);
console.log('Demo bot routing and identity checks passed.');
