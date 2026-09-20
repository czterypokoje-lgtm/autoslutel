'use client';

import { Fragment, useState } from 'react';
import { getBrandLogo } from '@/lib/brandLogos';
import styles from './leads.module.css';
import Link from 'next/link';
import { waLink } from '@/lib/whatsapp';
import { PageHead, Badge } from '../_ui';
import { MoreHorizontal, Phone, MessageCircle, UserPlus, CheckSquare, MapPin, Check, X, AlertTriangle, Loader2 } from 'lucide-react';

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

function leadTone(status: string): 'ok' | 'warn' | 'stop' | 'info' | undefined {
  if (status === 'sold') return 'ok';
  if (status === 'contacted' || status === 'qualified') return 'warn';
  if (status === 'new') return 'info';
  /* rejected, spam and duplicate all read as 'info' before this — a rejected
     lead looked exactly like one waiting to be handled. */
  return undefined;
}

/**
 * How long a lead has been sitting at 'new'.
 *
 * The row used to put a red "Spoed" badge on every new lead regardless of age,
 * which makes the label meaningless: a lead that arrived four minutes ago and
 * one that has been ignored for three weeks looked identical, and the office
 * has 151 of the latter. Urgency is about the clock, not the status.
 */
function staleness(createdAt: string, staleBefore: string | null) {
  if (!staleBefore || createdAt >= staleBefore) return null;
  const hours = Math.floor((Date.now() - new Date(createdAt).getTime()) / 3_600_000);
  if (hours >= 48) return { label: `${Math.floor(hours / 24)} dagen oud`, tone: 'stop' as const };
  return { label: `${hours} uur oud`, tone: 'warn' as const };
}

/** The triage a lead can move to from the row, in the order the office uses. */
const TRIAGE: { value: string; label: string; tone: 'ok' | 'warn' | 'stop' }[] = [
  { value: 'qualified', label: 'Gekwalificeerd', tone: 'ok' },
  { value: 'contacted', label: 'Gebeld', tone: 'warn' },
  { value: 'rejected', label: 'Afgewezen', tone: 'stop' },
  { value: 'duplicate', label: 'Dubbel', tone: 'stop' },
];

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
            <div className={styles.drawerCar}>{lead.brand || 'Auto'} {lead.model}</div>
            <div className={styles.drawerSub}>
              {[lead.year, lead.kenteken].filter(Boolean).join(' • ') || 'Geen voertuig details'} 
              {' '}• Klus #{lead.id.slice(0, 5)}
            </div>
          </div>
          <div>
            <div className={styles.drawerPrice}>{lead.quoted_price ? `€${lead.quoted_price}` : (lead.sale_price ? `€${lead.sale_price}` : 'Prijs onbekend')}</div>
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
        <Link href={`/admin/jobs/nieuw?lead=${lead.id}`} className={styles.btnPrimary} style={{textDecoration: 'none'}}>
          <UserPlus size={16} /> Monteur Toewijzen
        </Link>
        <a href={`tel:${lead.phone_e164 || lead.phone}`} className={styles.btnSecondary} style={{textDecoration: 'none'}}>
          <Phone size={16} /> Klant Bellen
        </a>
        <a href={waLink(lead.phone_e164 || '', "Hallo, we bellen u over uw autosleutel aanvraag.") || '#'} target="_blank" rel="noopener noreferrer" className={styles.btnSecondary} style={{textDecoration: 'none'}}>
          <MessageCircle size={16} color="#25D366" /> WhatsApp
        </a>
      </div>
    </div>
  );
}

export default function LeadsTable({ rows, staleBefore, repeats }: { rows: LeadRow[]; staleBefore: string | null; repeats: Record<string, { count: number; last: string }> }) {
  const [selectedLead, setSelectedLead] = useState<LeadRow | null>(null);

  /*
   * Status is held here, not read straight from `rows`.
   *
   * The redesign dropped the status control entirely: /api/admin/leads/[id]
   * accepts a PATCH, and nothing in the UI called it. 151 of 199 leads sit at
   * 'new' partly because the office has had no way to move them.
   *
   * Local overrides keep the click instant — the row changes before the round
   * trip — and roll back if the server refuses, so a failed save is visible
   * rather than a lie that survives until the next refresh.
   */
  const [statusOverride, setStatusOverride] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  const statusOf = (row: LeadRow) => statusOverride[row.id] ?? row.status;

  async function triage(row: LeadRow, status: string) {
    const previous = statusOf(row);
    if (previous === status) return;
    setStatusOverride(o => ({ ...o, [row.id]: status }));
    setSaving(row.id);
    setFailed(null);
    try {
      const res = await fetch(`/api/admin/leads/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(String(res.status));
    } catch {
      setStatusOverride(o => ({ ...o, [row.id]: previous }));
      setFailed(row.id);
    } finally {
      setSaving(null);
    }
  }

  return (
    <>
      <div className={styles.layout}>
        <div className={styles.listCol}>
          {rows.map(row => {
            const isSelected = selectedLead?.id === row.id;
            const status = statusOf(row);
            const stale = status === 'new' ? staleness(row.created_at, staleBefore) : null;
            const repeat = row.phone_e164 ? repeats[row.phone_e164] : undefined;
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
                    {[row.brand, row.model].filter(Boolean).join(' ') || 'Nieuwe Aanvraag'}
                    {/* Age, not status. Every new lead used to be "Spoed". */}
                    {stale && <Badge tone={stale.tone}>{stale.label}</Badge>}
                    {/* repeats was passed in and never used — a returning
                        customer is the one row worth answering first. */}
                    {repeat && repeat.count > 1 && (
                      <Badge tone="warn">{repeat.count}e aanvraag</Badge>
                    )}
                  </div>
                  <div className={styles.rowMeta}>{[row.year, row.kenteken].filter(Boolean).join(' • ') || 'Geen voertuig info'}</div>
                  <div className={styles.rowLocation}><MapPin size={12}/> {row.location || 'Onbekend'}</div>
                </div>

                <div className={styles.rowPrice}>
                  <span>{row.quoted_price ? `€${row.quoted_price}` : (row.sale_price ? `€${row.sale_price}` : '—')}</span>
                  <div style={{fontSize: '11px', color: 'var(--crm-muted)', fontWeight: 400}}>{row.source || 'Website'}</div>
                </div>

                <div className={styles.rowStatus}>
                  <Badge tone={leadTone(status)}>{STATUS_LABELS[status] || status}</Badge>
                  <div style={{fontSize: '11px', color: 'var(--crm-muted)', margin: 0}}>{timeAgo(row.created_at)}</div>
                </div>

                {/*
                  * This said "Niet toegewezen" on every row, always, whatever
                  * the truth was. Replaced with the thing the office actually
                  * needs here: moving the lead out of 'new' without opening
                  * anything. stopPropagation so triaging does not also open
                  * the drawer.
                  */}
                <div className={styles.rowAssignee} onClick={e => e.stopPropagation()}>
                  {saving === row.id ? (
                    <span className={styles.triageBusy}><Loader2 size={14} /> opslaan…</span>
                  ) : failed === row.id ? (
                    <span className={styles.triageFailed}><AlertTriangle size={14} /> niet opgeslagen</span>
                  ) : (
                    <div className={styles.triage}>
                      {TRIAGE.map(t => (
                        <button
                          key={t.value}
                          type="button"
                          title={t.label}
                          aria-label={t.label}
                          className={`${styles.triageBtn} ${status === t.value ? styles.triageOn : ''}`}
                          onClick={() => triage(row, t.value)}
                        >
                          {t.value === 'qualified' ? <Check size={14} />
                            : t.value === 'contacted' ? <Phone size={14} />
                            : t.value === 'rejected' ? <X size={14} />
                            : <MoreHorizontal size={14} />}
                        </button>
                      ))}
                    </div>
                  )}
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
