const fs = require('fs');

let content = fs.readFileSync('src/components/VehicleWizard/VehicleWizard.tsx', 'utf8');

// Replace i < step with typeof step === 'number' && i < step
content = content.replace(/i < step \? styles\.tickDone : ''/g, "typeof step === 'number' && i < step ? styles.tickDone : ''");

// Are there any other `< step` ?
content = content.replace(/next < step/g, "typeof step === 'number' && next < step");

fs.writeFileSync('src/components/VehicleWizard/VehicleWizard.tsx', content);
