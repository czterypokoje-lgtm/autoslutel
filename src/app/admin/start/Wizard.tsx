'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Plus } from 'lucide-react';
import styles from './start.module.css';
import { TIER_TERMS } from '@/lib/subscription';

export default function Wizard({ technicianId }: { technicianId: string }) {
  const router = useRouter();
  
  const [step, setStepRaw] = useState(1);
  const [error, setError] = useState('');
  const setStep = (n: number) => {
    setError('');
    setStepRaw(n);
  };
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

  const STEP_NAMES = ['Contact en regio', 'Gereedschap', 'Automerken', 'Abonnement'];
  const stepper = (
    <ol className={styles.steps} aria-label="Stappen">
      {STEP_NAMES.map((name, i) => {
        const n = i + 1;
        const cls = n < step ? styles.stepDone : n === step ? styles.stepNow : styles.stepTodo;
        return (
          <li key={name} className={cls} aria-current={n === step ? 'step' : undefined}>
            <span className={styles.stepNum}>{n < step ? <Check size={14} strokeWidth={3} /> : n}</span>
            <span className={styles.stepName}>{name}</span>
          </li>
        );
      })}
    </ol>
  );

  const errorLine = error && <p className={styles.error}>{error}</p>;

  if (step === 1) {
    return (
      <>
        {stepper}
        <section className={styles.panel}>
          <h2 className={styles.h2}>Waar werk je, en hoe bereiken we je?</h2>
          <label className={styles.field}>
            <span>Telefoonnummer</span>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="06 12345678" required />
          </label>
          <label className={styles.field}>
            <span>Werkgebied (postcodes)</span>
            <input value={werkgebied} onChange={(e) => setWerkgebied(e.target.value)} placeholder="Bijv. 3500-3599, 1000-1099" required />
            <small>Postcodereeksen waar je naartoe rijdt, gescheiden door een komma.</small>
          </label>
          {errorLine}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.primary}
              onClick={() => (phone && werkgebied ? setStep(2) : setError('Vul beide velden in.'))}
            >
              Volgende
            </button>
          </div>
        </section>
      </>
    );
  }

  if (step === 2) {
    return (
      <>
        {stepper}
        <section className={styles.panel}>
          <h2 className={styles.h2}>Welk gereedschap heb je in de bus?</h2>
          <p className={styles.note}>Programmeertools en sleutelmachines. Je kunt dit later aanpassen bij Mijn vak.</p>
          {tools.map((t, i) => (
            <div key={i} className={styles.pair}>
              <label className={styles.field}>
                <span>Merk</span>
                <input placeholder="Bijv. Autel, Xhorse" value={t.brand} onChange={(e) => handleToolChange(i, 'brand', e.target.value)} />
              </label>
              <label className={styles.field}>
                <span>Model</span>
                <input placeholder="Bijv. IM608" value={t.model} onChange={(e) => handleToolChange(i, 'model', e.target.value)} />
              </label>
            </div>
          ))}
          <button type="button" className={styles.add} onClick={addTool}>
            <Plus size={16} /> Nog een tool
          </button>
          {errorLine}
          <div className={styles.actions}>
            <button type="button" className={styles.secondary} onClick={() => setStep(1)}>Vorige</button>
            <button
              type="button"
              className={styles.primary}
              onClick={() => (tools.some((t) => t.brand) ? setStep(3) : setError('Voeg minstens één tool toe.'))}
            >
              Volgende
            </button>
          </div>
        </section>
      </>
    );
  }

  if (step === 3) {
    return (
      <>
        {stepper}
        <section className={styles.panel}>
          <h2 className={styles.h2}>Voor welke auto&apos;s wil je klussen krijgen?</h2>
          <p className={styles.note}>Kies een merk en vink aan welk werk je daarvoor doet.</p>
          {coverage.map((c, i) => (
            <div key={i} className={styles.makeCard}>
              <label className={styles.field}>
                <span>Automerk</span>
                <select value={c.make} onChange={(e) => handleCoverageMake(i, e.target.value)}>
                  <option value="">Kies een automerk</option>
                  {MAKES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
              {c.make && (
                <div className={styles.checks}>
                  {SCENARIOS.map((sc) => (
                    <label key={sc.id} className={c.scenarios.includes(sc.id) ? styles.checkOn : styles.check}>
                      <input type="checkbox" checked={c.scenarios.includes(sc.id)} onChange={() => toggleCoverageScenario(i, sc.id)} />
                      {sc.label}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
          <button type="button" className={styles.add} onClick={addCoverage}>
            <Plus size={16} /> Nog een automerk
          </button>
          {errorLine}
          <div className={styles.actions}>
            <button type="button" className={styles.secondary} onClick={() => setStep(2)}>Vorige</button>
            <button
              type="button"
              className={styles.primary}
              onClick={() =>
                coverage.some((c) => c.make && c.scenarios.length > 0)
                  ? setStep(4)
                  : setError('Kies minstens één automerk met één soort werk.')
              }
            >
              Volgende
            </button>
          </div>
        </section>
      </>
    );
  }

  /*
   * The rate stays on this screen, unlike the rest of the monteur's views.
   * This is the moment somebody agrees to it — a commission hidden at the
   * point of signing is one they never consented to — and every figure comes
   * from TIER_TERMS rather than being typed in.
   */
  const PLANS = [
    { id: 'starter', extra: 'Basisdekking.' },
    { id: 'pro', extra: 'Meer voorrang bij nieuwe klussen.' },
    { id: 'premium', extra: 'De hoogste voorrang.' },
  ] as const;

  return (
    <>
      {stepper}
      <section className={styles.panel}>
        <h2 className={styles.h2}>Kies je abonnement</h2>
        <p className={styles.note}>De commissie wordt per afgeronde klus ingehouden. Je kunt later wisselen.</p>
        <div className={styles.plans}>
          {PLANS.map((p) => (
            <label key={p.id} className={tier === p.id ? styles.planOn : styles.plan}>
              <input type="radio" name="tier" value={p.id} checked={tier === p.id} onChange={() => setTier(p.id)} />
              <span className={styles.planName}>{TIER_TERMS[p.id].label}</span>
              <span className={styles.planFee}>€ {TIER_TERMS[p.id].monthlyFee} per maand</span>
              <span className={styles.planText}>
                {TIER_TERMS[p.id].commissionPct}% commissie per klus. {p.extra}
              </span>
            </label>
          ))}
        </div>
        {errorLine}
        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={() => setStep(3)} disabled={saving}>Vorige</button>
          <button type="button" className={styles.primary} onClick={submit} disabled={saving}>
            {saving ? 'Opslaan…' : 'Afronden en beginnen'}
          </button>
        </div>
      </section>
    </>
  );
}
