const fs = require('fs');
let content = fs.readFileSync('src/app/layout.tsx', 'utf8');

// Insert import for the managers
const importString = "import { GlobalHeader, GlobalFooter, GlobalStickyBar } from '@/components/LayoutManager';\n";
content = content.replace("import PhoneConversionTracker from '@/components/PhoneConversionTracker';", importString + "import PhoneConversionTracker from '@/components/PhoneConversionTracker';");

// Replace the actual components
content = content.replace('<UrgencyBanner />', '');
content = content.replace('<Navigation />', '<GlobalHeader />');
content = content.replace('<Footer />', '<GlobalFooter />');
content = content.replace('<StickyCallBar />', '<GlobalStickyBar />');

fs.writeFileSync('src/app/layout.tsx', content);
