const fs = require('fs');
let code = fs.readFileSync('src/app/admin/overzicht/OfficeOverview.tsx', 'utf8');

// Replace `<Card padded style={{...}}>` with `<Card padded><div style={{...}}>`
// and since these specific cards end with `</Card>`, replace those specific ones.

const blockToFix1 = `        <Card padded style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--crm-muted)', fontSize: '13px', fontWeight: 600}}>
            <div style={{background: '#E8F5E9', padding: '6px', borderRadius: '50%'}}><Target size={16} color="var(--crm-ok)"/></div> Leads
          </div>
          <div style={{fontSize: '24px', fontWeight: 'bold', color: 'var(--crm-ink)'}}>{totalLeads}</div>
          <div style={{fontSize: '12px', color: 'var(--crm-ok)'}}>↑ 2 vandaag</div>
        </Card>`;
const fixed1 = `        <Card padded><div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--crm-muted)', fontSize: '13px', fontWeight: 600}}>
            <div style={{background: '#E8F5E9', padding: '6px', borderRadius: '50%'}}><Target size={16} color="var(--crm-ok)"/></div> Leads
          </div>
          <div style={{fontSize: '24px', fontWeight: 'bold', color: 'var(--crm-ink)'}}>{totalLeads}</div>
          <div style={{fontSize: '12px', color: 'var(--crm-ok)'}}>↑ 2 vandaag</div>
        </div></Card>`;
code = code.replace(blockToFix1, fixed1);

// Actually, I can just find and replace `<Card padded style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>` 
// with `<Card padded><div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>` 
// and then carefully find their corresponding `</Card>` closures.

// Better way:
code = code.split("<Card padded style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>").join("<Card padded><div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>");
code = code.split("<div style={{fontSize: '12px', color: 'var(--crm-ok)'}}>↑ 2 vandaag</div>\n        </Card>").join("<div style={{fontSize: '12px', color: 'var(--crm-ok)'}}>↑ 2 vandaag</div>\n        </div></Card>");
code = code.split("<div style={{fontSize: '12px', color: 'var(--crm-ok)'}}>↑ 3 deze week</div>\n        </Card>").join("<div style={{fontSize: '12px', color: 'var(--crm-ok)'}}>↑ 3 deze week</div>\n        </div></Card>");
code = code.split("<div style={{fontSize: '12px', color: 'var(--crm-muted)'}}>{Math.max(0, activeJobs - 2)} in uitvoering</div>\n        </Card>").join("<div style={{fontSize: '12px', color: 'var(--crm-muted)'}}>{Math.max(0, activeJobs - 2)} in uitvoering</div>\n        </div></Card>");
code = code.split("<div style={{fontSize: '12px', color: 'var(--crm-stop)'}}>↓ 6 openstaand</div>\n        </Card>").join("<div style={{fontSize: '12px', color: 'var(--crm-stop)'}}>↓ 6 openstaand</div>\n        </div></Card>");
code = code.split("<div style={{fontSize: '12px', color: 'var(--crm-ok)'}}>↑ 12% deze maand</div>\n        </Card>").join("<div style={{fontSize: '12px', color: 'var(--crm-ok)'}}>↑ 12% deze maand</div>\n        </div></Card>");
code = code.split("<div style={{fontSize: '11px', color: 'var(--crm-muted)'}}>12 facturen</div>\n          </Card>").join("<div style={{fontSize: '11px', color: 'var(--crm-muted)'}}>12 facturen</div>\n          </div></Card>");
code = code.split("<div style={{fontSize: '11px', color: 'var(--crm-muted)'}}>6 facturen</div>\n          </Card>").join("<div style={{fontSize: '11px', color: 'var(--crm-muted)'}}>6 facturen</div>\n          </div></Card>");
code = code.split("<div style={{fontSize: '11px', color: 'var(--crm-ok)'}}>↑ 18% tov vorige maand</div>\n          </Card>").join("<div style={{fontSize: '11px', color: 'var(--crm-ok)'}}>↑ 18% tov vorige maand</div>\n          </div></Card>");
code = code.split("<div style={{fontSize: '11px', color: 'var(--crm-ok)'}}>↑ 6% tov vorige maand</div>\n          </Card>").join("<div style={{fontSize: '11px', color: 'var(--crm-ok)'}}>↑ 6% tov vorige maand</div>\n          </div></Card>");
code = code.split("<div style={{fontSize: '11px', color: 'var(--crm-muted)'}}>77% marge</div>\n          </Card>").join("<div style={{fontSize: '11px', color: 'var(--crm-muted)'}}>77% marge</div>\n          </div></Card>");

fs.writeFileSync('src/app/admin/overzicht/OfficeOverview.tsx', code);
console.log('Fixed Cards in OfficeOverview safely.');
