const fs = require('fs');

// 1. Update LeadsTable.tsx to wrap bare text in rowPrice
let tsx = fs.readFileSync('src/app/admin/leads/LeadsTable.tsx', 'utf8');
tsx = tsx.replace(
  '{row.quoted_price ? `€${row.quoted_price}` : (row.sale_price ? `€${row.sale_price}` : \'—\')}',
  '<span>{row.quoted_price ? `€${row.quoted_price}` : (row.sale_price ? `€${row.sale_price}` : \'—\')}</span>'
);
fs.writeFileSync('src/app/admin/leads/LeadsTable.tsx', tsx);

// 2. Append mobile CSS to leads.module.css
let css = fs.readFileSync('src/app/admin/leads/leads.module.css', 'utf8');
const mobileCss = `
/* MOBILE RESPONSIVE STYLES */
@media (max-width: 1024px) {
  .layout {
    flex-direction: column;
  }
  .drawerCol {
    width: 100%;
    position: fixed;
    bottom: 0;
    top: auto;
    left: 0;
    height: 85vh;
    z-index: 1000;
  }
  .drawerCard {
    height: 100%;
    border-radius: var(--crm-r-lg) var(--crm-r-lg) 0 0;
    box-shadow: 0 -4px 20px rgba(0,0,0,0.15);
  }
}

@media (max-width: 768px) {
  .richRow {
    flex-wrap: wrap;
    position: relative;
    align-items: flex-start;
    padding-top: 16px;
  }
  
  .richRow > input[type="checkbox"] {
    position: absolute;
    top: 16px;
    right: 16px;
  }
  
  .rowInfo {
    flex: 1 1 calc(100% - 70px);
    padding-right: 30px; /* avoid checkbox overlap */
  }
  
  .rowPrice, .rowStatus, .rowAssignee {
    flex: 1 1 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid var(--crm-rule);
    padding-top: 10px;
    margin-top: 4px;
    text-align: right;
  }
  
  .rowPrice {
    flex-direction: row-reverse;
  }
  
  .rowStatus {
    flex-direction: row-reverse;
  }
  
  .rowAssignee {
    flex-direction: row;
  }
}
`;

if (!css.includes('MOBILE RESPONSIVE STYLES')) {
  fs.writeFileSync('src/app/admin/leads/leads.module.css', css + mobileCss);
}

console.log('Mobile fixes applied.');
