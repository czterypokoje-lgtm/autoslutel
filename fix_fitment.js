const fs = require('fs');

let productPage = fs.readFileSync('src/app/webshop/product/[slug]/page.tsx', 'utf8');
productPage = productPage.replace(
  "import FitmentWidget from '@/components/webshop/FitmentWidget';",
  "import VehicleFitmentWidget from '@/components/webshop/VehicleFitmentWidget';"
);
productPage = productPage.replace(
  "<FitmentWidget fitment={entry.fitment} />",
  "<VehicleFitmentWidget fitment={entry.fitment} />"
);
fs.writeFileSync('src/app/webshop/product/[slug]/page.tsx', productPage);
