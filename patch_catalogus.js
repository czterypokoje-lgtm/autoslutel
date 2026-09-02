const fs = require('fs');
let cat = fs.readFileSync('src/app/webshop/catalogus/page.tsx', 'utf8');

// Add cookies import if missing
if (!cat.includes("from 'next/headers'")) {
  cat = cat.replace(
    /import Link from 'next\/link';/g,
    "import Link from 'next/link';\nimport { cookies } from 'next/headers';"
  );
}

// Check cookie
cat = cat.replace(
  /const sp = await searchParams;/g,
  "const sp = await searchParams;\n  const cookieStore = await cookies();\n  const isB2B = cookieStore.get('b2b_session')?.value === 'true';"
);

// Call getProducts
cat = cat.replace(
  /const all = getProducts\('public'\);/g,
  "const all = getProducts(isB2B ? 'all' : 'public');"
);

// Add B2B badge next to title
cat = cat.replace(
  /<h1 style={{ fontSize: '1\.9rem', fontWeight: 800, color: '#0f172a', marginBottom: '\.35rem' }}>\s*Catalogus\s*<\/h1>/g,
  `<h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0f172a', marginBottom: '.35rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        Catalogus
        {isB2B && (
          <span style={{ fontSize: '0.8rem', background: '#16a34a', color: '#fff', padding: '0.2rem 0.6rem', borderRadius: 99, fontWeight: 700, verticalAlign: 'middle' }}>
            B2B Modus Actief
          </span>
        )}
      </h1>`
);

fs.writeFileSync('src/app/webshop/catalogus/page.tsx', cat);
