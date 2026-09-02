const fs = require('fs');
let prod = fs.readFileSync('src/app/webshop/product/[slug]/page.tsx', 'utf8');

if (!prod.includes("from 'next/headers'")) {
  prod = prod.replace(
    /import { notFound } from 'next\/navigation';/g,
    "import { notFound, redirect } from 'next/navigation';\nimport { cookies } from 'next/headers';"
  );
}

prod = prod.replace(
  /const resolvedParams = await params;/g,
  `const resolvedParams = await params;
  const cookieStore = await cookies();
  const isB2B = cookieStore.get('b2b_session')?.value === 'true';`
);

prod = prod.replace(
  /if \(!entry\) return notFound\(\);/g,
  `if (!entry) return notFound();
  
  // Guard trade products
  if (entry.audience === 'trade' && !isB2B) {
    redirect('/webshop/account');
  }`
);

fs.writeFileSync('src/app/webshop/product/[slug]/page.tsx', prod);
