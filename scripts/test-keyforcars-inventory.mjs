import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { inventoryCategory } from '../src/app/admin/voorraad/inventoryCategories.ts';
import { inventoryHref, inventoryView } from '../src/app/admin/voorraad/inventoryViews.ts';

const sample = (name) => ({ name, category: '' });
assert.equal(inventoryCategory(sample('BMW non-keyless remote'))[0], 'non-keyless');
assert.equal(inventoryCategory(sample('BMW smart key'))[0], 'keyless');
assert.equal(inventoryCategory(sample('Alfa Romeo SIP22 noodsleutelbaard'))[0], 'blades');
assert.equal(inventoryCategory(sample('Smart remote case'))[0], 'housings');
assert.equal(inventoryCategory(sample('Werkplaatsartikel'))[0], 'workshop');
assert.equal(inventoryCategory(sample('Unknown product'))[0], 'other');

const catalog = JSON.parse(readFileSync(new URL('../src/data/keyforcars-stock.json', import.meta.url)));
const groups = Object.groupBy(catalog, (article) => inventoryCategory(article)[0]);
for (const category of ['keyless', 'non-keyless', 'blades']) assert.ok(groups[category]?.length);
assert.equal(Object.values(groups).reduce((total, items) => total + items.length, 0), catalog.length);

assert.equal(inventoryView('toString'), 'products');
assert.equal(inventoryHref('journal', true), '/admin/voorraad?view=journal&demo=1');
console.log(`Checked inventory views and ${catalog.length} categorized products.`);
