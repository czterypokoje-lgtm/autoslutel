const fs = require('fs');

let code = fs.readFileSync('src/app/admin/leads/LeadsTable.tsx', 'utf8');

// Replace LeadDetailDrawer
const oldDrawer = /function LeadDetailDrawer[\s\S]*?export default function LeadsTable/m;
const newDrawer = `function LeadDetailDrawer({ lead, onClose }: { lead: LeadRow; onClose: () => void }) {
  const [tab, setTab] = useState('Algemeen');

  return (
    <div className={styles.drawerCard}>
      <div className={styles.drawerHead}>
        <div className={styles.drawerTitleRow}>
          <div>
            <div className={styles.drawerCar}>{lead.brand || 'Auto'} {lead.model}</div>
            <div className={styles.drawerSub}>
              {[lead.year, lead.kenteken].filter(Boolean).join(' • ') || 'Geen voertuig details'} 
              {' '}• Klus #{lead.id.slice(0, 5)}
            </div>
          </div>
          <div>
            <div className={styles.drawerPrice}>{lead.quoted_price ? \`€\${lead.quoted_price}\` : (lead.sale_price ? \`€\${lead.sale_price}\` : 'Prijs onbekend')}</div>
            <div className={styles.drawerPriceSub}>Geschatte waarde</div>
          </div>
        </div>
        <div style={{fontSize: '13px', fontWeight: 600, color: 'var(--crm-ink)', marginBottom: '8px'}}>{lead.service || 'Geen service opgegeven'}</div>
        <div className={styles.rowLocation} style={{marginBottom: '12px'}}>
          <MapPin size={12}/> {lead.postcode || ''} {lead.location || 'Geen locatie'}
        </div>
      </div>
      
      <div className={styles.drawerNav}>
        {['Algemeen', 'Notities'].map(t => (
          <div key={t} className={\`\${styles.drawerTab} \${tab === t ? styles.active : ''}\`} onClick={() => setTab(t)}>
            {t}
          </div>
        ))}
      </div>

      <div className={styles.drawerBody}>
        {tab === 'Algemeen' && (
          <>
            <div className={styles.drawerSection}>
              <div style={{fontWeight: 600, fontSize: '13px', color: 'var(--crm-ink)'}}>Klant & Voertuig</div>
              <div className={styles.drawerRow}>
                <CheckSquare size={16} color="var(--crm-muted)"/> {lead.name || 'Geen naam'}
              </div>
              <div className={styles.drawerRow}>
                <Phone size={16} color="var(--crm-muted)"/> {lead.phone_e164 || lead.phone || 'Geen nummer'} 
              </div>
              <div className={styles.drawerRow} style={{alignItems: 'flex-start'}}>
                <div style={{marginTop: '2px'}}>
                  <div className={styles.avatar}>{lead.brand ? lead.brand.substring(0,3).toUpperCase() : 'OTO'}</div>
                </div> 
                <div>
                  {[lead.brand, lead.model, lead.year].filter(Boolean).join(' ') || 'Geen auto details'}<br/>
                  {lead.kenteken && <span style={{color: 'var(--crm-muted)', fontSize: '11px'}}>Kenteken: {lead.kenteken}</span>}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className={styles.drawerFoot}>
        <Link href={\`/admin/jobs/nieuw?lead=\${lead.id}\`} className={styles.btnPrimary} style={{textDecoration: 'none'}}>
          <UserPlus size={16} /> Monteur Toewijzen
        </Link>
        <a href={\`tel:\${lead.phone_e164 || lead.phone}\`} className={styles.btnSecondary} style={{textDecoration: 'none'}}>
          <Phone size={16} /> Klant Bellen
        </a>
        <a href={waLink(lead.phone_e164 || '', "Hallo, we bellen u over uw autosleutel aanvraag.")} target="_blank" rel="noopener noreferrer" className={styles.btnSecondary} style={{textDecoration: 'none'}}>
          <MessageCircle size={16} color="#25D366" /> WhatsApp
        </a>
      </div>
    </div>
  );
}

export default function LeadsTable`;

code = code.replace(oldDrawer, newDrawer);

// Replace row mapping
const oldRowInfo = /<div className=\{styles\.rowInfo\}>[\s\S]*?<div className=\{styles\.rowAssignee\}>[\s\S]*?<\/div>\n              <\/div>/m;
const newRowInfo = `<div className={styles.rowInfo}>
                  <div className={styles.rowTitle}>
                    {[row.brand, row.model].filter(Boolean).join(' ') || 'Nieuwe Aanvraag'}
                    {row.status === 'new' && <Badge tone="stop">Spoed</Badge>}
                  </div>
                  <div className={styles.rowMeta}>{[row.year, row.kenteken].filter(Boolean).join(' • ') || 'Geen voertuig info'}</div>
                  <div className={styles.rowLocation}><MapPin size={12}/> {row.location || 'Onbekend'}</div>
                </div>

                <div className={styles.rowPrice}>
                  {row.quoted_price ? \`€\${row.quoted_price}\` : (row.sale_price ? \`€\${row.sale_price}\` : '—')}
                  <div style={{fontSize: '11px', color: 'var(--crm-muted)', fontWeight: 400}}>{row.source || 'Website'}</div>
                </div>

                <div className={styles.rowStatus}>
                  <Badge tone={leadTone(row.status)}>{STATUS_LABELS[row.status] || row.status}</Badge>
                  <div style={{fontSize: '11px', color: 'var(--crm-muted)', marginTop: '4px'}}>{timeAgo(row.created_at)}</div>
                </div>

                <div className={styles.rowAssignee}>
                  <div style={{fontSize: '12px', color: 'var(--crm-muted)'}}>Niet toegewezen</div>
                  <MoreHorizontal size={16} color="var(--crm-muted)" style={{marginLeft: 'auto'}} />
                </div>
              </div>`;

code = code.replace(oldRowInfo, newRowInfo);

// The regex might not have matched correctly if there are structural differences. Let's do it safer.
fs.writeFileSync('src/app/admin/leads/LeadsTable.tsx', code);
