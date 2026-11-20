'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toWebp } from '@/lib/toWebp';
import { createListing } from './actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { PreviewText } from '../../PreviewLanguage';

/** Studio restyle of NewListingForm: same photo upload and createListing() call. */
export default function StudioNewListingForm() {
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
    <Card>
      <CardHeader>
        <CardTitle><PreviewText>Nieuwe advertentie</PreviewText></CardTitle>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={submit}>
          <div className="grid gap-1.5">
            <Label htmlFor="title"><PreviewText>Titel</PreviewText></Label>
            <Input id="title" name="title" required placeholder="OBDSTAR X300 DP Plus" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="price"><PreviewText>Prijs (€, optioneel)</PreviewText></Label>
            <Input id="price" name="price" placeholder="150" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="description"><PreviewText>Omschrijving</PreviewText></Label>
            <Textarea id="description" name="description" placeholder="Staat, reden van verkoop, etc." />
          </div>

          {photos.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {photos.map((url) => (
                // eslint-disable-next-line @next/next/no-img-element -- freshly uploaded preview, remote URL
                <img key={url} src={url} alt="" className="size-16 rounded-md border object-cover" />
              ))}
            </div>
          )}

          <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
          <Button type="button" variant="outline" className="w-fit" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            <PreviewText>{uploading ? 'Uploaden…' : 'Foto toevoegen'}</PreviewText>
          </Button>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={busy || uploading}>
              <PreviewText>{busy ? 'Plaatsen…' : 'Plaatsen'}</PreviewText>
            </Button>
            {error && <p className="text-destructive text-sm">{error}</p>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
