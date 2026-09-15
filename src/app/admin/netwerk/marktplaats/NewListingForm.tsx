'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toWebp } from '@/lib/toWebp';
import { createListing } from './actions';
import styles from './marktplaats.module.css';

export default function NewListingForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploading(true);
    setError('');
    try {
      const webp = await toWebp(file).catch(() => file);
      const response = await fetch('/api/admin/netwerk/marktplaats/upload', {
        method: 'POST',
        headers: { 'Content-Type': webp.type },
        body: webp,
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error ?? 'Uploaden mislukt');
      setPhotos((prev) => [...prev, body.url]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Uploaden mislukt');
    } finally {
      setUploading(false);
    }
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    setBusy(true);
    setError('');

    const result = await createListing({
      title: String(form.get('title') ?? ''),
      description: String(form.get('description') ?? ''),
      price: String(form.get('price') ?? ''),
      photos,
    });

    setBusy(false);
    if ('error' in result) {
      setError(result.error);
      return;
    }
    formEl.reset();
    setPhotos([]);
    router.refresh();
  }

  return (
    <div className={styles.panel}>
      <h2>Nieuwe advertentie</h2>
      <form className={styles.form} onSubmit={submit}>
        <div className={styles.field}>
          <label htmlFor="title">Titel</label>
          <input id="title" name="title" required placeholder="OBDSTAR X300 DP Plus" />
        </div>
        <div className={styles.field}>
          <label htmlFor="price">Prijs (€, optioneel)</label>
          <input id="price" name="price" placeholder="150" />
        </div>
        <div className={styles.field}>
          <label htmlFor="description">Omschrijving</label>
          <textarea id="description" name="description" placeholder="Staat, reden van verkoop, etc." />
        </div>

        {photos.length > 0 && (
          <div className={styles.previewRow}>
            {photos.map((url) => (
              <img key={url} src={url} alt="" />
            ))}
          </div>
        )}

        <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
        <button type="button" className={styles.act} onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? 'Uploaden…' : 'Foto toevoegen'}
        </button>

        <button className={styles.submit} type="submit" disabled={busy || uploading}>
          {busy ? 'Plaatsen…' : 'Plaatsen'}
        </button>

        {error && <p className={styles.error}>{error}</p>}
      </form>
    </div>
  );
}
