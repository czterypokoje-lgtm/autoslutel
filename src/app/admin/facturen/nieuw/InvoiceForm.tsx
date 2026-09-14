'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ui } from '../../_ui';
import styles from './nieuw.module.css';

interface Line {
  description: string;
  quantity: string;
  unitPrice: string;
  discount: string;
  vatRate: string;
}

const EMPTY_LINE: Line = { description: '', quantity: '1', unitPrice: '', discount: '0', vatRate: '21' };

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

function num(value: string): number {
  const n = Number(value.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

/**
 * The whole invoice on one screen — the office asked for something a
 * technician can fill in "very fast", so every total updates as they type
 * rather than waiting for a save round-trip, and a new line is one click, not
 * a modal.
 */
export default function InvoiceForm({
  technicians,
  showTechnicianPicker,
  biller,
}: {
  technicians: { id: string; name: string }[];
  showTechnicianPicker: boolean;
  biller: { name: string; email: string; phone: string; kvk: string; btw: string };
}) {
  const router = useRouter();

  const [billerName, setBillerName] = useState(biller.name);
  const [billerStreet, setBillerStreet] = useState('');
  const [billerPostcode, setBillerPostcode] = useState('');
  const [billerCity, setBillerCity] = useState('');
  const [billerEmail, setBillerEmail] = useState(biller.email);
  const [billerPhone, setBillerPhone] = useState(biller.phone);
  const [billerKvk, setBillerKvk] = useState(biller.kvk);
  const [billerBtw, setBillerBtw] = useState(biller.btw);

  const [clientName, setClientName] = useState('');
  const [clientStreet, setClientStreet] = useState('');
  const [clientPostcode, setClientPostcode] = useState('');
  const [clientCity, setClientCity] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientBtw, setClientBtw] = useState('');

  const [technicianId, setTechnicianId] = useState('');
  const [lines, setLines] = useState<Line[]>([{ ...EMPTY_LINE }]);
  const [creditApplied, setCreditApplied] = useState('0');
  const [notes, setNotes] = useState('');

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function updateLine(index: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  function addLine() {
    setLines((prev) => [...prev, { ...EMPTY_LINE }]);
  }

  function removeLine(index: number) {
    setLines((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  const totals = useMemo(() => {
    let subtotal = 0;
    let vat = 0;
    for (const l of lines) {
      const base = num(l.quantity) * num(l.unitPrice) - num(l.discount);
      subtotal += base;
      vat += base * (num(l.vatRate) / 100);
    }
    const credit = num(creditApplied);
    return {
      subtotal,
      vat,
      total: subtotal + vat - credit,
      credit,
    };
  }, [lines, creditApplied]);

  async function save() {
    setError('');

    if (!clientName.trim()) {
      setError('Naam van de klant is verplicht.');
      return;
    }
    const goodLines = lines.filter((l) => l.description.trim() && num(l.unitPrice) >= 0 && num(l.quantity) > 0);
    if (!goodLines.length) {
      setError('Voeg minstens één regel toe met een omschrijving, aantal en prijs.');
      return;
    }

    setSaving(true);
    const response = await fetch('/api/admin/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        biller_name: billerName,
        biller_street: billerStreet,
        biller_postcode: billerPostcode,
        biller_city: billerCity,
        biller_email: billerEmail,
        biller_phone: billerPhone,
        biller_kvk: billerKvk,
        biller_btw: billerBtw,
        client_name: clientName,
        client_street: clientStreet,
        client_postcode: clientPostcode,
        client_city: clientCity,
        client_email: clientEmail,
        client_phone: clientPhone,
        client_btw: clientBtw,
        technician_id: technicianId || null,
        credit_applied: creditApplied,
        notes,
        lines: goodLines.map((l) => ({
          description: l.description,
          quantity: num(l.quantity),
          unitPrice: num(l.unitPrice),
          discount: num(l.discount),
          vatRate: num(l.vatRate),
        })),
      }),
    }).catch(() => null);

    if (!response || !response.ok) {
      const body = await response?.json().catch(() => null);
      setError(body?.error ?? 'Opslaan mislukt.');
      setSaving(false);
      return;
    }

    const body = await response.json();
    router.push(`/admin/facturen/${body.id}`);
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.grid}>
        <div className={styles.panel}>
          <h2>Van (uw bedrijf)</h2>
          <div className={styles.fieldGrid}>
            <Field label="Bedrijfsnaam" value={billerName} onChange={setBillerName} />
            <Field label="Straat + nummer" value={billerStreet} onChange={setBillerStreet} />
            <Field label="Postcode" value={billerPostcode} onChange={setBillerPostcode} />
            <Field label="Plaats" value={billerCity} onChange={setBillerCity} />
            <Field label="E-mail" value={billerEmail} onChange={setBillerEmail} />
            <Field label="Telefoon" value={billerPhone} onChange={setBillerPhone} />
            <Field label="KvK" value={billerKvk} onChange={setBillerKvk} />
            <Field label="BTW-nummer" value={billerBtw} onChange={setBillerBtw} />
          </div>
        </div>

        <div className={styles.panel}>
          <h2>Aan (klant)</h2>
          <div className={styles.fieldGrid}>
            <Field label="Naam / bedrijf *" value={clientName} onChange={setClientName} autoFocus />
            <Field label="Straat + nummer" value={clientStreet} onChange={setClientStreet} />
            <Field label="Postcode" value={clientPostcode} onChange={setClientPostcode} />
            <Field label="Plaats" value={clientCity} onChange={setClientCity} />
            <Field label="E-mail" value={clientEmail} onChange={setClientEmail} />
            <Field label="Telefoon" value={clientPhone} onChange={setClientPhone} />
            <Field label="BTW-nummer" value={clientBtw} onChange={setClientBtw} />
            {showTechnicianPicker && (
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Monteur (optioneel)</span>
                <select
                  className={styles.control}
                  value={technicianId}
                  onChange={(e) => setTechnicianId(e.target.value)}
                >
                  <option value="">— geen —</option>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </div>
      </div>

      <div className={styles.panel}>
        <h2>Regels</h2>
        <div className={styles.linesHead}>
          <span>Beschrijving</span>
          <span>Aantal</span>
          <span>Prijs</span>
          <span>Korting</span>
          <span>Btw %</span>
          <span className={styles.right}>Totaal</span>
          <span />
        </div>
        {lines.map((line, i) => {
          const lineTotal = num(line.quantity) * num(line.unitPrice) - num(line.discount);
          return (
            <div className={styles.lineRow} key={i}>
              <input
                className={styles.control}
                placeholder="Omschrijving"
                value={line.description}
                onChange={(e) => updateLine(i, { description: e.target.value })}
              />
              <input
                className={styles.control}
                type="number"
                min="0"
                step="1"
                value={line.quantity}
                onChange={(e) => updateLine(i, { quantity: e.target.value })}
              />
              <input
                className={styles.control}
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={line.unitPrice}
                onChange={(e) => updateLine(i, { unitPrice: e.target.value })}
              />
              <input
                className={styles.control}
                type="number"
                min="0"
                step="0.01"
                value={line.discount}
                onChange={(e) => updateLine(i, { discount: e.target.value })}
              />
              <input
                className={styles.control}
                type="number"
                min="0"
                max="100"
                step="1"
                value={line.vatRate}
                onChange={(e) => updateLine(i, { vatRate: e.target.value })}
              />
              <span className={styles.lineTotal}>{MONEY.format(lineTotal)}</span>
              <button
                type="button"
                className={ui.btnIcon ? `${ui.btn} ${ui.btnIcon}` : ui.btn}
                onClick={() => removeLine(i)}
                aria-label="Regel verwijderen"
                disabled={lines.length === 1}
              >
                ×
              </button>
            </div>
          );
        })}
        <button type="button" className={ui.btn} onClick={addLine}>
          + Regel toevoegen
        </button>
      </div>

      <div className={styles.bottom}>
        <div className={styles.panel}>
          <h2>Notitie (optioneel)</h2>
          <textarea
            className={styles.textarea}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Verschijnt onderaan de factuur"
          />
        </div>

        <div className={styles.panel}>
          <h2>Totalen</h2>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Credit toegepast</span>
            <input
              className={styles.control}
              type="number"
              step="0.01"
              value={creditApplied}
              onChange={(e) => setCreditApplied(e.target.value)}
            />
          </label>
          <div className={styles.totalsBlock}>
            <div className={styles.totalsLine}>
              <span>Subtotaal</span>
              <span>{MONEY.format(totals.subtotal)}</span>
            </div>
            <div className={styles.totalsLine}>
              <span>Btw</span>
              <span>{MONEY.format(totals.vat)}</span>
            </div>
            {totals.credit > 0 && (
              <div className={styles.totalsLine}>
                <span>Credit</span>
                <span>-{MONEY.format(totals.credit)}</span>
              </div>
            )}
            <div className={styles.totalsLineFinal}>
              <span>Totaal</span>
              <span>{MONEY.format(totals.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        <button type="button" className={`${ui.btn} ${ui.btnPrimary}`} onClick={save} disabled={saving}>
          {saving ? 'Opslaan…' : 'Factuur aanmaken'}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
}) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <input
        className={styles.control}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
      />
    </label>
  );
}
