'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Badge, Card } from '../_ui';
import styles from '../leads/leads.module.css'; // Reusing layout styles
import { FileText, Clock, CheckCircle, Search, Download, Send, Phone, MessageCircle, MapPin, CheckSquare, MoreHorizontal } from 'lucide-react';

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const DATE = new Intl.DateTimeFormat('nl-NL', { day: '2-digit', month: 'short', year: 'numeric' });

interface InvoiceRow {
  id: string;
  invoice_number: string;
  issue_date: string;
  client_name: string;
  client_city: string | null;
  client_email: string | null;
  client_phone: string | null;
  total: number | string;
  status: 'concept' | 'verzonden' | 'betaald';
  job?: {
    id: string;
    car_make: string | null;
    car_model: string | null;
    kenteken: string | null;
    service_type: string | null;
    
  } | null;
}

function getDueDate(issueDate: string) {
  const d = new Date(issueDate);
  d.setDate(d.getDate() + 14);
  return d;
}

function isOverdue(issueDate: string) {
  return getDueDate(issueDate) < new Date();
}

function InvoiceDetailDrawer({ invoice, onClose }: { invoice: InvoiceRow; onClose: () => void }) {
  const [tab, setTab] = useState('Details');

  /* Held locally so the drawer reflects the change immediately; `invoice` is a
     server-rendered row and will not update until the page is refetched. */
  const [status, setStatusLocal] = useState(invoice.status);
  const [busy, setBusy] = useState<string | null>(null);
  const [saveError, setSaveError] = useState(false);

  async function setStatus(next: InvoiceRow['status']) {
    const previous = status;
    setStatusLocal(next);
    setBusy(next);
    setSaveError(false);
    try {
      const res = await fetch(`/api/admin/invoices/${invoice.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error(String(res.status));
    } catch {
      setStatusLocal(previous);
      setSaveError(true);
    } finally {
      setBusy(null);
    }
  }

  const dueDate = getDueDate(invoice.issue_date);
  const overdue = status === 'verzonden' && isOverdue(invoice.issue_date);

  return (
    <div className={styles.drawerCard}>
      <div className={styles.drawerHead} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div>
          <div style={{fontSize: '18px', fontWeight: 'bold', color: 'var(--crm-ink)'}}>Factuur {invoice.invoice_number}</div>
        </div>
        <div>
          {invoice.status === 'betaald' && <Badge tone="ok">Betaald</Badge>}
          {status === 'concept' && <Badge tone="info">Concept</Badge>}
          {status === 'verzonden' && !overdue && <Badge tone="warn">Openstaand</Badge>}
          {overdue && <Badge tone="stop">Vervallen</Badge>}
        </div>
      </div>
      
      {/*
        * All three of these shipped with no handler at all: the drawer looked
        * finished and did nothing. /api/admin/invoices/[id] already accepts a
        * status PATCH ('concept' | 'verzonden' | 'betaald'), and the invoice
        * page at /admin/facturen/[id] is the printable document — so each
        * button had somewhere real to go the whole time.
        *
        * Optimistic, and rolled back on failure, for the same reason as lead
        * triage: a button that appears to work and silently did not is worse
        * than one that is obviously missing.
        */}
      <div style={{padding: '16px', display: 'flex', gap: '8px', background: 'var(--crm-bg)'}}>
        <button
          type="button"
          className={styles.btnPrimary}
          style={{flex: 1, padding: '8px', fontSize: '13px'}}
          disabled={busy !== null || status === 'betaald'}
          onClick={() => setStatus('verzonden')}
        >
          <Send size={14}/> {busy === 'verzonden' ? 'Bezig…' : 'Verzenden'}
        </button>
        <button
          type="button"
          className={styles.btnSecondary}
          style={{flex: 1, padding: '8px', fontSize: '13px'}}
          disabled={busy !== null || status === 'betaald'}
          onClick={() => setStatus('betaald')}
        >
          <CheckCircle size={14}/> {busy === 'betaald' ? 'Bezig…' : 'Betaald'}
        </button>
        <Link
          href={`/admin/facturen/${invoice.id}`}
          className={styles.btnSecondary}
          style={{flex: 1, padding: '8px', fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px'}}
        >
          <Download size={14}/> PDF
        </Link>
      </div>
      {saveError && (
        <div style={{padding: '0 16px 12px', color: 'var(--crm-stop)', fontSize: '12px'}}>
          Opslaan mislukt — status ongewijzigd.
        </div>
      )}

      <div className={styles.drawerNav}>
        {['Details', 'Betalingen', 'Activiteit'].map(t => (
          <div key={t} className={`${styles.drawerTab} ${tab === t ? styles.active : ''}`} onClick={() => setTab(t)}>
            {t}
          </div>
        ))}
      </div>

      <div className={styles.drawerBody}>
        {tab === 'Details' && (
          <>
            <div className={styles.drawerSection}>
              <div style={{fontWeight: 600, fontSize: '13px', color: 'var(--crm-ink)'}}>Klant</div>
              <div className={styles.drawerRow}>
                <div className={styles.avatar}>{invoice.client_name?.substring(0,2).toUpperCase()}</div>
                <div>
                  <div style={{fontWeight: 500, color: 'var(--crm-ink)'}}>{invoice.client_name}</div>
                  <div style={{fontSize: '12px', color: 'var(--crm-muted)'}}>{invoice.client_phone || 'Geen telefoon'}</div>
                </div>
              </div>
            </div>

            {invoice.job && (
              <>
                <div style={{borderTop: '1px solid var(--crm-rule)', margin: '4px 0'}}></div>
                <div className={styles.drawerSection}>
                  <div style={{fontWeight: 600, fontSize: '13px', color: 'var(--crm-ink)'}}>Voertuig</div>
                  <div className={styles.drawerRow}>
                    <div className={styles.avatar} style={{background: 'transparent', border: '1px solid var(--crm-rule)'}}>🚗</div>
                    <div>
                      <div style={{fontWeight: 500, color: 'var(--crm-ink)'}}>{[invoice.job.car_make, invoice.job.car_model].filter(Boolean).join(' ') || 'Auto'} • {invoice.job.kenteken || ''}</div>
                      <div style={{fontSize: '12px', color: 'var(--crm-muted)'}}>{invoice.job.service_type || 'Service'}</div>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div style={{borderTop: '1px solid var(--crm-rule)', margin: '4px 0'}}></div>

            <div className={styles.drawerSection}>
              <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--crm-muted)', paddingBottom: '8px'}}>
                <div>Item</div>
                <div style={{display: 'flex', gap: '32px'}}>
                  <div style={{width: '20px'}}>Aantal</div>
                  <div style={{width: '60px', textAlign: 'right'}}>Totaal</div>
                </div>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--crm-ink)', borderTop: '1px solid var(--crm-rule2)', paddingTop: '8px'}}>
                <div>Diensten & Onderdelen</div>
                <div style={{display: 'flex', gap: '32px'}}>
                  <div style={{width: '20px', textAlign: 'center'}}>1</div>
                  <div style={{width: '60px', textAlign: 'right'}}>{MONEY.format(Number(invoice.total))}</div>
                </div>
              </div>
            </div>
            
            <div style={{background: 'var(--crm-bg)', padding: '16px', borderRadius: '8px', marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div style={{color: overdue ? 'var(--crm-stop)' : 'var(--crm-ink)'}}>
                <div style={{fontWeight: 'bold', fontSize: '16px'}}>Totaal openstaand</div>
                <div style={{fontSize: '12px'}}>{status === 'betaald' ? 'Volledig betaald' : `Vervaldatum: ${DATE.format(dueDate)}`}</div>
              </div>
              <div style={{fontWeight: 'bold', fontSize: '20px', color: invoice.status === 'betaald' ? 'var(--crm-ok)' : (overdue ? 'var(--crm-stop)' : 'var(--crm-ink)')}}>
                {invoice.status === 'betaald' ? '€0,00' : MONEY.format(Number(invoice.total))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function FacturenTable({ rows }: { rows: InvoiceRow[] }) {
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRow | null>(null);
  const [filter, setFilter] = useState<'All' | 'Draft' | 'Sent' | 'Due' | 'Overdue' | 'Paid'>('All');
  const [search, setSearch] = useState('');

  // Calculate Metrics
  const metrics = useMemo(() => {
    let outstandingCount = 0;
    let outstandingSum = 0;
    let overdueCount = 0;
    let overdueSum = 0;
    let paidThisMonthSum = 0;
    
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    rows.forEach(r => {
      const val = Number(r.total) || 0;
      if (r.status === 'betaald') {
        const issue = new Date(r.issue_date);
        if (issue >= firstDayOfMonth) paidThisMonthSum += val;
      } else if (r.status === 'verzonden') {
        if (isOverdue(r.issue_date)) {
          overdueCount++;
          overdueSum += val;
        } else {
          outstandingCount++;
          outstandingSum += val;
        }
      }
    });

    return { outstandingCount, outstandingSum, overdueCount, overdueSum, paidThisMonthSum };
  }, [rows]);

  // Filter rows
  const filteredRows = rows.filter(r => {
    if (search && !r.invoice_number.toLowerCase().includes(search.toLowerCase()) && !r.client_name?.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (filter === 'Draft' && r.status !== 'concept') return false;
    if (filter === 'Sent' && r.status !== 'verzonden') return false;
    if (filter === 'Due' && (r.status !== 'verzonden' || isOverdue(r.issue_date))) return false;
    if (filter === 'Overdue' && (r.status !== 'verzonden' || !isOverdue(r.issue_date))) return false;
    if (filter === 'Paid' && r.status !== 'betaald') return false;
    return true;
  });

  return (
    <>
      {/* Metric Cards */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px'}}>
        <div onClick={() => setFilter("Due")}><Card padded><div style={{display: "flex", flexDirection: "column", gap: "8px", cursor: "pointer", border: filter === "Due" ? "1px solid var(--crm-accent)" : undefined}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--crm-muted)', fontSize: '13px', fontWeight: 600}}>
            <FileText size={16} color="var(--crm-warn)"/> Openstaand
          </div>
          <div style={{fontSize: '24px', fontWeight: 'bold', color: 'var(--crm-ink)'}}>{MONEY.format(metrics.outstandingSum)}</div>
          <div style={{fontSize: '12px', color: 'var(--crm-muted)'}}>{metrics.outstandingCount} facturen open</div>
        </div></Card></div>
        
        <div onClick={() => setFilter("Overdue")}><Card padded><div style={{display: "flex", flexDirection: "column", gap: "8px", cursor: "pointer", border: filter === "Overdue" ? "1px solid var(--crm-accent)" : undefined}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--crm-muted)', fontSize: '13px', fontWeight: 600}}>
            <Clock size={16} color="var(--crm-stop)"/> Vervallen
          </div>
          <div style={{fontSize: '24px', fontWeight: 'bold', color: 'var(--crm-stop)'}}>{MONEY.format(metrics.overdueSum)}</div>
          <div style={{fontSize: '12px', color: 'var(--crm-muted)'}}>{metrics.overdueCount} facturen verlopen</div>
        </div></Card></div>

        <div onClick={() => setFilter("Paid")}><Card padded><div style={{display: "flex", flexDirection: "column", gap: "8px", cursor: "pointer", border: filter === "Paid" ? "1px solid var(--crm-accent)" : undefined}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--crm-muted)', fontSize: '13px', fontWeight: 600}}>
            <CheckCircle size={16} color="var(--crm-ok)"/> Deze Maand Betaald
          </div>
          <div style={{fontSize: '24px', fontWeight: 'bold', color: 'var(--crm-ink)'}}>{MONEY.format(metrics.paidThisMonthSum)}</div>
          <div style={{fontSize: '12px', color: 'var(--crm-ok)'}}>+18% tov vorige maand</div>
        </div></Card></div>
      </div>

      {/* Tabs & Search */}
      <div className={styles.filtersBar}>
        <div className={styles.tabs} style={{marginBottom: 0, paddingBottom: 0}}>
          {['All', 'Draft', 'Sent', 'Due', 'Overdue', 'Paid'].map(t => (
            <div key={t} className={`${styles.tab} ${filter === t ? styles.active : ''}`} onClick={() => setFilter(t as any)}>
              {t === 'All' ? 'Alles' : t === 'Draft' ? 'Concept' : t === 'Sent' ? 'Verzonden' : t === 'Due' ? 'Openstaand' : t === 'Overdue' ? 'Vervallen' : 'Betaald'}
            </div>
          ))}
        </div>
        <div className={styles.searchBox} style={{maxWidth: '300px', marginLeft: 'auto'}}>
          <Search size={16} color="var(--crm-muted)" />
          <input 
            type="text" 
            placeholder="Factuurnr of klant..." 
            className={styles.searchInput}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* List Layout */}
      <div className={styles.layout}>
        <div className={styles.listCol}>
          {/* Table Header (Desktop) */}
          <div className={styles.richRow} style={{background: 'transparent', border: 'none', paddingBottom: '8px', paddingTop: 0, color: 'var(--crm-muted)', fontSize: '12px', fontWeight: 600}}>
            <div style={{flex: '0 0 100px'}}>Factuur #</div>
            <div style={{flex: 2}}>Klant</div>
            <div style={{flex: 2}}>Voertuig / Klus</div>
            <div style={{flex: 1, textAlign: 'right'}}>Bedrag</div>
            <div style={{flex: 1, textAlign: 'right'}}>Vervaldatum</div>
            <div style={{flex: 1, textAlign: 'right'}}>Status</div>
          </div>

          {filteredRows.length === 0 && (
            <div style={{padding: '32px', textAlign: 'center', color: 'var(--crm-muted)'}}>Geen facturen gevonden.</div>
          )}

          {filteredRows.map(row => {
            const isSelected = selectedInvoice?.id === row.id;
            const overdue = row.status === 'verzonden' && isOverdue(row.issue_date);
            const due = getDueDate(row.issue_date);
            
            return (
              <div key={row.id} className={`${styles.richRow} ${isSelected ? styles.selected : ''}`} onClick={() => setSelectedInvoice(row)} style={{padding: '12px 16px', gap: '16px'}}>
                <div style={{flex: '0 0 100px', fontWeight: 600, color: 'var(--crm-ink)', fontSize: '13px'}}>{row.invoice_number}</div>
                
                <div style={{flex: 2, display: 'flex', flexDirection: 'column'}}>
                  <span style={{fontWeight: 500, fontSize: '14px', color: 'var(--crm-ink)'}}>{row.client_name}</span>
                  <span style={{fontSize: '11px', color: 'var(--crm-muted)'}}>{row.client_city || 'Onbekend'}</span>
                </div>

                <div style={{flex: 2, display: 'flex', flexDirection: 'column'}}>
                  <span style={{fontSize: '13px', color: 'var(--crm-ink)'}}>{row.job ? ([row.job.car_make, row.job.car_model].filter(Boolean).join(' ') || 'Auto') : 'Dienst'}</span>
                  <span style={{fontSize: '11px', color: 'var(--crm-muted)'}}>{row.job?.service_type || '—'}</span>
                </div>

                <div style={{flex: 1, textAlign: 'right', fontWeight: 600, fontSize: '14px', color: 'var(--crm-ink)'}}>
                  {MONEY.format(Number(row.total))}
                </div>

                <div style={{flex: 1, textAlign: 'right', fontSize: '12px', color: overdue ? 'var(--crm-stop)' : 'var(--crm-muted)'}}>
                  {DATE.format(due)}
                </div>

                <div style={{flex: 1, textAlign: 'right'}}>
                  {row.status === 'betaald' && <Badge tone="ok">Betaald</Badge>}
                  {row.status === 'concept' && <Badge tone="info">Concept</Badge>}
                  {row.status === 'verzonden' && !overdue && <Badge tone="warn">Openstaand</Badge>}
                  {overdue && <Badge tone="stop">Vervallen</Badge>}
                </div>
              </div>
            );
          })}
        </div>

        {selectedInvoice && (
          <div className={styles.drawerCol}>
            <InvoiceDetailDrawer invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
          </div>
        )}
      </div>
    </>
  );
}
