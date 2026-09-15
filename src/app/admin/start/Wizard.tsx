'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../jobs/jobs.module.css';

export default function Wizard({ technicianId }: { technicianId: string }) {
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Step 1
  const [phone, setPhone] = useState('');
  const [werkgebied, setWerkgebied] = useState('');

  // Step 2
  const [tools, setTools] = useState<{brand: string, model: string}[]>([{ brand: '', model: '' }]);

  // Step 3
  const [coverage, setCoverage] = useState<{make: string, scenarios: string[]}[]>([{ make: '', scenarios: [] }]);

  // Step 4
  const [tier, setTier] = useState('starter');

  const MAKES = ['Volkswagen', 'Ford', 'Peugeot', 'Renault', 'Toyota', 'BMW', 'Mercedes-Benz', 'Audi', 'Opel', 'Kia', 'Skoda', 'Volvo'];
  const SCENARIOS = [
    { id: 'bijmaken', label: 'Sleutel bijmaken' },
    { id: 'alle_sleutels_kwijt', label: 'Alle sleutels kwijt' },
    { id: 'reparatie', label: 'Reparatie (behuizing/blad)' },
    { id: 'slot', label: 'Slot repareren/vervangen' },
  ];

  async function submit() {
    setSaving(true);
    setError('');

    const response = await fetch('/api/admin/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone,
        werkgebied,
        tools: tools.filter(t => t.brand),
        coverage: coverage.filter(c => c.make && c.scenarios.length > 0),
        tier,
      }),
    }).catch(() => null);

    if (!response || !response.ok) {
      const body = await response?.json().catch(() => null);
      setError(body?.error ?? 'Opslaan mislukt.');
      setSaving(false);
      return;
    }

    router.refresh(); // Will trigger redirect in page.tsx
  }

  function handleToolChange(index: number, field: 'brand'|'model', value: string) {
    const newTools = [...tools];
    newTools[index][field] = value;
    setTools(newTools);
  }

  function addTool() {
    setTools([...tools, { brand: '', model: '' }]);
  }

  function handleCoverageMake(index: number, make: string) {
    const newCov = [...coverage];
    newCov[index].make = make;
    setCoverage(newCov);
  }

  function toggleCoverageScenario(index: number, scenarioId: string) {
    const newCov = [...coverage];
    const scens = newCov[index].scenarios;
    if (scens.includes(scenarioId)) {
      newCov[index].scenarios = scens.filter(s => s !== scenarioId);
    } else {
      newCov[index].scenarios.push(scenarioId);
    }
    setCoverage(newCov);
  }

  function addCoverage() {
    setCoverage([...coverage, { make: '', scenarios: [] }]);
  }

  if (step === 1) {
    return (
      <div className={styles.panel}>
        <h2>Stap 1: Contact en regio</h2>
        <div className={styles.field} style={{ marginTop: 10 }}>
          <label className={styles.fieldLabel}>Telefoonnummer</label>
          <input
            type="tel"
            className={styles.control}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="06 12345678"
            required
          />
        </div>
        <div className={styles.field} style={{ marginTop: 10 }}>
          <label className={styles.fieldLabel}>Werkgebied (postcodereeksen)</label>
          <input
            className={styles.control}
            value={werkgebied}
            onChange={(e) => setWerkgebied(e.target.value)}
            placeholder="Bijv: 3500-3599, 1000-1099"
            required
          />
        </div>
        <div className={styles.actions}>
          <button className={styles.primary} onClick={() => { if (phone && werkgebied) setStep(2); else setError('Vul alle velden in'); }}>
            Volgende
          </button>
          {error && <span className={styles.error}>{error}</span>}
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className={styles.panel}>
        <h2>Stap 2: Tools in de bus</h2>
        <p className={styles.note}>Welke programmeertools of sleutelmachines heb je?</p>
        
        {tools.map((t, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <div className={styles.field} style={{ flex: 1 }}>
              <input
                className={styles.control}
                placeholder="Merk (bijv. Autel, Xhorse)"
                value={t.brand}
                onChange={(e) => handleToolChange(i, 'brand', e.target.value)}
              />
            </div>
            <div className={styles.field} style={{ flex: 1 }}>
              <input
                className={styles.control}
                placeholder="Model (bijv. IM608)"
                value={t.model}
                onChange={(e) => handleToolChange(i, 'model', e.target.value)}
              />
            </div>
          </div>
        ))}
        
        <button type="button" className={styles.secondary} style={{ marginTop: 10 }} onClick={addTool}>
          + Tool toevoegen
        </button>

        <div className={styles.actions} style={{ marginTop: 20 }}>
          <button className={styles.secondary} onClick={() => setStep(1)}>Vorige</button>
          <button className={styles.primary} onClick={() => { if (tools.some(t => t.brand)) setStep(3); else setError('Voeg minstens één tool toe'); }}>
            Volgende
          </button>
          {error && <span className={styles.error}>{error}</span>}
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className={styles.panel}>
        <h2>Stap 3: Dekking per automerk</h2>
        <p className={styles.note}>Geef aan voor welke automerken je klussen wilt ontvangen, en welk type werk je doet.</p>

        {coverage.map((c, i) => (
          <div key={i} style={{ marginTop: 15, padding: 15, border: '1px solid var(--crm-rule2)', borderRadius: 8 }}>
            <div className={styles.field}>
              <select className={styles.control} value={c.make} onChange={(e) => handleCoverageMake(i, e.target.value)}>
                <option value="">-- Kies een automerk --</option>
                {MAKES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            {c.make && (
              <div style={{ marginTop: 10 }}>
                {SCENARIOS.map(s => (
                  <label key={s.id} style={{ display: 'block', marginTop: 5, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={c.scenarios.includes(s.id)}
                      onChange={() => toggleCoverageScenario(i, s.id)}
                      style={{ marginRight: 8 }}
                    />
                    {s.label}
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}

        <button type="button" className={styles.secondary} style={{ marginTop: 10 }} onClick={addCoverage}>
          + Automerk toevoegen
        </button>

        <div className={styles.actions} style={{ marginTop: 20 }}>
          <button className={styles.secondary} onClick={() => setStep(2)}>Vorige</button>
          <button className={styles.primary} onClick={() => { if (coverage.some(c => c.make && c.scenarios.length > 0)) setStep(4); else setError('Voeg minstens één automerk en scenario toe'); }}>
            Volgende
          </button>
          {error && <span className={styles.error}>{error}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <h2>Stap 4: Abonnement</h2>
      <p className={styles.note}>Kies je niveau. De commissie wordt per voltooide klus ingehouden.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 15, marginTop: 15 }}>
        <label style={{ display: 'flex', gap: 15, padding: 15, border: `2px solid ${tier === 'starter' ? 'var(--crm-ink)' : 'var(--crm-rule2)'}`, borderRadius: 8, cursor: 'pointer' }}>
          <input type="radio" name="tier" value="starter" checked={tier === 'starter'} onChange={() => setTier('starter')} />
          <div>
            <strong>Starter</strong> (€0 / mnd)
            <div className={styles.suggestionWhy}>25% commissie per klus. Basisdekking.</div>
          </div>
        </label>
        
        <label style={{ display: 'flex', gap: 15, padding: 15, border: `2px solid ${tier === 'pro' ? 'var(--crm-ink)' : 'var(--crm-rule2)'}`, borderRadius: 8, cursor: 'pointer' }}>
          <input type="radio" name="tier" value="pro" checked={tier === 'pro'} onChange={() => setTier('pro')} />
          <div>
            <strong>Pro</strong> (€399 / mnd)
            <div className={styles.suggestionWhy}>18% commissie per klus. Meer voorrang bij nieuwe klussen.</div>
          </div>
        </label>
        
        <label style={{ display: 'flex', gap: 15, padding: 15, border: `2px solid ${tier === 'premium' ? 'var(--crm-ink)' : 'var(--crm-rule2)'}`, borderRadius: 8, cursor: 'pointer' }}>
          <input type="radio" name="tier" value="premium" checked={tier === 'premium'} onChange={() => setTier('premium')} />
          <div>
            <strong>Premium</strong> (€1.200 / mnd)
            <div className={styles.suggestionWhy}>8% commissie per klus. De hoogste prioriteit.</div>
          </div>
        </label>
      </div>

      <div className={styles.actions} style={{ marginTop: 20 }}>
        <button className={styles.secondary} onClick={() => setStep(3)} disabled={saving}>Vorige</button>
        <button className={styles.primary} onClick={submit} disabled={saving}>
          {saving ? 'Opslaan...' : 'Afronden'}
        </button>
        {error && <span className={styles.error}>{error}</span>}
      </div>
    </div>
  );
}
