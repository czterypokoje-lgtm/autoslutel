'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../jobs.module.css';
import { JOB_STATUSES, JOB_STATUS_LABELS, TIME_SLOTS, trimTime } from '@/lib/crmJobs';

export interface JobDetail {
  id: string;
  status: string;
  technician_id: string | null;
  scheduled_date: string;
  slot_start: string | null;
  slot_end: string | null;
  street: string | null;
  postcode: string | null;
  city: string | null;
  kenteken: string | null;
  car_make: string | null;
  car_model: string | null;
  car_year: number | null;
  keyless: boolean | null;
  scenario: string | null;
  service_type: string | null;
  quoted_price: number | string | null;
  final_price: number | string | null;
  commission_pct: number | string | null;
  commission_amount: number | string | null;
  notes: string | null;
  started_at: string | null;
  completed_at: string | null;
  revenue_callout: number | null;
  revenue_materials: number | null;
  revenue_labor: number | null;
  revenue_discount: number | null;
  cost_materials: number | null;
  cost_technician: number | null;
  cost_travel: number | null;
  cost_payment_fee: number | null;
  cost_other: number | null;
  gross_margin: number | null;
}

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

export default function JobEditor({
  job,
  technicians,
}: {
  job: JobDetail;
  technicians: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState(job.status);
  const [technicianId, setTechnicianId] = useState(job.technician_id ?? '');
  const [date, setDate] = useState(job.scheduled_date);
  const [slot, setSlot] = useState(trimTime(job.slot_start));
  const [finalPrice, setFinalPrice] = useState(
    job.final_price === null ? '' : String(job.final_price)
  );
  /*
   * Commission, correctable here after the fact — a price gets renegotiated
   * at the kerb often enough that the cut agreed when the job was planned is
   * not always the cut that ends up being right.
   */
  const [commissionPct, setCommissionPct] = useState(
    job.commission_pct === null ? '' : String(job.commission_pct)
  );
  const [commissionAmount, setCommissionAmount] = useState(
    job.commission_amount === null ? '' : String(job.commission_amount)
  );
  const [notes, setNotes] = useState(job.notes ?? '');
  const [city, setCity] = useState(job.city ?? '');
  const [postcode, setPostcode] = useState(job.postcode ?? '');
  const [carMake, setCarMake] = useState(job.car_make ?? '');
  const [carModel, setCarModel] = useState(job.car_model ?? '');
  const [carYear, setCarYear] = useState(job.car_year === null ? '' : String(job.car_year));
  const [keylessChoice, setKeylessChoice] = useState<'' | 'true' | 'false'>(
    job.keyless === null ? '' : job.keyless ? 'true' : 'false'
  );
  const [scenarioChoice, setScenarioChoice] = useState(job.scenario ?? '');

  const [revCallout, setRevCallout] = useState(job.revenue_callout === null ? '' : String(job.revenue_callout));
  const [revMaterials, setRevMaterials] = useState(job.revenue_materials === null ? '' : String(job.revenue_materials));
  const [revLabor, setRevLabor] = useState(job.revenue_labor === null ? '' : String(job.revenue_labor));
  const [revDiscount, setRevDiscount] = useState(job.revenue_discount === null ? '' : String(job.revenue_discount));
  
  const [costMaterials, setCostMaterials] = useState(job.cost_materials === null ? '' : String(job.cost_materials));
  const [costTech, setCostTech] = useState(job.cost_technician === null ? '' : String(job.cost_technician));
  const [costTravel, setCostTravel] = useState(job.cost_travel === null ? '' : String(job.cost_travel));
  const [costFee, setCostFee] = useState(job.cost_payment_fee === null ? '' : String(job.cost_payment_fee));
  const [costOther, setCostOther] = useState(job.cost_other === null ? '' : String(job.cost_other));

  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  /*
   * The split reads off the werkelijke prijs once there is one, and the
   * afgesproken prijs until then — that is the number the commission is
   * actually taken from at each stage of the job.
   */
  const toNum = (v: string | number | null) =>
    v === null || v === '' ? NaN : Number(String(v).replace(',', '.'));
  const typedFinal = toNum(finalPrice);
  const basisPrice = Number.isFinite(typedFinal) ? typedFinal : toNum(job.quoted_price);
  const typedCommission = toNum(commissionAmount);
  const haveBoth =
    Number.isFinite(basisPrice) && basisPrice > 0 && Number.isFinite(typedCommission);
  const commissionTooHigh = haveBoth && typedCommission > basisPrice;
  const monteurGets = haveBoth && !commissionTooHigh ? basisPrice - typedCommission : null;

  async function save() {
    setSaving(true);
    setError('');
    setSaved(false);

    const window = TIME_SLOTS.find((s) => s.start === slot);

    const response = await fetch(`/api/admin/jobs/${job.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        technician_id: technicianId || null,
        scheduled_date: date,
        slot_start: window?.start ?? slot,
        slot_end: window?.end ?? trimTime(job.slot_end),
        final_price: finalPrice.trim() === '' ? null : finalPrice.trim(),

        revenue_callout: revCallout.trim() === '' ? null : revCallout.trim(),
        revenue_materials: revMaterials.trim() === '' ? null : revMaterials.trim(),
        revenue_labor: revLabor.trim() === '' ? null : revLabor.trim(),
        revenue_discount: revDiscount.trim() === '' ? null : revDiscount.trim(),
        cost_materials: costMaterials.trim() === '' ? null : costMaterials.trim(),
        cost_technician: costTech.trim() === '' ? null : costTech.trim(),
        cost_travel: costTravel.trim() === '' ? null : costTravel.trim(),
        cost_payment_fee: costFee.trim() === '' ? null : costFee.trim(),
        cost_other: costOther.trim() === '' ? null : costOther.trim(),

        commission_pct: commissionPct.trim() === '' ? null : commissionPct.trim(),
        commission_amount: commissionAmount.trim() === '' ? null : commissionAmount.trim(),
        notes,
        city: city.trim() || null,
        postcode: postcode.trim() || null,
        car_make: carMake.trim() || null,
        car_model: carModel.trim() || null,
        car_year: carYear.trim() || null,
        keyless: keylessChoice === '' ? null : keylessChoice === 'true',
        scenario: scenarioChoice === '' ? null : scenarioChoice,
      }),
    }).catch(() => null);

    if (!response || !response.ok) {
      const body = await response?.json().catch(() => null);
      setError(body?.error ?? 'Opslaan mislukt.');
      setSaving(false);
      return;
    }

    setSaved(true);
    setSaving(false);
    router.refresh();
  }

  return (
    <div className={styles.planWrap}>
      <div className={styles.panel}>
        <h2>Planning</h2>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="st">Status</label>
            <select
              id="st"
              className={styles.control}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {JOB_STATUSES.map((s) => (
                <option key={s} value={s}>{JOB_STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="mt">Monteur</label>
            <select
              id="mt"
              className={styles.control}
              value={technicianId}
              onChange={(e) => setTechnicianId(e.target.value)}
            >
              <option value="">Niet toegewezen</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="dt">Datum</label>
            <input
              id="dt"
              className={styles.control}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="sl">Tijdvak</label>
            <select
              id="sl"
              className={styles.control}
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
            >
              {TIME_SLOTS.map((s) => (
                <option key={s.start} value={s.start}>{s.start}–{s.end}</option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="fp">
              Werkelijke prijs (€)
            </label>
            <input
              id="fp"
              className={styles.control}
              inputMode="decimal"
              value={finalPrice}
              onChange={(e) => setFinalPrice(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="cpct">
              Commissie (%)
            </label>
            <input
              id="cpct"
              className={styles.control}
              inputMode="decimal"
              placeholder="25"
              value={commissionPct}
              onChange={(e) => setCommissionPct(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="camt">
              Commissie (€)
            </label>
            <input
              id="camt"
              className={styles.control}
              inputMode="decimal"
              placeholder="62.25"
              value={commissionAmount}
              onChange={(e) => setCommissionAmount(e.target.value)}
            />
          </div>

          <div className={styles.fieldWide}>
            <p className={commissionTooHigh ? styles.hintBad : styles.hint}>
              {commissionTooHigh ? (
                <>Commissie is hoger dan de prijs — controleer het bedrag.</>
              ) : monteurGets !== null ? (
                <>
                  Monteur houdt <strong>{MONEY.format(monteurGets)}</strong> over van{' '}
                  {MONEY.format(basisPrice as number)}
                </>
              ) : (
                'Vul een prijs en commissie in om de verdeling te zien.'
              )}
            </p>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="cm">Automerk</label>
            <input
              id="cm"
              className={styles.control}
              placeholder="bijv. Toyota"
              value={carMake}
              onChange={(e) => setCarMake(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="cmo">Model</label>
            <input
              id="cmo"
              className={styles.control}
              placeholder="bijv. Aygo"
              value={carModel}
              onChange={(e) => setCarModel(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="cy">Bouwjaar</label>
            <input
              id="cy"
              className={styles.control}
              inputMode="numeric"
              placeholder="bijv. 2018"
              value={carYear}
              onChange={(e) => setCarYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="ck">Sleuteltype</label>
            <select
              id="ck"
              className={styles.control}
              value={keylessChoice}
              onChange={(e) => setKeylessChoice(e.target.value as '' | 'true' | 'false')}
            >
              <option value="">Onbekend</option>
              <option value="false">Sleutel (contactslot)</option>
              <option value="true">Keyless (start-knop)</option>
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="cscen">Service (Scenario)</label>
            <select
              id="cscen"
              className={styles.control}
              value={scenarioChoice}
              onChange={(e) => setScenarioChoice(e.target.value)}
            >
              <option value="">Overig / Onbekend</option>
              <option value="bijmaken">Sleutel bijmaken</option>
              <option value="alle_sleutels_kwijt">Alle sleutels kwijt</option>
              <option value="reparatie">Sleutel repareren</option>
              <option value="slot">Slot of cilinder</option>
            </select>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="city">Plaats (City)</label>
            <input
              id="city"
              className={styles.control}
              placeholder="bijv. Amsterdam"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="pc">Postcode</label>
            <input
              id="pc"
              className={styles.control}
              placeholder="bijv. 1011 AB"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.field} style={{ marginTop: 12 }}>
          <label className={styles.fieldLabel} htmlFor="nt">Notitie</label>
          <textarea
            id="nt"
            className={styles.control}
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>


        <h2 style={{ marginTop: 24, borderTop: '1px solid #e2e8f0', paddingTop: 24 }}>ERP: Financiën & Kosten (Job Costing)</h2>
        <p style={{ fontSize: 12, color: '#b45309', background: '#fffbeb', padding: 8, borderRadius: 6, marginTop: 8 }}>
          Let op: de velden onder &quot;Omzet&quot; worden nu alleen opgeslagen — ze tellen nog niet mee in de Brutowinst hieronder. Brutowinst gebruikt alleen de Definitieve Prijs.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8 }}>
            <h3 style={{ fontSize: 14, marginTop: 0, marginBottom: 12 }}>Omzet (Revenue)</h3>
            
            <div className={styles.field} style={{ marginBottom: 8 }}>
              <label className={styles.fieldLabel}>Oproep / Voorrijkosten (€)</label>
              <input className={styles.control} type="number" step="0.01" value={revCallout} onChange={e => setRevCallout(e.target.value)} />
            </div>
            <div className={styles.field} style={{ marginBottom: 8 }}>
              <label className={styles.fieldLabel}>Materialen (€)</label>
              <input className={styles.control} type="number" step="0.01" value={revMaterials} onChange={e => setRevMaterials(e.target.value)} />
            </div>
            <div className={styles.field} style={{ marginBottom: 8 }}>
              <label className={styles.fieldLabel}>Arbeid / Programmeren (€)</label>
              <input className={styles.control} type="number" step="0.01" value={revLabor} onChange={e => setRevLabor(e.target.value)} />
            </div>
            <div className={styles.field} style={{ marginBottom: 0 }}>
              <label className={styles.fieldLabel}>Korting (€)</label>
              <input className={styles.control} type="number" step="0.01" value={revDiscount} onChange={e => setRevDiscount(e.target.value)} />
            </div>
          </div>

          <div style={{ background: '#fef2f2', padding: 16, borderRadius: 8 }}>
            <h3 style={{ fontSize: 14, marginTop: 0, marginBottom: 12 }}>Kosten (Costs)</h3>
            
            <div className={styles.field} style={{ marginBottom: 8 }}>
              <label className={styles.fieldLabel}>Kostprijs Materialen (€)</label>
              <input className={styles.control} type="number" step="0.01" value={costMaterials} onChange={e => setCostMaterials(e.target.value)} />
            </div>
            <div className={styles.field} style={{ marginBottom: 8 }}>
              <label className={styles.fieldLabel}>Monteur / Loon (€)</label>
              <input className={styles.control} type="number" step="0.01" value={costTech} onChange={e => setCostTech(e.target.value)} />
            </div>
            <div className={styles.field} style={{ marginBottom: 8 }}>
              <label className={styles.fieldLabel}>Reis / Brandstof (€)</label>
              <input className={styles.control} type="number" step="0.01" value={costTravel} onChange={e => setCostTravel(e.target.value)} />
            </div>
            <div className={styles.field} style={{ marginBottom: 8 }}>
              <label className={styles.fieldLabel}>Transactiekosten (Mollie/Pin) (€)</label>
              <input className={styles.control} type="number" step="0.01" value={costFee} onChange={e => setCostFee(e.target.value)} />
            </div>
            <div className={styles.field} style={{ marginBottom: 0 }}>
              <label className={styles.fieldLabel}>Overige Kosten (€)</label>
              <input className={styles.control} type="number" step="0.01" value={costOther} onChange={e => setCostOther(e.target.value)} />
            </div>
          </div>
        </div>

        {job.gross_margin !== null && (
          <div style={{ background: job.gross_margin > 0 ? '#ecfdf5' : '#fef2f2', border: '1px solid', borderColor: job.gross_margin > 0 ? '#10b981' : '#ef4444', padding: 16, borderRadius: 8, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, color: job.gross_margin > 0 ? '#065f46' : '#991b1b' }}>Gross Margin (Brutowinst)</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: job.gross_margin > 0 ? '#059669' : '#dc2626' }}>
              {job.gross_margin > 0 ? '+' : ''}€{Number(job.gross_margin).toFixed(2)}
            </span>
          </div>
        )}

        <div className={styles.actions}>
          <button className={styles.primary} onClick={save} disabled={saving}>
            {saving ? 'Opslaan…' : 'Opslaan'}
          </button>
          {saved && <span className={styles.note}>Opgeslagen.</span>}
          {error && <div className={styles.error}>{error}</div>}
        </div>

        <p className={styles.note}>
          De werkelijke prijs is niet hetzelfde als de afspraak. In fase 4
          schrijft die het factuurbedrag, en dat bedrag gaat als conversiewaarde
          terug naar de lead.
        </p>
      </div>

      <div className={styles.panel}>
        <h2>Gegevens</h2>
        <div className={styles.summary}>
          <span className={styles.summaryKey}>Adres</span>
          <span className={styles.summaryVal}>
            {[job.street, job.postcode, job.city].filter(Boolean).join(', ') || '—'}
          </span>
          <span className={styles.summaryKey}>Kenteken</span>
          <span className={styles.summaryVal}>{job.kenteken ?? '—'}</span>
          <span className={styles.summaryKey}>Dienst</span>
          <span className={styles.summaryVal}>{job.service_type ?? '—'}</span>
          <span className={styles.summaryKey}>Afgesproken</span>
          <span className={styles.summaryVal}>
            {job.quoted_price === null ? '—' : MONEY.format(Number(job.quoted_price))}
          </span>
          <span className={styles.summaryKey}>Gestart</span>
          <span className={styles.summaryVal}>
            {job.started_at ? job.started_at.slice(0, 16).replace('T', ' ') : '—'}
          </span>
          <span className={styles.summaryKey}>Afgerond</span>
          <span className={styles.summaryVal}>
            {job.completed_at ? job.completed_at.slice(0, 16).replace('T', ' ') : '—'}
          </span>
        </div>

        {job.postcode && (
          <a
            className={styles.secondary}
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
              [job.street, job.postcode, job.city].filter(Boolean).join(' ')
            )}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Navigeer
          </a>
        )}

        <p className={styles.note}>
          Foto&apos;s, handtekening en materiaal komen in fase 3, op het
          monteurscherm — dat is waar ze ontstaan.
        </p>
      </div>
    </div>
  );
}
