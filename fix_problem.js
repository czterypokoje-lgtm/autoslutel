const fs = require('fs');

let overview = fs.readFileSync('src/app/admin/overzicht/OfficeOverview.tsx', 'utf8');

overview = overview.replace(/, problem, car_make/g, ', car_make');
overview = overview.replace(/job\.service_type \|\| job\.problem/g, 'job.service_type');

fs.writeFileSync('src/app/admin/overzicht/OfficeOverview.tsx', overview);
console.log('Fixed problem column in OfficeOverview.');
