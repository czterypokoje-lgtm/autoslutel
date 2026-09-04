'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../klanten/klanten.module.css';
import jobStyles from '../../jobs/jobs.module.css';

export interface EditorProduct {
  slug: string;
  audience: string;
  category: string;
  makes: string[];

  feedTitle: string;
  feedDescription: string;
  feedExcerpt: string;
  feedDirectAnswer: string;
  feedMetaDescription: string;
  feedImage: string | null;
  feedCost: number | null;
  feedPrice: number | null;

  published: boolean | null;
  titleOverride: string;
  descriptionOverride: string;
  excerptOverride: string;
  directAnswerOverride: string;
  metaTitleOverride: string;
  metaDescriptionOverride: string;
  imageOverride: string | null;
  images: string[];
  priceOverride: number | null;
  costOverride: number | null;
  trackStock: boolean;
  stockQuantity: number;
  minQuantity: number;
  featured: boolean;
  internalNote: string;
}

/** Google truncates around here. Not a rule, but the point where it starts to cut. */
const META_TITLE_LIMIT = 60;
const META_DESC_LIMIT = 155;

export default function ProductEditor({ product }: { product: EditorProduct }) {
  const router = useRouter();

  const [title, setTitle] = useState(product.titleOverride);
  const [description, setDescription] = useState(product.descriptionOverride);
  const [excerpt, setExcerpt] = useState(product.excerptOverride);
  const [directAnswer, setDirectAnswer] = useState(product.directAnswerOverride);
  const [metaTitle, setMetaTitle] = useState(product.metaTitleOverride);
  const [metaDescription, setMetaDescription] = useState(product.metaDescriptionOverride);
  const [price, setPrice] = useState(product.priceOverride?.toString() ?? '');
  const [cost, setCost] = useState(product.costOverride?.toString() ?? '');
  const [published, setPublished] = useState(product.published !== false);
  const [track, setTrack] = useState(product.trackStock);
  const [stock, setStock] = useState(String(product.stockQuantity));
  const [min, setMin] = useState(String(product.minQuantity));
  const [featured, setFeatured] = useState(product.featured);
  const [note, setNote] = useState(product.internalNote);

  const [mainImage, setMainImage] = useState(product.imageOverride);
  const [gallery, setGallery] = useState(product.images);

  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const mainInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);

  async function save() {
    setBusy(true);
    setError('');
    setSaved(false);

    const response = await fetch(
      `/api/admin/products/${encodeURIComponent(product.slug)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          published,
          title_override: title,
          description_override: description,
          excerpt_override: excerpt,
          direct_answer_override: directAnswer,
          meta_title_override: metaTitle,
          meta_description_override: metaDescription,
          price_override: price,
          cost_override: cost,
          track_stock: track,
          stock_quantity: stock,
          min_quantity: min,
          featured,
          internal_note: note,
        }),
      }
    ).catch(() => null);

    if (!response || !response.ok) {
      const body = await response?.json().catch(() => null);
      // The status matters: 401 is a session that expired, 404 a stale tab.
      const status = response ? ` (${response.status})` : ' (geen verbinding)';
      setError(`${body?.error ?? 'Opslaan mislukt.'}${status}`);
      setBusy(false);
      return;
    }

    setSaved(true);
    setBusy(false);
    router.refresh();
  }

  async function upload(file: File, main: boolean) {
    setBusy(true);
    setError('');

    const response = await fetch(
      `/api/admin/products/${encodeURIComponent(product.slug)}/image${main ? '?main=1' : ''}`,
      { method: 'POST', headers: { 'Content-Type': file.type }, body: file }
    ).catch(() => null);

    if (!response || !response.ok) {
      const body = await response?.json().catch(() => null);
      setError(body?.error ?? 'Uploaden mislukt.');
      setBusy(false);
      return;
    }

    const body = await response.json();
    if (main) setMainImage(body.url);
    else setGallery((prev) => [...prev, body.url]);
    setBusy(false);
    router.refresh();
  }

  async function removeImage(url: string | null) {
    setBusy(true);
    await fetch(
      `/api/admin/products/${encodeURIComponent(product.slug)}/image${
        url ? `?url=${encodeURIComponent(url)}` : ''
      }`,
      { method: 'DELETE' }
    ).catch(() => null);

    if (url) setGallery((prev) => prev.filter((u) => u !== url));
    else setMainImage(null);
    setBusy(false);
    router.refresh();
  }

  const shownImage = mainImage ?? product.feedImage;
  const shownTitle = title || product.feedTitle;
  const shownMetaTitle = metaTitle || shownTitle;
  const shownMetaDescription = metaDescription || product.feedMetaDescription;

  return (
    <div className={styles.cols}>
      <div>
        {/* ---- Content ---- */}
        <div className={styles.panel}>
          <h2>Teksten</h2>

          <div className={jobStyles.field}>
            <label className={jobStyles.fieldLabel}>Titel</label>
            <input
              className={jobStyles.control}
              value={title}
              placeholder={product.feedTitle}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className={jobStyles.field} style={{ marginTop: 10 }}>
            <label className={jobStyles.fieldLabel}>Korte omschrijving</label>
            <input
              className={jobStyles.control}
              value={excerpt}
              placeholder={product.feedExcerpt}
              onChange={(e) => setExcerpt(e.target.value)}
            />
          </div>

          <div className={jobStyles.field} style={{ marginTop: 10 }}>
            <label className={jobStyles.fieldLabel}>Omschrijving</label>
            <textarea
              className={jobStyles.control}
              rows={7}
              value={description}
              placeholder={product.feedDescription}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className={jobStyles.field} style={{ marginTop: 10 }}>
            <label className={jobStyles.fieldLabel}>
              Direct antwoord (bovenaan de pagina)
            </label>
            <input
              className={jobStyles.control}
              value={directAnswer}
              placeholder={product.feedDirectAnswer}
              onChange={(e) => setDirectAnswer(e.target.value)}
            />
          </div>

          <p className={styles.note}>
            Elk veld dat je leeg laat valt terug op de leveranciersfeed — de
            grijze tekst is wat er dan komt te staan. Leegmaken is dus geen
            wissen, maar terugzetten.
          </p>
        </div>

        {/* ---- SEO ---- */}
        <div className={styles.panel}>
          <h2>Meta tags</h2>

          <div className={jobStyles.field}>
            <label className={jobStyles.fieldLabel}>
              Meta titel · {shownMetaTitle.length}/{META_TITLE_LIMIT}
            </label>
            <input
              className={jobStyles.control}
              value={metaTitle}
              placeholder={shownTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
            />
          </div>

          <div className={jobStyles.field} style={{ marginTop: 10 }}>
            <label className={jobStyles.fieldLabel}>
              Meta omschrijving · {shownMetaDescription.length}/{META_DESC_LIMIT}
            </label>
            <textarea
              className={jobStyles.control}
              rows={3}
              value={metaDescription}
              placeholder={product.feedMetaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
            />
          </div>

          {/* A rough preview. Google rewrites these often enough that it is a
              guide, not a promise. */}
          <div
            style={{
              marginTop: 14,
              padding: 12,
              borderRadius: 8,
              background: 'var(--crm-bg)',
              border: '1px solid var(--crm-rule)',
            }}
          >
            <div style={{ color: 'var(--crm-muted)', fontSize: 12 }}>
              autosleutel24.nl › webshop › product
            </div>
            <div
              style={{
                color: '#1a0dab',
                fontSize: 17,
                lineHeight: 1.3,
                margin: '2px 0',
              }}
            >
              {shownMetaTitle.slice(0, META_TITLE_LIMIT)}
              {shownMetaTitle.length > META_TITLE_LIMIT && '…'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--crm-text)', lineHeight: 1.45 }}>
              {shownMetaDescription.slice(0, META_DESC_LIMIT)}
              {shownMetaDescription.length > META_DESC_LIMIT && '…'}
            </div>
          </div>

          <p className={styles.note}>
            De tellers zijn een richtlijn: Google knipt rond deze lengtes af, en
            herschrijft de omschrijving regelmatig helemaal zelf.
          </p>
        </div>
      </div>

      <div>
        {/* ---- Photos ---- */}
        <div className={styles.panel}>
          <h2>Foto&apos;s</h2>

          {shownImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shownImage}
              alt=""
              style={{
                width: '100%',
                borderRadius: 10,
                border: '1px solid var(--crm-rule)',
                background: '#fff',
                objectFit: 'contain',
                maxHeight: 220,
              }}
            />
          ) : (
            <p className={styles.note}>Geen foto.</p>
          )}

          <div className={jobStyles.actions}>
            <button
              className={jobStyles.secondary}
              disabled={busy}
              onClick={() => mainInput.current?.click()}
            >
              Hoofdfoto vervangen
            </button>
            {mainImage && (
              <button
                className={jobStyles.secondary}
                disabled={busy}
                onClick={() => removeImage(null)}
              >
                Terug naar leveranciersfoto
              </button>
            )}
          </div>

          <input
            ref={mainInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) upload(file, true);
            }}
          />

          {gallery.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
              {gallery.map((url) => (
                <span key={url} style={{ position: 'relative' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt=""
                    style={{
                      width: 72,
                      height: 72,
                      objectFit: 'cover',
                      borderRadius: 8,
                      border: '1px solid var(--crm-rule2)',
                      background: '#fff',
                    }}
                  />
                  <button
                    onClick={() => removeImage(url)}
                    disabled={busy}
                    aria-label="Foto verwijderen"
                    style={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      border: '1px solid var(--crm-rule2)',
                      background: 'var(--crm-panel)',
                      color: 'var(--crm-stop)',
                      cursor: 'pointer',
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className={jobStyles.actions}>
            <button
              className={jobStyles.secondary}
              disabled={busy || gallery.length >= 12}
              onClick={() => galleryInput.current?.click()}
            >
              Extra foto toevoegen
            </button>
          </div>

          <input
            ref={galleryInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) upload(file, false);
            }}
          />

          <p className={styles.note}>
            Een eigen foto van het echte onderdeel verkoopt beter dan de render
            van de leverancier. Verwijderen zet de leveranciersfoto terug; het
            bestand zelf blijft staan, omdat oudere pagina&apos;s er nog naar
            kunnen verwijzen.
          </p>
        </div>

        {/* ---- Price and stock ---- */}
        <div className={styles.panel}>
          <h2>Prijs en voorraad</h2>

          <div className={jobStyles.field}>
            <label className={jobStyles.fieldLabel}>
              Eigen prijs (€) — leeg = marge
            </label>
            <input
              className={jobStyles.control}
              inputMode="decimal"
              value={price}
              placeholder={product.feedPrice !== null ? String(product.feedPrice) : ''}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          <div className={jobStyles.field} style={{ marginTop: 10 }}>
            <label className={jobStyles.fieldLabel}>Eigen inkoopprijs (€)</label>
            <input
              className={jobStyles.control}
              inputMode="decimal"
              value={cost}
              placeholder={product.feedCost !== null ? String(product.feedCost) : ''}
              onChange={(e) => setCost(e.target.value)}
            />
          </div>

          <div className={jobStyles.field} style={{ marginTop: 10 }}>
            <label className={jobStyles.fieldLabel}>Voorraad</label>
            <input
              className={jobStyles.control}
              inputMode="decimal"
              value={stock}
              disabled={!track}
              onChange={(e) => setStock(e.target.value)}
            />
          </div>

          <div className={jobStyles.field} style={{ marginTop: 10 }}>
            <label className={jobStyles.fieldLabel}>Waarschuwen onder</label>
            <input
              className={jobStyles.control}
              inputMode="decimal"
              value={min}
              disabled={!track}
              onChange={(e) => setMin(e.target.value)}
            />
          </div>

          <div className={jobStyles.field} style={{ marginTop: 12, gap: 8 }}>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
              <input type="checkbox" checked={published}
                onChange={(e) => setPublished(e.target.checked)} />
              Zichtbaar in de winkel
            </label>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
              <input type="checkbox" checked={track}
                onChange={(e) => setTrack(e.target.checked)} />
              Voorraad bijhouden
            </label>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
              <input type="checkbox" checked={featured}
                onChange={(e) => setFeatured(e.target.checked)} />
              Uitgelicht
            </label>
          </div>

          <div className={jobStyles.field} style={{ marginTop: 10 }}>
            <label className={jobStyles.fieldLabel}>Interne notitie</label>
            <input className={jobStyles.control} value={note}
              onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>

        <div className={styles.panel}>
          <div className={jobStyles.actions} style={{ marginTop: 0 }}>
            <button className={jobStyles.primary} onClick={save} disabled={busy}>
              {busy ? 'Opslaan…' : 'Opslaan'}
            </button>
            <a
              className={jobStyles.secondary}
              href={`/webshop/product/${product.slug}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Bekijk in winkel
            </a>
            {saved && <span className={styles.note}>Opgeslagen.</span>}
            {error && <div className={jobStyles.error}>{error}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
