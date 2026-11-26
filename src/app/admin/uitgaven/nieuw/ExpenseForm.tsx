'use client';

import { PreviewText } from '@/app/admin/PreviewLanguage';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ui } from '../../_ui';
import x from '../uitgaven.module.css';

const CATEGORIES = [
  { id: 'fuel', label: 'Brandstof' },
  { id: 'parking', label: 'Parkeren' },
  { id: 'toll', label: 'Tol' },
  { id: 'meals', label: 'Eten & Drinken' },
  { id: 'vehicle_maintenance', label: 'Voertuig Onderhoud' },
  { id: 'tool_subscription', label: 'Gereedschap Abonnement' },
  { id: 'phone', label: 'Telefonie' },
  { id: 'advertising', label: 'Advertenties' },
  { id: 'supplier', label: 'Leverancier' },
  { id: 'office', label: 'Kantoor' },
  { id: 'insurance', label: 'Verzekeringen' },
  { id: 'rent', label: 'Huur' },
  { id: 'training', label: 'Training' },
  { id: 'other', label: 'Overig' }
];

export default function ExpenseForm({ technicians, isOffice, myTechId }: { technicians: { id: string; name: string }[], isOffice: boolean, myTechId: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [category, setCategory] = useState('fuel');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dateIncurred, setDateIncurred] = useState(new Date().toISOString().split('T')[0]);
  const [technicianId, setTechnicianId] = useState(isOffice ? '' : myTechId || '');
  const [isReimbursable, setIsReimbursable] = useState(false);
  /* From the scan step: the stored file and what the reader got out of it. */
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [supplier, setSupplier] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [receiptText, setReceiptText] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanNote, setScanNote] = useState('');

  /* Photo or PDF in, fields out. The file is stored at once; the reading only fills the form, the user confirms. */
  async function scan(file: File) {
    setScanning(true); setScanNote(''); setError('');
    const fd = new FormData(); fd.append('file', file);
    const res = await fetch('/api/admin/expenses/scan', { method: 'POST', body: fd }).catch(() => null);
    const body = await res?.json().catch(() => null);
    if (!res || !res.ok) { setError(body?.error || 'Bestand kon niet worden verwerkt.'); setScanning(false); return; }
    setReceiptUrl(body.receipt_url ?? null);
    const r = body.reading;
    if (r) {
      if (r.total != null) setAmount(String(r.total));
      if (r.date) setDateIncurred(r.date);
      if (r.category) setCategory(r.category);
      if (r.description) setDescription(r.description);
      setSupplier(r.supplier ?? ''); setInvoiceNumber(r.invoiceNumber ?? ''); setReceiptText(r.text ?? '');
      const parts = [r.supplier, r.total != null ? `€ ${Number(r.total).toFixed(2).replace('.', ',')}` : null, r.date].filter(Boolean).join(' · ');
      setScanNote(`${r.confidence < 0.6 ? 'Onzeker gelezen, controleer: ' : 'Gelezen: '}${parts || 'geen velden herkend'}`);
    } else {
      setScanNote(body.note || 'Bon opgeslagen; vul de velden zelf in.');
    }
    setScanning(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');

    const numAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Voer een geldig bedrag in.');
      setBusy(false);
      return;
    }

    const res = await fetch('/api/admin/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        purchase_order_id: new URLSearchParams(window.location.search).get('inkoop'),
        category,
        description,
        amount: numAmount,
        date_incurred: dateIncurred,
        technician_id: technicianId || null,
        is_reimbursable: isReimbursable,
        receipt_url: receiptUrl,
        supplier_name: supplier || null,
        invoice_number: invoiceNumber || null,
        receipt_text: receiptText || null,
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setError(err.error || 'Opslaan mislukt');
      setBusy(false);
      return;
    }

    router.push('/admin/uitgaven');
    router.refresh();
  }

  return (
    <form onSubmit={save} className={x.form}>
      <div className={x.formGrid}>

        <label>
          <div className={x.formLabel}>Bon of factuur (foto of pdf)</div>
          <input type="file" accept="image/*,application/pdf" capture="environment" className={ui.input} disabled={scanning}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void scan(f); }} />
          <div className={x.formLabel} style={{ marginTop: 6, fontWeight: 400 }}>
            {scanning ? 'Bezig met lezen…' : scanNote || 'Maak een foto of kies een pdf; bedrag, datum, leverancier en categorie worden ingevuld. U controleert en slaat op.'}
          </div>
        </label>

        <label>
          <div className={x.formLabel}><PreviewText>{"Categorie"}</PreviewText></div>
          <select value={category} onChange={e => setCategory(e.target.value)} className={ui.input} required>
            {CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </label>

        <label>
          <div className={x.formLabel}>Bedrag (€)</div>
          <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className={ui.input} required placeholder="0.00" />
        </label>

        <label>
          <div className={x.formLabel}><PreviewText>{"Datum"}</PreviewText></div>
          <input type="date" value={dateIncurred} onChange={e => setDateIncurred(e.target.value)} className={ui.input} required />
        </label>

        <label>
          <div className={x.formLabel}><PreviewText>{"Omschrijving"}</PreviewText></div>
          <input type="text" value={description} onChange={e => setDescription(e.target.value)} className={ui.input} required placeholder="bijv. Tanken BP, Google Ads factuur..." />
        </label>

        <label>
          <div className={x.formLabel}>Leverancier</div>
          <input type="text" value={supplier} onChange={e => setSupplier(e.target.value)} className={ui.input} placeholder="bijv. Esso, Google, A-Key" />
        </label>

        <label>
          <div className={x.formLabel}>Factuurnummer (optioneel)</div>
          <input type="text" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} className={ui.input} />
        </label>

        {isOffice && (
          <label>
            <div className={x.formLabel}>Monteur (optioneel)</div>
            <select value={technicianId} onChange={e => setTechnicianId(e.target.value)} className={ui.input}>
              <option value="">Algemeen / kantoor</option>
              {technicians.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </label>
        )}

        <label className={x.checkLabel}>
          <input type="checkbox" checked={isReimbursable} onChange={e => setIsReimbursable(e.target.checked)} />
          <span>
            Dit is een declaratie (ik heb dit privé voorgeschoten en wil het terug).
          </span>
        </label>

        {error && <div className={x.err}>{error}</div>}

        <div className={x.formActions}>
          <button type="button" onClick={() => router.back()} className={ui.btn} disabled={busy}><PreviewText>{"Annuleren"}</PreviewText></button>
          <button type="submit" className={`${ui.btn} ${ui.btnPrimary}`} disabled={busy || scanning}>
            <PreviewText>{busy ? 'Opslaan...' : 'Opslaan'}</PreviewText>
          </button>
        </div>

      </div>
    </form>
  );
}