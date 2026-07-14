const fs = require('fs');
const path = require('path');

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let titleMatch = content.match(/title:\s*(?:'|"|`)(.*?)(?:'|"|`)/) || content.match(/title:\s*\{\s*absolute:\s*(?:'|"|`)(.*?)(?:'|"|`)/);
  let descMatch = content.match(/description:\s*(?:'|"|`)(.*?)(?:'|"|`)/);
  let h1Match = content.match(/<h1[^>]*>(.*?)<\/h1>/si);
  
  // For dynamic pages, the metadata is generated via generateMetadata, so we might need a different approach,
  // but let's try to grab whatever we can statically first.
  let genMeta = content.includes('generateMetadata');

  console.log('--- ' + filePath + ' ---');
  if (genMeta) {
    console.log('[Dynamic Metadata] - Ensure generateMetadata is robust.');
  } else {
    console.log('Title: ' + (titleMatch ? titleMatch[1] : 'MISSING'));
    console.log('Desc:  ' + (descMatch ? (descMatch[1].substring(0, 60) + '...') : 'MISSING'));
  }
  
  if (h1Match) {
    let h1 = h1Match[1].replace(/\n/g, '').replace(/<[^>]*>/g, '').trim().substring(0, 80);
    console.log('H1:    ' + h1);
  } else {
    console.log('H1:    MISSING');
  }
}

const pages = [
  'src/app/page.tsx',
  'src/app/over-ons/page.tsx',
  'src/app/contact/page.tsx',
  'src/app/beoordelingen/page.tsx',
  'src/app/galerij/page.tsx',
  'src/app/veelgestelde-vragen/page.tsx',
  'src/app/privacybeleid/page.tsx',
  'src/app/diensten/[slug]/page.tsx',
  'src/app/diensten/auto-openen-zonder-sleutel/page.tsx',
  'src/app/diensten/autosleutel-bijmaken/page.tsx',
  'src/app/diensten/auto-slotenmaker/page.tsx',
  'src/app/merken/[merkSlug]/page.tsx',
  'src/app/steden/[citySlug]/page.tsx'
];

pages.forEach(p => {
  if (fs.existsSync(p)) {
    checkFile(p);
  }
});
