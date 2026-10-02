'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle, Clock, Download, FileText, Search, Send, X } from 'lucide-react';
import styles from './facturen-list.module.css';

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const DATE = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });

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
  technician_name: string | null;
  logo: string | null;
  job?: {
    id: string;
    car_make: string | null;
    car_model: string | null;
    kenteken: string | null;
    service_type: string | null;
  } | null;
}

/** Payment term: 14 days after the invoice date. */
function dueDate(issueDate: string) {
  const d = new Date(issueDate);
  d.setDate(d.getDate() + 14);
  return d;
}
const isOverdue = (row: { status: string; issue_date: string }) => row.status === 'verzonden' && dueDate(row.issue_date) < new Date();

function StatusPill({ row, status }: { row: InvoiceRow; status?: InvoiceRow['status'] }) {
  const st = status ?? row.status;
  if (st === 'betaald') return <span className={`${styles.pill} ${styles.pillPaid}`}>Betaald</span>;
  if (st === 'concept') return <span className={`${styles.pill} ${styles.pillDraft}`}>Concept</span>;
  if (isOverdue({ status: st, issue_date: row.issue_date })) return <span className={`${styles.pill} ${styles.pillLate}`}>Te laat</span>;
  return <span className={`${styles.pill} ${styles.pillOpen}`}>Openstaand</span>;
}

const carOf = (row: InvoiceRow) => (row.job ? [row.job.car_make, row.job.car_model].filter(Boolean).join(' ') || 'Auto' : null);

/** The selected invoice: status buttons, PDF, and the essentials. */
function Drawer({ invoice, onClose, showTechnician }: { invoice: InvoiceRow; onClose: () => void; showTechnician: boolean }) {
  /* Held locally so the drawer reflects the change at once; the list row is
     server-rendered and updates on the next load. Rolled back on failure. */
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

  const overdue = isOverdue({ status, issue_date: invoice.issue_date });
  const car = carOf(invoice);

  return (
    <aside className={styles.drawer} aria-label={`Factuur ${invoice.invoice_number}`}>
      <div className={styles.drawerHead}>
        <div>
          <span className={styles.drawerLabel}>Factuur</span>
          <h2 className={styles.drawerTitle}>{invoice.invoice_number}</h2>
        </div>
        <StatusPill row={invoice} status={status} />
        <button type="button" className={styles.close} onClick={onClose} aria-label="Sluiten">
          <X size={18} />
        </button>
      </div>

      <div className={styles.drawerActions}>
        <button type="button" className={styles.btnPrimary} disabled={busy !== null || status !== 'concept'} onClick={() => setStatus('verzonden')}>
          <Send size={15} /> {busy === 'verzonden' ? 'Bezig…' : 'Verzonden'}
        </button>
        <button type="button" className={styles.btnOk} disabled={busy !== null || status === 'betaald'} onClick={() => setStatus('betaald')}>
          <CheckCircle size={15} /> {busy === 'betaald' ? 'Bezig…' : 'Betaald'}
        </button>
        <Link href={`/admin/facturen/${invoice.id}`} className={styles.btnGhost}>
          <Download size={15} /> PDF
        </Link>
      </div>
      {saveError && <p className={styles.error}>Opslaan mislukt, de status is niet veranderd.</p>}

      <dl className={styles.facts}>
        <div>
          <dt>Klant</dt>
          <dd>
            {invoice.client_name}
            {invoice.client_city && <span>{invoice.client_city}</span>}
            {invoice.client_phone && <span>{invoice.client_phone}</span>}
          </dd>
        </div>
        {car && (
          <div>
            <dt>Auto</dt>
            <dd>
              {car}
              <span>
                {[invoice.job?.kenteken, invoice.job?.service_type].filter(Boolean).join(' · ') || '—'}
              </span>
            </dd>
          </div>
        )}
        {showTechnician && (
          <div>
            <dt>Op naam van monteur</dt>
            <dd>{invoice.technician_name ?? <span>geen</span>}</dd>
          </div>
        )}
        <div>
          <dt>Factuurdatum</dt>
          <dd>{DATE.format(new Date(invoice.issue_date))}</dd>
        </div>
        <div>
          <dt>Vervaldatum</dt>
          <dd className={overdue ? styles.lateText : undefined}>{DATE.format(dueDate(invoice.issue_date))}</dd>
        </div>
      </dl>

      <div className={overdue ? `${styles.total} ${styles.totalLate}` : styles.total}>
        <span>{status === 'betaald' ? 'Betaald' : 'Openstaand'}</span>
        <b>{MONEY.format(Number(invoice.total))}</b>
      </div>

      <Link href={`/admin/facturen/${invoice.id}/bewerken`} className={styles.editLink}>
        Factuur bewerken →
      </Link>
    </aside>
  );
}

type Filter = 'alle' | 'concept' | 'open' | 'laat' | 'betaald';
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'alle', label: 'Alle' },
  { id: 'concept', label: 'Concept' },
  { id: 'open', label: 'Openstaand' },
  { id: 'laat', label: 'Te laat' },
  { id: 'betaald', label: 'Betaald' },
];

export default function FacturenTable({ rows, showTechnician = false }: { rows: InvoiceRow[]; showTechnician?: boolean }) {
  const [selected, setSelected] = useState<InvoiceRow | null>(null);
  const [filter, setFilter] = useState<Filter>('alle');
  const [search, setSearch] = useState('');

  const m = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const sum = (list: InvoiceRow[]) => list.reduce((t, r) => t + (Number(r.total) || 0), 0);
    const open = rows.filter((r) => r.status === 'verzonden' && !isOverdue(r));
    const late = rows.filter((r) => isOverdue(r));
    const paid = rows.filter((r) => r.status === 'betaald');
    const paidThis = paid.filter((r) => new Date(r.issue_date) >= monthStart);
    const paidPrev = paid.filter((r) => {
      const d = new Date(r.issue_date);
      return d >= prevStart && d < monthStart;
    });
    return {
      open: { n: open.length, sum: sum(open) },
      late: { n: late.length, sum: sum(late) },
      concept: rows.filter((r) => r.status === 'concept').length,
      paidThis: sum(paidThis),
      paidPrev: sum(paidPrev),
    };
  }, [rows]);

  const change = m.paidPrev > 0 ? Math.round(((m.paidThis - m.paidPrev) / m.paidPrev) * 100) : null;

  const term = search.trim().toLowerCase();
  const list = rows.filter((r) => {
    if (term && !`${r.invoice_number} ${r.client_name ?? ''} ${r.client_city ?? ''}`.toLowerCase().includes(term)) return false;
    if (filter === 'concept') return r.status === 'concept';
    if (filter === 'open') return r.status === 'verzonden' && !isOverdue(r);
    if (filter === 'laat') return isOverdue(r);
    if (filter === 'betaald') return r.status === 'betaald';
    return true;
  });

  return (
    <>
      <div className={styles.metrics}>
        <button type="button" className={filter === 'open' ? styles.metricOn : styles.metric} onClick={() => setFilter('open')}>
          <span className={styles.metricLabel}><FileText size={15} /> Openstaand</span>
          <b>{MONEY.format(m.open.sum)}</b>
          <span>{m.open.n} facturen</span>
        </button>
        <button type="button" className={filter === 'laat' ? styles.metricOn : styles.metric} onClick={() => setFilter('laat')}>
          <span className={styles.metricLabel}><Clock size={15} /> Te laat</span>
          <b className={m.late.n ? styles.lateText : undefined}>{MONEY.format(m.late.sum)}</b>
          <span>{m.late.n ? `${m.late.n} facturen · bel of stuur een herinnering` : 'niets te laat'}</span>
        </button>
        <button type="button" className={filter === 'betaald' ? styles.metricOn : styles.metric} onClick={() => setFilter('betaald')}>
          <span className={styles.metricLabel}><CheckCircle size={15} /> Betaald deze maand</span>
          <b>{MONEY.format(m.paidThis)}</b>
          <span>
            {change === null ? 'geen vergelijking met vorige maand' : `${change >= 0 ? '↑' : '↓'} ${Math.abs(change)}% vs vorige maand`}
          </span>
        </button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.filters} role="group" aria-label="Filter">
          {FILTERS.map((f) => (
            <button key={f.id} type="button" className={filter === f.id ? styles.filterOn : styles.filter} onClick={() => setFilter(f.id)}>
              {f.label}
              {f.id === 'concept' && m.concept > 0 && <span className={styles.count}>{m.concept}</span>}
              {f.id === 'laat' && m.late.n > 0 && <span className={`${styles.count} ${styles.countLate}`}>{m.late.n}</span>}
            </button>
          ))}
        </div>
        <label className={styles.search}>
          <Search size={16} aria-hidden="true" />
          <input type="search" placeholder="Factuurnummer, klant of plaats" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Zoek factuur" />
        </label>
      </div>

      <div className={selected ? `${styles.layout} ${styles.layoutOpen}` : styles.layout}>
        <div className={styles.table} role="table" aria-label="Facturen">
          <div className={`${styles.row} ${styles.head} ${showTechnician ? styles.withTech : ''}`} role="row">
            <span role="columnheader">Nummer</span>
            <span role="columnheader">Klant</span>
            <span role="columnheader">Auto / klus</span>
            {showTechnician && <span role="columnheader" className={styles.colTech}>Monteur</span>}
            <span role="columnheader" className={styles.num}>Bedrag</span>
            <span role="columnheader" className={styles.colDue}>Vervalt</span>
            <span role="columnheader">Status</span>
          </div>
          {list.length === 0 && <p className={styles.empty}>Geen facturen gevonden.</p>}
          {list.map((row) => {
            const car = carOf(row);
            const late = isOverdue(row);
            return (
              <button
                key={row.id}
                type="button"
                role="row"
                className={`${styles.row} ${showTechnician ? styles.withTech : ''} ${selected?.id === row.id ? styles.rowOn : ''}`}
                onClick={() => setSelected(row)}
              >
                <span className={styles.nr}>{row.invoice_number}</span>
                <span className={styles.client}>
                  <b>{row.client_name}</b>
                  <small>{row.client_city || '—'}</small>
                </span>
                <span className={styles.car}>
                  {row.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={row.logo} alt="" />
                  ) : (
                    <i aria-hidden="true" />
                  )}
                  <span>
                    <b>{car ?? 'Dienst'}</b>
                    <small>{row.job?.service_type || '—'}</small>
                  </span>
                </span>
                {showTechnician && <span className={`${styles.tech} ${styles.colTech}`}>{row.technician_name ?? '—'}</span>}
                <span className={`${styles.num} ${styles.amount}`}>{MONEY.format(Number(row.total))}</span>
                <span className={`${late ? styles.lateText : styles.due} ${styles.colDue}`}>{DATE.format(dueDate(row.issue_date))}</span>
                <span>
                  <StatusPill row={row} />
                </span>
              </button>
            );
          })}
        </div>

        {selected && <Drawer key={selected.id} invoice={selected} onClose={() => setSelected(null)} showTechnician={showTechnician} />}
      </div>
    </>
  );
}
