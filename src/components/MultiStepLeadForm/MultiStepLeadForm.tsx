'use client';

import React, { useState } from 'react';
import styles from './MultiStepLeadForm.module.css';

const STEPS = [
  { id: 1, label: 'Car & Key' },
  { id: 2, label: 'Service Location' },
  { id: 3, label: 'Scheduling' },
  { id: 4, label: 'Contact Info' },
  { id: 5, label: 'Service Summary' },
  { id: 6, label: 'Checkout' },
];

export default function MultiStepLeadForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    make: 'Bmw',
    model: '128i',
    year: '2026',
    color: 'Black',
    startType: 'Push Button',
    remoteStart: 'Yes',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
            Back to Services
          </button>
        )}
      </div>

      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Copy Your Car Key</h1>
        <p className={styles.subtitle}>100% Satisfaction Guaranteed!</p>
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
        <h2 className={styles.sectionTitle}>Car & Key</h2>
        <p className={styles.sectionSubtitle}>Please provide your car and key info.</p>
      </div>

      {/* Form Body */}
      <div className={styles.formBody}>
        {step === 1 && (
          <div className={styles.stepContent}>
            
            {/* Make Model Year */}
            <div className={styles.questionGroup}>
              <label className={styles.questionLabel}>What type of car do you have? *</label>
              <div className={styles.inputRow3}>
                <div className={styles.selectWrapper}>
                  <label className={styles.floatingLabel}>Make *</label>
                  <select name="make" value={formData.make} onChange={handleChange} className={styles.selectInput}>
                    <option value="Bmw">Bmw</option>
                    <option value="Audi">Audi</option>
                  </select>
                  <ArrowDownIcon />
                </div>
                <div className={styles.selectWrapper}>
                  <label className={styles.floatingLabel}>Model *</label>
                  <select name="model" value={formData.model} onChange={handleChange} className={styles.selectInput}>
                    <option value="128i">128i</option>
                    <option value="320i">320i</option>
                  </select>
                  <ArrowDownIcon />
                </div>
                <div className={styles.selectWrapper}>
                  <label className={styles.floatingLabel}>Year *</label>
                  <select name="year" value={formData.year} onChange={handleChange} className={styles.selectInput}>
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                  </select>
                  <ArrowDownIcon />
                </div>
              </div>
            </div>

            {/* Color */}
            <div className={styles.questionGroup}>
              <label className={styles.questionLabel}>What color is your car? *</label>
              <div className={styles.inputRow1}>
                <div className={styles.selectWrapper}>
                  <label className={styles.floatingLabel}>Color *</label>
                  <select name="color" value={formData.color} onChange={handleChange} className={styles.selectInput}>
                    <option value="Black">Black</option>
                    <option value="White">White</option>
                  </select>
                  <ArrowDownIcon />
                </div>
              </div>
            </div>

            {/* Start Type (The animated cards) */}
            <div className={styles.questionGroup}>
              <label className={styles.questionLabel}>How do you start your car? *</label>
              <div className={styles.imageRadioGroup}>
                <label className={`${styles.imageRadioLabel} ${formData.startType === 'Push Button' ? styles.selected : ''}`}>
                  <input type="radio" name="startType" value="Push Button" checked={formData.startType === 'Push Button'} onChange={handleChange} className={styles.imageRadioInput} />
                  <div className={styles.radioImageWrapper}>
                    <img src="https://images.unsplash.com/photo-1542282088-fe8426682b8f?w=100&h=100&fit=crop" alt="Push Button" className={styles.radioImage} />
                  </div>
                  <span className={styles.radioText}>Push Button</span>
                  <div className={styles.checkIconWrapper}>
                    <CheckIcon />
                  </div>
                </label>

                <label className={`${styles.imageRadioLabel} ${formData.startType === 'Turn Key' ? styles.selected : ''}`}>
                  <input type="radio" name="startType" value="Turn Key" checked={formData.startType === 'Turn Key'} onChange={handleChange} className={styles.imageRadioInput} />
                  <div className={styles.radioImageWrapper}>
                    <img src="https://images.unsplash.com/photo-1605270635417-380d3ce3df83?w=100&h=100&fit=crop" alt="Turn Key" className={styles.radioImage} />
                  </div>
                  <span className={styles.radioText}>Turn Key</span>
                  <div className={styles.checkIconWrapper}>
                    <CheckIcon />
                  </div>
                </label>
              </div>
            </div>

            {/* Remote Start */}
            <div className={styles.questionGroup}>
              <label className={styles.questionLabel}>Does your car have remote start? *</label>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  <input type="radio" name="remoteStart" value="Yes" checked={formData.remoteStart === 'Yes'} onChange={handleChange} className={styles.radioInput} />
                  Yes
                </label>
                <label className={styles.radioLabel}>
                  <input type="radio" name="remoteStart" value="No" checked={formData.remoteStart === 'No'} onChange={handleChange} className={styles.radioInput} />
                  No
                </label>
              </div>
            </div>

          </div>
        )}

        <div className={styles.actions}>
          <button type="button" onClick={handleNext} className={styles.nextBtn}>
            Next: Service Location
          </button>
        </div>
      </div>
      
      {/* Help Button (Fixed) */}
      <button className={styles.helpBtn}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
        Help
      </button>
    </div>
  );
}
