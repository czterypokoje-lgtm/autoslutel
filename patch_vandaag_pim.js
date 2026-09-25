const fs = require('fs');

// 1. Update VandaagPage
let vandaagPage = fs.readFileSync('src/app/admin/vandaag/page.tsx', 'utf8');

vandaagPage = vandaagPage.replace(
  "    .from('stock_items')\n    .select('id, description, quantity')\n    .eq('technician_id', technicianId || '00000000-0000-0000-0000-000000000000')\n    .order('description');",
  "    .from('inventory_products')\n    .select('id, internal_sku, product_type, car_make, car_model, fcc_id, average_cost, standard_price')\n    .eq('active', true)\n    .order('internal_sku');"
);
vandaagPage = vandaagPage.replace("vanStock={vanStock || []}", "pimProducts={vanStock || []}");

fs.writeFileSync('src/app/admin/vandaag/page.tsx', vandaagPage);

// 2. Update VanScreen
let vanScreen = fs.readFileSync('src/app/admin/vandaag/VanScreen.tsx', 'utf8');

vanScreen = vanScreen.replace(
  "vanStock: { id: string; description: string; quantity: number }[];",
  "pimProducts: { id: string; internal_sku: string; car_make: string; car_model: string; fcc_id: string; average_cost: number; standard_price: number }[];"
);

// We need to change the Materiaal UI to use a datalist or select for PIM products
const addMaterialRegex = /async function addMaterial\(\) \{[\s\S]*?setBusy\(false\);\n  \}/;

const newAddMaterial = `async function addMaterial() {
    const description = material.trim();
    if (!description) return;

    setBusy(true);

    const product = pimProducts.find(p => 
      p.internal_sku === description || 
      [p.car_make, p.car_model, p.fcc_id].filter(Boolean).join(' ') === description
    );

    const inventory_product_id = product ? product.id : undefined;
    const unit_cost = product ? product.average_cost : undefined;

    const ok = await fetch(\`/api/admin/jobs/\${job.id}/materials\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, quantity: 1, inventory_product_id, unit_cost }),
    })
      .then((r) => r.ok)
      .catch(() => false);

    if (ok) {
      setMaterials((prev) => [...prev, description]);
      setMaterial('');
    } else {
      setError('Materiaal opslaan mislukt.');
    }
    setBusy(false);
  }`;

vanScreen = vanScreen.replace(addMaterialRegex, newAddMaterial);

// Add a datalist for the material input
const materialInputRegex = /<input\n\s*className=\{styles\.control\}\n\s*placeholder="Wat is er gebruikt\?"\n\s*value=\{material\}\n\s*onChange=\{\(e\) => setMaterial\(e\.target\.value\)\}\n\s*\/>/;

const newMaterialInput = `<input
            className={styles.control}
            placeholder="Kies een product uit PIM of typ zelf..."
            list="pim-products"
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
          />
          <datalist id="pim-products">
            {pimProducts.map(p => (
              <option key={p.id} value={p.internal_sku}>
                {[p.car_make, p.car_model, p.fcc_id].filter(Boolean).join(' ')} - €{p.average_cost} inkoop
              </option>
            ))}
          </datalist>`;

vanScreen = vanScreen.replace(materialInputRegex, newMaterialInput);

fs.writeFileSync('src/app/admin/vandaag/VanScreen.tsx', vanScreen);

// 3. Update the API Route to accept inventory_product_id and unit_cost
let materialsApi = fs.readFileSync('src/app/api/admin/jobs/[id]/materials/route.ts', 'utf8');

materialsApi = materialsApi.replace(
  "      stock_item_id: stockItemId,",
  "      stock_item_id: stockItemId,\n      inventory_product_id: typeof body.inventory_product_id === 'string' && UUID.test(body.inventory_product_id) ? body.inventory_product_id : null,"
);

fs.writeFileSync('src/app/api/admin/jobs/[id]/materials/route.ts', materialsApi);
