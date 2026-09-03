'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../klanten/klanten.module.css';
import jobStyles from '../jobs/jobs.module.css';

export interface Template {
  id: string;
  name: string;
  service_type: string;
  price_incl: number | string | null;
  monteur_fee: number | string | null;
  duration_slots: number;
  active: boolean;
}

export interface StockItem {
  id: string;
  technician_id: string | null;
  description: string;
  quantity: number | string;
  min_quantity: number | string;
}

export interface Tech {
  id: string;
  name: string;
}

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

export default function SettingsPanels({
  templates,
  stock,
  technicians,
}: {
  templates: Template[];
  stock: StockItem[];
  technicians: Tech[];
}) {
  const router = useRouter();

  const [tName, setTName] = useState('');
  const [tPrice, setTPrice] = useState('');
  const [tFee, setTFee] = useState('');
  const [tSlots, setTSlots] = useState('1');
  const [tError, setTError] = useState('');

  const [sDesc, setSDesc] = useState('');
  const [sQty, setSQty] = useState('');
  const [sMin, setSMin] = useState('');
  const [sTech, setSTech] = useState('');
  const [sError, setSError] = useState('');

  const [busy, setBusy] = useState(false);

  async function addTemplate(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setTError('');
    const r = await fetch('/api/admin/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: tName,
        price_incl: tPrice,
        monteur_fee: tFee,
        duration_slots: Number(tSlots),
      }),
    }).catch(() => null);
    if (!r || !r.ok) {
      setTError((await r?.json().catch(() => null))?.error ?? 'Opslaan mislukt.');
    } else {
      setTName(''); setTPrice(''); setTFee('');
      router.refresh();
    }
    setBusy(false);
  }

  async function addStock(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setSError('');
    const r = await fetch('/api/admin/stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: sDesc,
        quantity: sQty,
        min_quantity: sMin,
        technician_id: sTech || null,
      }),
    }).catch(() => null);
    if (!r || !r.ok) {
      setSError((await r?.json().catch(() => null))?.error ?? 'Opslaan mislukt.');
    } else {
      setSDesc(''); setSQty(''); setSMin('');
      router.refresh();
    }
    setBusy(false);
  }

  const vanName = (id: string | null) =>
    id === null ? 'Centraal' : technicians.find((t) => t.id === id)?.name ?? 'Onbekend';

  return (
    <div className={styles.cols}>
      <div>
        <div className={styles.panel}>
          <h2>Diensten</h2>
          {templates.length === 0 ? (
            <p className={styles.note}>
              Nog geen sjablonen. Een sjabloon scheelt bij elke klus het opnieuw
              intypen van dezelfde dienst en prijs.
            </p>
          ) : (
            templates.map((t) => (
              <div key={t.id} className={styles.item}>
                <span className={styles.strong}>{t.name}</span>
                <span className={styles.sub}>
                  {t.price_incl !== null ? MONEY.format(Number(t.price_incl)) : 'geen prijs'}
                  {' · '}
                  {t.duration_slots} tijdvak{t.duration_slots > 1 ? 'ken' : ''}
                  {t.monteur_fee !== null &&
                    ` · monteur ${MONEY.format(Number(t.monteur_fee))}`}
                </span>
              </div>
            ))
          )}
        </div>

        <div className={styles.panel}>
          <h2>Voorraad</h2>
          {stock.length === 0 ? (
            <p className={styles.note}>Nog geen voorraadregels.</p>
          ) : (
            stock.map((s) => {
              const low = Number(s.quantity) <= Number(s.min_quantity);
              return (
                <div key={s.id} className={styles.item}>
                  <span className={styles.strong}>{s.description}</span>
                  <span className={styles.sub}>
                    {vanName(s.technician_id)} · {Number(s.quantity)} stuks
                    {low && (
                      <strong style={{ color: 'var(--crm-stop)' }}> · bijbestellen</strong>
                    )}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div>
        <form className={styles.panel} onSubmit={addTemplate}>
          <h2>Dienst toevoegen</h2>
          <div className={jobStyles.field}>
            <label className={jobStyles.fieldLabel} htmlFor="tn">Naam</label>
            <input id="tn" className={jobStyles.control} required value={tName}
              onChange={(e) => setTName(e.target.value)} placeholder="Alle sleutels kwijt" />
          </div>
          <div className={jobStyles.field} style={{ marginTop: 10 }}>
            <label className={jobStyles.fieldLabel} htmlFor="tp">Prijs incl. btw (€)</label>
            <input id="tp" className={jobStyles.control} inputMode="decimal"
              value={tPrice} onChange={(e) => setTPrice(e.target.value)} />
          </div>
          <div className={jobStyles.field} style={{ marginTop: 10 }}>
            <label className={jobStyles.fieldLabel} htmlFor="tf">
              Vergoeding monteur (€)
            </label>
            <input id="tf" className={jobStyles.control} inputMode="decimal"
              value={tFee} onChange={(e) => setTFee(e.target.value)} />
          </div>
          <div className={jobStyles.field} style={{ marginTop: 10 }}>
            <label className={jobStyles.fieldLabel} htmlFor="ts">Tijdvakken</label>
            <select id="ts" className={jobStyles.control} value={tSlots}
              onChange={(e) => setTSlots(e.target.value)}>
              <option value="1">1 (2 uur)</option>
              <option value="2">2 (4 uur)</option>
              <option value="3">3 (6 uur)</option>
            </select>
          </div>
          <div className={jobStyles.actions}>
            <button className={jobStyles.primary} type="submit" disabled={busy}>
              Toevoegen
            </button>
            {tError && <div className={jobStyles.error}>{tError}</div>}
          </div>
          <p className={styles.note}>
            De vergoeding wordt nog niet automatisch geboekt — dat kan pas als de
            verdienregel vaststaat. Nu vastleggen scheelt straks overtypen.
          </p>
        </form>

        <form className={styles.panel} onSubmit={addStock}>
          <h2>Voorraad bijwerken</h2>
          <div className={jobStyles.field}>
            <label className={jobStyles.fieldLabel} htmlFor="sd">Omschrijving</label>
            <input id="sd" className={jobStyles.control} required value={sDesc}
              onChange={(e) => setSDesc(e.target.value)} placeholder="Smart key Mercedes" />
          </div>
          <div className={jobStyles.field} style={{ marginTop: 10 }}>
            <label className={jobStyles.fieldLabel} htmlFor="sv">Bus</label>
            <select id="sv" className={jobStyles.control} value={sTech}
              onChange={(e) => setSTech(e.target.value)}>
              <option value="">Centraal magazijn</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div className={jobStyles.field} style={{ marginTop: 10 }}>
            <label className={jobStyles.fieldLabel} htmlFor="sq">Aantal</label>
            <input id="sq" className={jobStyles.control} inputMode="decimal"
              value={sQty} onChange={(e) => setSQty(e.target.value)} />
          </div>
          <div className={jobStyles.field} style={{ marginTop: 10 }}>
            <label className={jobStyles.fieldLabel} htmlFor="sm">
              Waarschuwen onder
            </label>
            <input id="sm" className={jobStyles.control} inputMode="decimal"
              value={sMin} onChange={(e) => setSMin(e.target.value)} />
          </div>
          <div className={jobStyles.actions}>
            <button className={jobStyles.primary} type="submit" disabled={busy}>
              Opslaan
            </button>
            {sError && <div className={jobStyles.error}>{sError}</div>}
          </div>
          <p className={styles.note}>
            Bestaat de regel al voor deze bus, dan wordt het aantal overschreven —
            dit is een telling, geen bijboeking.
          </p>
        </form>
      </div>
    </div>
  );
}
