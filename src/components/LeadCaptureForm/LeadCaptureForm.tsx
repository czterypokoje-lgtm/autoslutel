"use client";
import { useState, useMemo, useEffect } from "react";
import { CAR_MODELS, BRANDS_LIST, SERVICES_LIST, YEARS_LIST } from "@/data/carModels";
import { SITE_CONFIG } from "@/config/site.config";
import styles from "./LeadCaptureForm.module.css";

interface Props {
  city?: string;
  phone: string;
  theme?: 'dark' | 'light';
  initialBrand?: string;
  initialModel?: string;
}

export default function LeadCaptureForm({ city = "", phone, theme = 'dark', initialBrand = "", initialModel = "" }: Props) {
  const [brand, setBrand] = useState(initialBrand);
  const [model, setModel] = useState(initialModel);
  const [year, setYear] = useState("");
  const [service, setService] = useState("");
  const [location, setLocation] = useState(city);
  const [submitted, setSubmitted] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const models = useMemo(() => {
    if (!brand) return [];
    const key = brand.replace(/ /g, "_");
    return CAR_MODELS[brand] || CAR_MODELS[key] || [];
  }, [brand]);

  const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBrand(e.target.value);
    setModel("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError("");

    try {
      const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        body: file,
      });

      const data = await response.json();
      if (response.ok) {
        setPhotoUrl(data.url);
      } else {
        setUploadError(data.error || "Fout bij uploaden");
      }
    } catch (err) {
      setUploadError("Netwerkfout bij uploaden");
    } finally {
      setIsUploading(false);
    }
  };

  function buildWhatsAppUrl() {
    const parts = [
      "Hallo Autosleutel24!",
      "",
      brand ? `Merk: ${brand}` : null,
      model ? `Model: ${model}` : null,
      year ? `Bouwjaar: ${year}` : null,
      service ? `Service: ${service}` : null,
      `Locatie: ${location || "Niet ingevuld"}`,
      photoUrl ? `Foto bijlage: ${photoUrl.replace("https://omqnxprotjfbyqqq.public.blob.vercel-storage.com", typeof window !== "undefined" ? window.location.origin + "/f" : "")}` : null,
      "",
      "Kunt u mij zo snel mogelijk helpen? Graag hoor ik de prijs en aankomsttijd.",
    ].filter(p => p !== null).join("\n");
    return `https://wa.me/${SITE_CONFIG.phoneTel.replace(/\D/g,"")}?text=${encodeURIComponent(parts)}`;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    
    // Fire and forget the database save
    fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brand,
        model,
        year,
        service,
        location,
        photoUrl
      }),
      keepalive: true
    }).catch(err => console.error("Error saving lead", err));

    setTimeout(() => {
      window.open(buildWhatsAppUrl(), "_blank", "noopener,noreferrer");
      setSubmitted(false);
    }, 200);
  }

  return (
    <div className={`${styles.wrapper} ${theme === 'light' ? styles.light : ''}`}>
      <form className={styles.form} onSubmit={handleSubmit} id="city-lead-form">
        {/* Brand */}
        <div className={styles.field}>
          <span className={styles.fieldIcon} aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 00-.84-.99L16 11l-2.7-3.6a2 2 0 00-1.6-.8H9.3a2 2 0 00-1.6.8L5 11l-5.16.86a1 1 0 00-.84.99V16h3m12 0a2 2 0 100 4 2 2 0 000-4zm-14 0a2 2 0 100 4 2 2 0 000-4z"/></svg>
          </span>
          <select
            className={styles.select}
            value={brand}
            onChange={handleBrandChange}
            aria-label="Automerk"
          >
            <option value="">Merk</option>
            {BRANDS_LIST.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        {/* Model */}
        <div className={styles.field}>
          <span className={styles.fieldIcon} aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
          </span>
          <select
            className={styles.select}
            value={model}
            onChange={e => setModel(e.target.value)}
            aria-label="Model"
            disabled={!brand}
          >
            <option value="">Model</option>
            {models.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Year */}
        <div className={styles.field}>
          <span className={styles.fieldIcon} aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </span>
          <select
            className={styles.select}
            value={year}
            onChange={e => setYear(e.target.value)}
            aria-label="Bouwjaar"
          >
            <option value="">Jaar</option>
            {YEARS_LIST.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Service */}
        <div className={styles.field}>
          <span className={styles.fieldIcon} aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
          </span>
          <select
            className={styles.select}
            value={service}
            onChange={e => setService(e.target.value)}
            aria-label="Dienst"
          >
            <option value="">Service</option>
            {SERVICES_LIST.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Location */}
        <div className={styles.field}>
          <span className={styles.fieldIcon} aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          </span>
          <input
            className={styles.select}
            type="text"
            value={location}
            onChange={e => setLocation(e.target.value)}
            readOnly={!!city}
            placeholder="Uw woonplaats"
            aria-label="Locatie"
          />
        </div>

        {/* Photo Upload */}
        <div className={styles.fileUploadWrapper}>
          <label className={`${styles.fileUploadLabel} ${photoUrl ? styles.success : ''}`}>
            <span className={styles.fieldIcon} aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </span>
            <span className={styles.fileUploadText}>
              {isUploading ? "Uploaden..." : photoUrl ? "Foto geüpload!" : "Voeg sleutelfoto toe"}
            </span>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileUpload} 
              className={styles.fileInput}
              disabled={isUploading}
            />
          </label>
          {uploadError && <div className={styles.errorText}>{uploadError}</div>}
          {photoUrl && (
            <div className={styles.previewContainer}>
              <img src={photoUrl} alt="Preview" className={styles.imagePreview} />
              <button type="button" onClick={() => setPhotoUrl("")} className={styles.removePhotoBtn} aria-label="Verwijder foto">&times;</button>
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          className={styles.submitBtn}
          id="city-lead-submit"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          {submitted ? "Verzenden..." : "Ontvang prijs & aankomsttijd"}
        </button>
      </form>

      <p className={styles.urgency}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
        Noodgeval of spoed? Contacteer ons direct:
      </p>

      <div className={styles.directBtns}>
        <a
          href={`tel:${SITE_CONFIG.phoneTel}`}
          className={styles.callBtn}
          id="city-lead-call"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
          Bel Nu: {phone}
        </a>
        <a
          href={buildWhatsAppUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.waBtn}
          id="city-lead-whatsapp"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          WhatsApp
        </a>
      </div>
    </div>
  );
}
