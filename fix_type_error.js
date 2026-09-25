const fs = require('fs');

let content = fs.readFileSync('src/components/VehicleWizard/VehicleWizard.tsx', 'utf8');

content = content.replace('setGoingBack(next < step);', 'setGoingBack(typeof step === \'number\' ? next < step : false);');

fs.writeFileSync('src/components/VehicleWizard/VehicleWizard.tsx', content);
