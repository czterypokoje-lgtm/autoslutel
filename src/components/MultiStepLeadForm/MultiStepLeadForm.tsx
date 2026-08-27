'use client';

import React, { useState } from 'react';
import styles from './MultiStepLeadForm.module.css';

const STEPS = [
  { id: 1, label: 'Auto & Sleutel' },
  { id: 2, label: 'Locatie' },
  { id: 3, label: 'Contact Info' },
];

export default function MultiStepLeadForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    color: '',
    startType: '',
    remoteStart: '',
    zipcode: '',
    city: '',
    name: '',
    phone: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    if (step < STEPS.length) setStep(step + 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < STEPS.length) {
      handleNext();
    } else {
      // Final submit - could send to WhatsApp or API
      const message = `Nieuwe aanvraag:\nAuto: ${formData.make} ${formData.model} (${formData.year})\nStart: ${formData.startType}, Remote: ${formData.remoteStart}\nLocatie: ${formData.zipcode} ${formData.city}\nNaam: ${formData.name}\nTelefoon: ${formData.phone}`;
      window.open(`https://wa.me/31622222222?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const isStep1Valid = formData.make && formData.model && formData.year && formData.startType && formData.remoteStart;
  const isStep2Valid = formData.zipcode && formData.city;
  const isStep3Valid = formData.name && formData.phone;

  const canProceed = () => {
    if (step === 1) return isStep1Valid;
    if (step === 2) return isStep2Valid;
    if (step === 3) return isStep3Valid;
    return false;
  };

  return (
    <div className={styles.container}>
      {/* Progress Bar */}
      <div className={styles.progressContainer}>
        {STEPS.map((s) => (
          <div key={s.id} className={styles.progressStep}>
            <div className={`${styles.stepNumber} ${step >= s.id ? styles.active : ''}`}>
              {s.id}
            </div>
            <div className={`${styles.stepLabel} ${step >= s.id ? styles.active : ''}`}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Form Body */}
      <div className={styles.formBody}>
        <div className={styles.header}>
          <h2 className={styles.title}>Nieuwe Autosleutel Aanvragen</h2>
          <p className={styles.subtitle}>100% Tevredenheidsgarantie!</p>
        </div>

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <div className={styles.stepContent}>
              <div className={styles.questionGroup}>
                <label className={styles.questionLabel}>Welk type auto heeft u? *</label>
                <div className={styles.inputRow}>
                  <select name="make" value={formData.make} onChange={handleChange} className={styles.selectInput} required>
                    <option value="">Merk *</option>
                    <option value="Volkswagen">Volkswagen</option>
                    <option value="BMW">BMW</option>
                    <option value="Audi">Audi</option>
                    <option value="Mercedes">Mercedes</option>
                    <option value="Peugeot">Peugeot</option>
                    <option value="Anders">Anders...</option>
                  </select>
                  <select name="model" value={formData.model} onChange={handleChange} className={styles.selectInput} required>
                    <option value="">Model *</option>
                    <option value="Golf">Golf</option>
                    <option value="Polo">Polo</option>
                    <option value="1 Serie">1 Serie</option>
                    <option value="A3">A3</option>
                    <option value="Anders">Anders...</option>
                  </select>
                  <select name="year" value={formData.year} onChange={handleChange} className={styles.selectInput} required>
                    <option value="">Bouwjaar *</option>
                    <option value="2024">2024</option>
                    <option value="2023">2023</option>
                    <option value="2022">2022</option>
                    <option value="Ouder">2021 of ouder</option>
                  </select>
                </div>
              </div>

              <div className={styles.questionGroup}>
                <label className={styles.questionLabel}>Hoe start u de auto? *</label>
                <div className={styles.imageRadioGroup}>
                  <label className={`${styles.imageRadioLabel} ${formData.startType === 'Push Button' ? styles.selected : ''}`}>
                    <input type="radio" name="startType" value="Push Button" checked={formData.startType === 'Push Button'} onChange={handleChange} className={styles.imageRadioInput} required />
                    <span className={styles.radioIcon}>🔘</span>
                    <span className={styles.radioText}>Startknop (Keyless)</span>
                  </label>
                  <label className={`${styles.imageRadioLabel} ${formData.startType === 'Turn Key' ? styles.selected : ''}`}>
                    <input type="radio" name="startType" value="Turn Key" checked={formData.startType === 'Turn Key'} onChange={handleChange} className={styles.imageRadioInput} required />
                    <span className={styles.radioIcon}>🔑</span>
                    <span className={styles.radioText}>Draaisleutel</span>
                  </label>
                </div>
              </div>

              <div className={styles.questionGroup}>
                <label className={styles.questionLabel}>Heeft de auto keyless entry/start? *</label>
                <div className={styles.radioGroup}>
                  <label className={styles.radioLabel}>
                    <input type="radio" name="remoteStart" value="Yes" checked={formData.remoteStart === 'Yes'} onChange={handleChange} className={styles.radioInput} required />
                    Ja
                  </label>
                  <label className={styles.radioLabel}>
                    <input type="radio" name="remoteStart" value="No" checked={formData.remoteStart === 'No'} onChange={handleChange} className={styles.radioInput} required />
                    Nee
                  </label>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className={styles.stepContent}>
              <div className={styles.questionGroup}>
                <label className={styles.questionLabel}>Waar staat de auto? *</label>
                <div className={styles.inputRow} style={{ gridTemplateColumns: '1fr' }}>
                  <input type="text" name="zipcode" value={formData.zipcode} onChange={handleChange} placeholder="Postcode (bijv. 1234 AB)" className={styles.textInput} required />
                  <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="Woonplaats" className={styles.textInput} required />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className={styles.stepContent}>
              <div className={styles.questionGroup}>
                <label className={styles.questionLabel}>Hoe kunnen we u bereiken? *</label>
                <div className={styles.inputRow} style={{ gridTemplateColumns: '1fr' }}>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Uw Naam" className={styles.textInput} required />
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Telefoonnummer" className={styles.textInput} required />
                </div>
              </div>
            </div>
          )}

          <div className={styles.actions}>
            <button 
              type="submit" 
              className={styles.nextBtn}
              disabled={!canProceed()}
            >
              {step === STEPS.length ? 'Aanvraag Versturen' : 'Volgende Stap'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
