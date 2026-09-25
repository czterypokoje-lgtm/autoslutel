const fs = require('fs');

const file = 'src/app/autosleutel-kwijt/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// I will just use a precise replace to clear the messy section and put a clean one.
const startMarker = "<div className={styles.brandsGrid}>";
const endMarker = "<p className={styles.brandsDisclaimer}>";

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

if (startIdx !== -1 && endIdx !== -1) {
  const brandsArray = `[
  { id: 'alfa-romeo', url: 'https://cdn.simpleicons.org/alfaromeo/000000' },
  { id: 'audi', url: 'https://cdn.simpleicons.org/audi/000000' },
  { id: 'chevrolet', url: 'https://cdn.simpleicons.org/chevrolet/000000' },
  { id: 'citroen', url: 'https://cdn.simpleicons.org/citroen/000000' },
  { id: 'dacia', url: 'https://cdn.simpleicons.org/dacia/000000' },
  { id: 'fiat', url: 'https://cdn.simpleicons.org/fiat/000000' },
  { id: 'ford', url: 'https://cdn.simpleicons.org/ford/000000' },
  { id: 'honda', url: 'https://cdn.simpleicons.org/honda/000000' },
  { id: 'hyundai', url: 'https://cdn.simpleicons.org/hyundai/000000' },
  { id: 'jeep', url: 'https://cdn.simpleicons.org/jeep/000000' },
  { id: 'kia', url: 'https://cdn.simpleicons.org/kia/000000' },
  { id: 'land-rover', url: 'https://cdn.simpleicons.org/landrover/000000' },
  { id: 'mazda', url: 'https://cdn.simpleicons.org/mazda/000000' },
  { id: 'mercedes', url: 'https://cdn.simpleicons.org/mercedes/000000' },
  { id: 'mitsubishi', url: 'https://cdn.simpleicons.org/mitsubishi/000000' },
  { id: 'nissan', url: 'https://cdn.simpleicons.org/nissan/000000' },
  { id: 'opel', url: 'https://cdn.simpleicons.org/opel/000000' },
  { id: 'peugeot', url: 'https://cdn.simpleicons.org/peugeot/000000' },
  { id: 'renault', url: 'https://cdn.simpleicons.org/renault/000000' },
  { id: 'seat', url: 'https://cdn.simpleicons.org/seat/000000' },
  { id: 'skoda', url: 'https://cdn.simpleicons.org/skoda/000000' },
  { id: 'suzuki', url: 'https://cdn.simpleicons.org/suzuki/000000' },
  { id: 'toyota', url: 'https://cdn.simpleicons.org/toyota/000000' },
  { id: 'volkswagen', url: 'https://cdn.simpleicons.org/volkswagen/000000' }
]`;

  const newSection = `<div className={styles.brandsGrid}>
            {${brandsArray}.map(brand => (
              <div key={brand.id} className={styles.brandBox}>
                <Image src={brand.url} alt={brand.id} width={70} height={40} style={{ objectFit: 'contain' }} unoptimized={true} />
              </div>
            ))}
          </div>
          `;
  
  content = content.substring(0, startIdx) + newSection + content.substring(endIdx);
  fs.writeFileSync(file, content);
}
