'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ui } from '../_ui';
import styles from './invoice-form.module.css';

interface Line {
  description: string;
  quantity: string;
  unitPrice: string;
  discount: string;
  vatRate: string;
}

export interface InvoiceFormValues {
  billerName: string;
  billerStreet: string;
  billerPostcode: string;
  billerCity: string;
  billerEmail: string;
  billerPhone: string;
  billerKvk: string;
  billerBtw: string;
  billerIban: string;
  clientName: string;
  clientStreet: string;
  clientPostcode: string;
  clientCity: string;
  clientEmail: string;
  clientPhone: string;
  clientBtw: string;
  technicianId: string;
  creditApplied: string;
  notes: string;
  lines: Line[];
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
 *
 * Doubles as the edit form: pass `invoiceId` and this PATCHes the existing
 * row and its lines instead of creating a new one. The lines table has no
 * concept of "this line used to exist" — an edit simply replaces every line
 * with whatever is on screen when Opslaan is pressed, which is simpler and
 * exactly as correct, since the form is never partially submitted.
 */
export default function InvoiceForm({
  technicians,
  showTechnicianPicker,
  biller,
  invoiceId,
  initial,
}: {
  technicians: { id: string; name: string }[];
  showTechnicianPicker: boolean;
  biller: { name: string; email: string; phone: string; kvk: string; btw: string; iban: string };
  /** Present only when editing an existing invoice. */
  invoiceId?: string;
  initial?: InvoiceFormValues;
}) {
  const router = useRouter();
  const isEdit = Boolean(invoiceId);

  const [billerName, setBillerName] = useState(initial?.billerName ?? biller.name);
  const [billerStreet, setBillerStreet] = useState(initial?.billerStreet ?? '');
  const [billerPostcode, setBillerPostcode] = useState(initial?.billerPostcode ?? '');
  const [billerCity, setBillerCity] = useState(initial?.billerCity ?? '');
  const [billerEmail, setBillerEmail] = useState(initial?.billerEmail ?? biller.email);
  const [billerPhone, setBillerPhone] = useState(initial?.billerPhone ?? biller.phone);
  const [billerKvk, setBillerKvk] = useState(initial?.billerKvk ?? biller.kvk);
  const [billerBtw, setBillerBtw] = useState(initial?.billerBtw ?? biller.btw);
  const [billerIban, setBillerIban] = useState(initial?.billerIban ?? biller.iban);

  const [clientName, setClientName] = useState(initial?.clientName ?? '');
  const [clientStreet, setClientStreet] = useState(initial?.clientStreet ?? '');
  const [clientPostcode, setClientPostcode] = useState(initial?.clientPostcode ?? '');
  const [clientCity, setClientCity] = useState(initial?.clientCity ?? '');
  const [clientEmail, setClientEmail] = useState(initial?.clientEmail ?? '');
  const [clientPhone, setClientPhone] = useState(initial?.clientPhone ?? '');
  const [clientBtw, setClientBtw] = useState(initial?.clientBtw ?? '');

  const [technicianId, setTechnicianId] = useState(initial?.technicianId ?? '');
  const [lines, setLines] = useState<Line[]>(initial?.lines?.length ? initial.lines : [{ ...EMPTY_LINE }]);
  const [creditApplied, setCreditApplied] = useState(initial?.creditApplied ?? '0');
  const [notes, setNotes] = useState(initial?.notes ?? '');

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function updateLine(index: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  function addLine() {
    setLines((prev) => [...prev, { ...EMPTY_LINE }]);
  }

  /*
   * Real, office-maintained prices (dispatch_pricing, the same table
   * get_price reads for the voice/WhatsApp agent) offered as ready-made
   * lines — picking one fills in description + price instead of a
   * technician typing out "BMW 3 Serie bijmaken" and guessing the number
   * from memory. Fetched once; this list changes rarely enough that a
   * live subscription would be solving a problem that doesn't exist yet.
   */
  const [priceList, setPriceList] = useState<{ description: string; price: number }[]>([]);
  const [priceListError, setPriceListError] = useState('');
  useEffect(() => {
    fetch('/api/admin/price-list')
      .then(async (r) => {
        const body = await r.json().catch(() => null);
        if (!r.ok) {
          setPriceListError(`Prijslijst laden mislukt (${r.status}): ${body?.error ?? 'onbekende fout'}`);
          return;
        }
        setPriceList(body?.items ?? []);
      })
      .catch((err) => setPriceListError(`Prijslijst laden mislukt: ${err.message}`));
  }, []);

  function addLineFromTemplate(description: string) {
    const template = priceList.find((p) => p.description === description);
    if (!template) return;
    setLines((prev) => {
      const blankIndex = prev.findIndex((l) => !l.description.trim());
      const filled: Line = { ...EMPTY_LINE, description: template.description, unitPrice: String(template.price) };
      if (blankIndex === -1) return [...prev, filled];
      return prev.map((l, i) => (i === blankIndex ? filled : l));
    });
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
    const payload = {
      biller_name: billerName,
      biller_street: billerStreet,
      biller_postcode: billerPostcode,
      biller_city: billerCity,
      biller_email: billerEmail,
      biller_phone: billerPhone,
      biller_kvk: billerKvk,
      biller_btw: billerBtw,
      biller_iban: billerIban,
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
    };

    const response = await fetch(isEdit ? `/api/admin/invoices/${invoiceId}` : '/api/admin/invoices', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => null);

    if (!response || !response.ok) {
      const body = await response?.json().catch(() => null);
      setError(body?.error ?? 'Opslaan mislukt.');
      setSaving(false);
      return;
    }

    if (isEdit) {
      router.push(`/admin/facturen/${invoiceId}`);
    } else {
      const body = await response.json();
      router.push(`/admin/facturen/${body.id}`);
    }
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
            <Field label="IBAN" value={billerIban} onChange={setBillerIban} />
          </div>
        </div>

        <div className={styles.panel}>
          <h2>Aan (klant)</h2>
          <div className={styles.fieldGrid}>
            <Field label="Naam / bedrijf *" value={clientName} onChange={setClientName} autoFocus={!isEdit} />
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
        {priceListError && <p className={styles.error}>{priceListError}</p>}
        {priceList.length > 0 && (
          <label className={styles.field} style={{ marginBottom: '0.75rem' }}>
            <span className={styles.fieldLabel}>Snel toevoegen vanuit prijslijst</span>
            <select
              className={styles.control}
              value=""
              onChange={(e) => {
                if (e.target.value) addLineFromTemplate(e.target.value);
                e.target.value = '';
              }}
            >
              <option value="">— kies een auto/dienst —</option>
              {priceList.map((p) => (
                <option key={p.description} value={p.description}>
                  {p.description} — {MONEY.format(p.price)}
                </option>
              ))}
            </select>
          </label>
        )}
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
          {saving ? 'Opslaan…' : isEdit ? 'Wijzigingen opslaan' : 'Factuur aanmaken'}
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
