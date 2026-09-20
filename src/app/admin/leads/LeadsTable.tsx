'use client';

import { Fragment, useState } from 'react';
import { getBrandLogo } from '@/lib/brandLogos';
import styles from './leads.module.css';
import { waLink } from '@/lib/whatsapp';
import { PageHead, Badge } from '../_ui';
import { Search, MoreHorizontal, List, LayoutGrid, Map, Phone, MessageCircle, UserPlus, CheckSquare, Clock, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';

export interface LeadRow {
  id: string;
  created_at: string;
  name: string | null;
  phone: string | null;
  phone_e164: string | null;
  email: string | null;
  postcode: string | null;
  location: string | null;
  brand: string | null;
  model: string | null;
  year: string | null;
  kenteken: string | null;
  service: string | null;
  source: string | null;
  status: string;
  sale_price: number | string | null;
  quoted_price: number | string | null;
  consent_marketing: boolean | null;
  first_contact_at: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  new: 'Nieuw',
  qualified: 'Gekwalificeerd',
  contacted: 'In Behandeling',
  sold: 'Afgerond',
  rejected: 'Afgewezen',
  spam: 'Spam',
  duplicate: 'Dubbel',
};

function leadTone(status: string) {
  if (status === 'new') return 'info';
  if (status === 'contacted') return 'warn';
  if (status === 'sold') return 'ok';
  return 'info';
}

function timeAgo(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const mins = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (mins < 60) return `${mins} min geleden`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} uur geleden`;
  return `${Math.floor(hrs / 24)} dagen geleden`;
}

function LeadDetailDrawer({ lead, onClose }: { lead: LeadRow; onClose: () => void }) {
  const [tab, setTab] = useState('Algemeen');

  return (
    <div className={styles.drawerCard}>
      <div className={styles.drawerHead}>
        <div className={styles.drawerTitleRow}>
          <div>
            <div className={styles.drawerCar}>{lead.brand} {lead.model}</div>
            <div className={styles.drawerSub}>{lead.year || '2021'} • {lead.kenteken || '34 ABC 123'} • İş No: #{lead.id.slice(0, 5)}</div>
          </div>
          <div>
            <div className={styles.drawerPrice}>₺12.000 - 15.000</div>
            <div className={styles.drawerPriceSub}>Geschatte waarde</div>
          </div>
        </div>
        <div style={{fontSize: '13px', fontWeight: 600, color: 'var(--crm-ink)', marginBottom: '8px'}}>{lead.service || 'Smart key kwijt'}</div>
        <div className={styles.rowLocation} style={{marginBottom: '12px'}}><MapPin size={12}/> {lead.location || 'İstanbul, Beşiktaş'} <a href="#" style={{color: 'var(--crm-accent-hover)', marginLeft: '8px', textDecoration: 'none'}}>Bekijk op kaart</a></div>
      </div>
      
      <div className={styles.drawerNav}>
        {['Algemeen', 'Klant & Voertuig', 'Notities', 'Bestanden'].map(t => (
          <div key={t} className={`${styles.drawerTab} ${tab === t ? styles.active : ''}`} onClick={() => setTab(t)}>
            {t}
          </div>
        ))}
      </div>

      <div className={styles.drawerBody}>
        {tab === 'Algemeen' && (
          <>
            <div className={styles.drawerSection}>
              <div style={{fontWeight: 600, fontSize: '13px', color: 'var(--crm-ink)'}}>Klant & Voertuig</div>
              <div className={styles.drawerRow}><CheckSquare size={16} color="var(--crm-muted)"/> {lead.name || 'Burak Demir'}</div>
              <div className={styles.drawerRow}><Phone size={16} color="var(--crm-muted)"/> {lead.phone || '+90 532 111 22 33'} <div style={{width: '24px', height: '24px', background: '#25D366', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><MessageCircle size={14}/></div></div>
              <div className={styles.drawerRow} style={{alignItems: 'flex-start'}}><div style={{marginTop: '2px'}}><div className={styles.avatar}>BMW</div></div> <div>{lead.brand} {lead.model} {lead.year}<br/><span style={{color: 'var(--crm-muted)', fontSize: '11px'}}>VIN: WBAJU71060V9E12345</span></div></div>
            </div>

            <div style={{borderTop: '1px solid var(--crm-rule)', margin: '10px 0'}}></div>

            <div className={styles.drawerSection}>
              <div style={{fontWeight: 600, fontSize: '13px', color: 'var(--crm-ink)'}}>Voorgestelde Monteur</div>
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
                  <div className={styles.avatar}>MK</div>
                  <div>
                    <div style={{fontWeight: 600, fontSize: '13px'}}>Mert Kaya</div>
                    <div style={{fontSize: '11px', color: 'var(--crm-muted)'}}><MapPin size={10} style={{display: 'inline'}}/> 12 km ver • 12 dk</div>
                  </div>
                </div>
                <div style={{textAlign: 'right'}}>
                  <div style={{fontSize: '11px', color: 'var(--crm-muted)'}}>Slagingskans</div>
                  <Badge tone="ok">%92 Match</Badge>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className={styles.drawerFoot}>
        <button className={styles.btnPrimary}><UserPlus size={16} /> Monteur Toewijzen</button>
        <button className={styles.btnSecondary}><Phone size={16} /> Klant Bellen</button>
        <button className={styles.btnSecondary}><MessageCircle size={16} color="#25D366" /> WhatsApp</button>
      </div>
    </div>
  );
}

export default function LeadsTable({ rows, staleBefore, repeats }: { rows: LeadRow[]; staleBefore: string | null; repeats: Record<string, { count: number; last: string }> }) {
  const [selectedLead, setSelectedLead] = useState<LeadRow | null>(null);

  const newLeads = rows.filter(r => r.status === 'new').length;
  const contacted = rows.filter(r => r.status === 'contacted').length;
  const sold = rows.filter(r => r.status === 'sold').length;

  return (
    <>
      <div className={styles.layout}>
        <div className={styles.listCol}>
          {rows.map(row => {
            const isSelected = selectedLead?.id === row.id;
            return (
              <div key={row.id} className={`${styles.richRow} ${isSelected ? styles.selected : ''}`} onClick={() => setSelectedLead(row)}>
                <input type="checkbox" onClick={e => e.stopPropagation()} />
                <div style={{width: '40px', textAlign: 'center'}}>
                  {getBrandLogo(row.brand) ? (
                    <img src={getBrandLogo(row.brand)!} alt={row.brand || ''} style={{width: '32px', height: '32px', objectFit: 'contain'}} />
                  ) : (
                    <div className={styles.avatar}>{row.brand?.substring(0,3).toUpperCase() || 'OTO'}</div>
                  )}
                </div>
                
                <div className={styles.rowInfo}>
                  <div className={styles.rowTitle}>
                    {row.brand} {row.model}
                    {row.status === 'new' && <Badge tone="stop">Spoed</Badge>}
                  </div>
                  <div className={styles.rowMeta}>{row.year || '2021'} • {row.kenteken || '34 ABC 123'}</div>
                  <div className={styles.rowLocation}><MapPin size={12}/> {row.location || 'İstanbul'}</div>
                </div>

                <div className={styles.rowPrice}>
                  {row.sale_price ? `€${row.sale_price}` : '₺12.000 - 15.000'}
                  <div style={{fontSize: '11px', color: 'var(--crm-muted)', fontWeight: 400}}>{row.source || 'Google'}</div>
                </div>

                <div className={styles.rowStatus}>
                  <Badge tone={leadTone(row.status)}>{STATUS_LABELS[row.status] || row.status}</Badge>
                  <div style={{fontSize: '11px', color: 'var(--crm-muted)', marginTop: '4px'}}>{timeAgo(row.created_at)}</div>
                </div>

                <div className={styles.rowAssignee}>
                  {row.status !== 'new' ? (
                    <>
                      <div className={styles.avatar}>MK</div>
                      <div>
                        <div className={styles.assigneeName}>Mert Kaya</div>
                        <div className={styles.fitScore}>%92 match</div>
                      </div>
                    </>
                  ) : (
                    <div style={{fontSize: '12px', color: 'var(--crm-muted)'}}>Niet toegewezen</div>
                  )}
                  <MoreHorizontal size={16} color="var(--crm-muted)" style={{marginLeft: 'auto'}} />
                </div>
              </div>
            );
          })}
        </div>

        {selectedLead && (
          <div className={styles.drawerCol}>
            <LeadDetailDrawer lead={selectedLead} onClose={() => setSelectedLead(null)} />
          </div>
        )}
      </div>
    </>
  );
}
