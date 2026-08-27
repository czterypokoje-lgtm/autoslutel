'use client';

import React, { useState, useMemo } from 'react';
import styles from './MultiStepLeadForm.module.css';
import { BRANDS_LIST, CAR_MODELS, YEARS_LIST } from '@/data/carModels';

const STEPS = [
  { id: 1, label: 'Auto & Sleutel' },
  { id: 2, label: 'Uw Locatie' },
  { id: 3, label: 'Afspraak' },
  { id: 4, label: 'Gegevens' },
  { id: 5, label: 'Overzicht' },
  { id: 6, label: 'Bevestiging' },
];

export default function MultiStepLeadForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    startType: 'Push Button',
    remoteStart: 'Ja',
  });

  const availableModels = useMemo(() => {
    if (!formData.make) return [];
    return CAR_MODELS[formData.make] || [];
  }, [formData.make]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'make') {
      setFormData(prev => ({ ...prev, make: value, model: '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleNext = () => {
    if (step < STEPS.length) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  // SVG components for exact replica
  const CheckIcon = () => (
    <svg viewBox="0 0 24 24">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );

  const ArrowDownIcon = () => (
    <svg className={styles.selectArrow} viewBox="0 0 20 20">
      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
    </svg>
  );

  return (
    <div className={styles.container}>
      {/* Progress Bar */}
      <div className={styles.progressContainer}>
        {STEPS.map((s) => {
          const isCompleted = step > s.id;
          const isActive = step === s.id;
          
          return (
            <div key={s.id} className={styles.progressStep}>
              <div className={`${styles.stepIcon} ${isCompleted ? styles.completed : ''} ${isActive ? styles.active : ''}`}>
                {isCompleted ? <CheckIcon /> : s.id}
              </div>
              <div className={`${styles.stepLabel} ${isActive ? styles.active : ''}`}>
                {s.label}
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.backButtonContainer}>
        {step === 1 && (
          <button className={styles.backButton}>
            <svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Terug naar Diensten
          </button>
        )}
      </div>

      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Autosleutel Bijmaken</h1>
        <p className={styles.subtitle}>100% Tevredenheidsgarantie!</p>
      </div>

      <div className={styles.divider}></div>

      {/* Section Title */}
      <div className={styles.sectionHeader}>
        <svg className={styles.carIcon} viewBox="0 0 64 64" fill="none">
          <path d="M12 40h40v8H12v-8z" fill="#FBBF24"/>
          <path d="M16 28l4-12h24l4 12H16z" fill="#FBBF24"/>
          <path d="M22 20h20v6H22v-6z" fill="#FFFFFF" opacity="0.5"/>
          <circle cx="20" cy="40" r="4" fill="#4B5563"/>
          <circle cx="44" cy="40" r="4" fill="#4B5563"/>
        </svg>
        <h2 className={styles.sectionTitle}>Auto & Sleutel</h2>
        <p className={styles.sectionSubtitle}>Vul de gegevens in van uw auto en sleutel.</p>
      </div>

      {/* Form Body */}
      <div className={styles.formBody}>
        {step === 1 && (
          <div className={styles.stepContent}>
            
            {/* Make Model Year */}
            <div className={styles.questionGroup}>
              <label className={styles.questionLabel}>Welk type auto heeft u? *</label>
              <div className={styles.inputRow3}>
                <div className={styles.selectWrapper}>
                  <label className={styles.floatingLabel}>Merk *</label>
                  <select name="make" value={formData.make} onChange={handleChange} className={styles.selectInput}>
                    <option value="" disabled>Selecteer Merk</option>
                    {BRANDS_LIST.map(brand => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                  <ArrowDownIcon />
                </div>
                <div className={styles.selectWrapper}>
                  <label className={styles.floatingLabel}>Model *</label>
                  <select name="model" value={formData.model} onChange={handleChange} className={styles.selectInput} disabled={!formData.make}>
                    <option value="" disabled>Selecteer Model</option>
                    {availableModels.map(mod => (
                      <option key={mod} value={mod}>{mod}</option>
                    ))}
                  </select>
                  <ArrowDownIcon />
                </div>
                <div className={styles.selectWrapper}>
                  <label className={styles.floatingLabel}>Bouwjaar *</label>
                  <select name="year" value={formData.year} onChange={handleChange} className={styles.selectInput}>
                    <option value="" disabled>Selecteer Bouwjaar</option>
                    {YEARS_LIST.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  <ArrowDownIcon />
                </div>
              </div>
            </div>

            {/* Start Type (The animated cards) */}
            <div className={styles.questionGroup}>
              <label className={styles.questionLabel}>Hoe start u de auto? *</label>
              <div className={styles.imageRadioGroup}>
                <label className={`${styles.imageRadioLabel} ${formData.startType === 'Push Button' ? styles.selected : ''}`}>
                  <input type="radio" name="startType" value="Push Button" checked={formData.startType === 'Push Button'} onChange={handleChange} className={styles.imageRadioInput} />
                  <div className={styles.radioImageWrapper}>
                    <svg viewBox="0 0 100 100" className={styles.animatedSvg}>
                      <circle cx="50" cy="50" r="45" fill="#374151" />
                      <circle cx="50" cy="50" r="38" fill="#111827" />
                      <circle cx="50" cy="50" r="30" fill="#dc2626" className={styles.pulseButton} />
                      <text x="50" y="48" fill="white" fontSize="10" fontWeight="bold" textAnchor="middle">ENGINE</text>
                      <text x="50" y="58" fill="white" fontSize="12" fontWeight="bold" textAnchor="middle">START</text>
                    </svg>
                  </div>
                  <span className={styles.radioText}>Startknop (Keyless)</span>
                  <div className={styles.checkIconWrapper}>
                    <CheckIcon />
                  </div>
                </label>

                <label className={`${styles.imageRadioLabel} ${formData.startType === 'Turn Key' ? styles.selected : ''}`}>
                  <input type="radio" name="startType" value="Turn Key" checked={formData.startType === 'Turn Key'} onChange={handleChange} className={styles.imageRadioInput} />
                  <div className={styles.radioImageWrapper}>
                    <svg viewBox="0 0 100 100" className={styles.animatedSvg}>
                      {/* Keyhole */}
                      <circle cx="50" cy="50" r="40" fill="#374151" />
                      <circle cx="50" cy="50" r="30" fill="#111827" />
                      <rect x="46" y="40" width="8" height="20" fill="#000" />
                      
                      {/* Animated Key */}
                      <g className={styles.turnKey}>
                        <path d="M45,50 L45,20 L35,20 C30,20 30,10 35,10 L65,10 C70,10 70,20 65,20 L55,20 L55,50 Z" fill="#9ca3af" />
                        <circle cx="50" cy="15" r="3" fill="#111827" />
                      </g>
                    </svg>
                  </div>
                  <span className={styles.radioText}>Draaisleutel</span>
                  <div className={styles.checkIconWrapper}>
                    <CheckIcon />
                  </div>
                </label>
              </div>
            </div>

            {/* Remote Start */}
            <div className={styles.questionGroup}>
              <label className={styles.questionLabel}>Heeft uw auto keyless entry/start? *</label>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  <input type="radio" name="remoteStart" value="Ja" checked={formData.remoteStart === 'Ja'} onChange={handleChange} className={styles.radioInput} />
                  Ja
                </label>
                <label className={styles.radioLabel}>
                  <input type="radio" name="remoteStart" value="Nee" checked={formData.remoteStart === 'Nee'} onChange={handleChange} className={styles.radioInput} />
                  Nee
                </label>
              </div>
            </div>

          </div>
        )}

        <div className={styles.actions}>
          <button type="button" onClick={handleNext} className={styles.nextBtn}>
            Volgende: Uw Locatie
          </button>
        </div>
      </div>
      
      {/* Help Button (Fixed) */}
      <button className={styles.helpBtn}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
        Hulp
      </button>
    </div>
  );
}
