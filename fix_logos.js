const fs = require('fs');
const file = 'src/app/autosleutel-kwijt/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Fix logos
content = content.replace(/\{ id: 'alfa-romeo', url: 'https:\/\/cdn\.simpleicons\.org\/alfaromeo\/000000' \}/, "{ id: 'bmw', url: 'https://cdn.simpleicons.org/bmw/000000' }");
content = content.replace(/\{ id: 'land-rover', url: 'https:\/\/cdn\.simpleicons\.org\/landrover\/000000' \}/, "{ id: 'mini', url: 'https://cdn.simpleicons.org/mini/000000' }");
content = content.replace(/\{ id: 'mercedes', url: 'https:\/\/cdn\.simpleicons\.org\/mercedes\/000000' \}/, "{ id: 'volvo', url: 'https://cdn.simpleicons.org/volvo/000000' }");

// Fix inline styles for Dekking per merk and FAQ
content = content.replace(/<span className=\{styles\.eyebrow\}>Dekking per merk<\/span>/, '<span className={styles.eyebrow} style={{ color: "#94a3b8" }}>Dekking per merk</span>');
content = content.replace(/<h2 style=\{\{ fontSize: '1\.25rem', marginBottom: '2rem' \}\}>Autosleutel bijmaken voor deze merken<\/h2>/, '<h2 style={{ fontSize: "1.25rem", marginBottom: "2rem", color: "#ffffff" }}>Autosleutel bijmaken voor deze merken</h2>');
content = content.replace(/<h2 className=\{anton\.className\}>Veelgestelde Vragen — Autosleutel Kwijt<\/h2>/, '<h2 className={`${anton.className} ${styles.sectionTitle}`} style={{ color: "#ffffff" }}>Veelgestelde Vragen — Autosleutel Kwijt</h2>');
content = content.replace(/<p className=\{styles\.brandsDisclaimer\}>/, '<p className={styles.brandsDisclaimer} style={{ color: "#64748b" }}>');

fs.writeFileSync(file, content);
