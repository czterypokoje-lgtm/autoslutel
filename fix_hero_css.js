const fs = require('fs');
let css = fs.readFileSync('src/app/autosleutel-kwijt/DeadboltTheme.module.css', 'utf8');

// Update hero background
css = css.replace(/url\('\/images\/seo\/autosleutel_bijmaken_utrecht_car_keys.webp'\)/, "url('/images/seo/audi_forest_hero.webp')");
css = css.replace(/linear-gradient\(to top, #0d121c 0%, rgba\(13, 18, 28, 0.6\) 50%, rgba\(13, 18, 28, 0.4\) 100%\)/, "linear-gradient(to top, #0d121c 0%, rgba(13, 18, 28, 0.7) 40%, rgba(13, 18, 28, 0.2) 100%)");

// Update title typography
css = css.replace(/line-height: 0\.9;/, "line-height: 0.85;");
css = css.replace(/font-size: clamp\(3rem, 8vw, 6rem\);/, "font-size: clamp(3.5rem, 8.5vw, 7.5rem);");

// Remove right box background
css = css.replace(/max-width: 400px;\s*background: rgba\(13, 18, 28, 0\.8\);\s*padding: 1\.5rem;\s*border-radius: 8px;\s*backdrop-filter: blur\(4px\);/, "max-width: 420px;\n  padding-bottom: 0.5rem;\n  margin-bottom: 0;");

// Right text formatting
css = css.replace(/\.heroDesc \{\s*font-size: 0\.95rem;\s*line-height: 1\.6;\s*color: #cbd5e1;\s*margin-bottom: 1\.5rem;\s*\}/, ".heroDesc {\n  font-size: 0.95rem;\n  line-height: 1.6;\n  color: #f1f5f9;\n  font-weight: 500;\n  margin-bottom: 1.5rem;\n}");

// Buttons
css = css.replace(/\.btnOrange \{\s*background-color: #f97316;\s*color: #fff;/, ".btnOrange {\n  background-color: #f97316;\n  color: #0f172a;");
css = css.replace(/\.btnOutline \{\s*background-color: transparent;/, ".btnOutline {\n  background-color: #111827;");

// Update hero layout to bottom align
css = css.replace(/align-items: flex-end;/, "align-items: flex-end;"); // already correct

fs.writeFileSync('src/app/autosleutel-kwijt/DeadboltTheme.module.css', css);
