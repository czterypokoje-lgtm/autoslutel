const fs = require('fs');

let content = fs.readFileSync('src/components/VehicleWizard/VehicleWizard.tsx', 'utf8');

// Fix step > 1
content = content.replace(/\{step > 1 && \(/g, "{typeof step === 'number' && step > 1 && (");

// Fix step - 1
content = content.replace(/go\(step - 1\)/g, "go((step as number) - 1)");

// Fix Stap {step}
content = content.replace(/<span>Stap \{step\} van/g, "<span>Stap {step === 'success' ? TOTAL_STEPS : step} van");

fs.writeFileSync('src/components/VehicleWizard/VehicleWizard.tsx', content);
