import os
import re

pages = [
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
]

for p in pages:
    if os.path.exists(p):
        with open(p, 'r') as f:
            content = f.read()
            
            title = re.search(r'title:\s*(?:\'|"|`)(.*?)(?:\'|"|`)', content) or re.search(r'title:\s*\{\s*absolute:\s*(?:\'|"|`)(.*?)(?:\'|"|`)', content)
            desc = re.search(r'description:\s*(?:\'|"|`)(.*?)(?:\'|"|`)', content)
            h1 = re.search(r'<h1[^>]*>(.*?)</h1>', content, re.IGNORECASE | re.DOTALL)
            gen = 'generateMetadata' in content
            
            print(f'--- {p} ---')
            if gen:
                print('[Dynamic Metadata] - generateMetadata found')
            else:
                print('Title: ' + (title.group(1) if title else 'MISSING'))
                print('Desc:  ' + (desc.group(1)[:80] + '...' if desc else 'MISSING'))
            
            if h1:
                h = re.sub(r'<[^>]*>', '', h1.group(1).replace('\n', '')).strip()
                print('H1:    ' + h)
            else:
                print('H1:    MISSING')
