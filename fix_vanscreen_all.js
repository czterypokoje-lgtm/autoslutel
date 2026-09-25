const fs = require('fs');
let content = fs.readFileSync('src/app/admin/vandaag/VanScreen.tsx', 'utf8');

// The new type we are using:
// pimProducts: { id: string; internal_sku: string; car_make: string; car_model: string; fcc_id: string; average_cost: number; standard_price: number }[];

// Replace in JobCard props
content = content.replace(
  "vanStock: { id: string; description: string; quantity: number }[];",
  "pimProducts: { id: string; internal_sku: string; car_make: string; car_model: string; fcc_id: string; average_cost: number; standard_price: number }[];"
);

// Replace in JobDetail props
content = content.replace(
  "vanStock: { id: string; description: string; quantity: number }[];",
  "pimProducts: { id: string; internal_sku: string; car_make: string; car_model: string; fcc_id: string; average_cost: number; standard_price: number }[];"
);

// Replace parameter destructuring
content = content.replace(/vanStock,/g, "pimProducts,");
content = content.replace(/vanStock=\{vanStock\}/g, "pimProducts={pimProducts}");

// Fix the render loop at the bottom (line 679)
// old: {vanStock.filter(s => s.quantity > 0).map(s => (
// new: we don't have quantity in pimProducts. Let's just list the products, or maybe limit it to top 50, or just remove that stock section since the office asked to link it to PIM.
// Wait, the bottom of VanScreen.tsx probably has a "Mijn bus voorraad" section!
content = content.replace(
  /\{pimProducts\.filter\(s => s\.quantity > 0\)\.map\(s => \(/g,
  "{pimProducts.slice(0, 50).map(s => ("
);
content = content.replace(
  /<div key=\{s\.id\} className=\{styles\.stockRow\}>\s*<span className=\{styles\.stockDesc\}>\{s\.description\}<\/span>\s*<span className=\{styles\.stockQty\}>\{s\.quantity\}<\/span>\s*<\/div>/g,
  "<div key={s.id} className={styles.stockRow}><span className={styles.stockDesc}>{s.internal_sku}</span><span className={styles.stockQty}>—</span></div>"
);

fs.writeFileSync('src/app/admin/vandaag/VanScreen.tsx', content);
