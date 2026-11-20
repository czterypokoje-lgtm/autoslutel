'use client';

import { PreviewText } from '@/app/admin/PreviewLanguage';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Check } from 'lucide-react';
import type { ShopProduct } from './OrderGrid';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

const CATEGORY_LABEL: Record<string, string> = {
  woningsleutels: 'Woningsleutels',
  behuizingen: 'Behuizingen',
  'sleutels-zonder-chip': 'Zonder chip',
  accessoires: 'Accessoires',
  afstandsbedieningen: 'Afstandsbedieningen',
  'frezen-en-tasters': 'Frezen & tasters',
  'universal-remotes': 'Universeel',
  transpondersleutels: 'Transpondersleutels',
  sleutelbaarden: 'Sleutelbaarden',
  batterijen: 'Batterijen',
  sloten: 'Sloten',
  'smart-keys': 'Smart keys',
};

/**
 * Studio restyle of OrderGrid: same search/filter/order() calls and the same
 * router.push query params — only the markup changes, onto shadcn
 * Input/Button/Card.
 */
export default function StudioOrderGrid({
  products,
  total,
  page,
  pages,
  q,
  cat,
  merk,
  categories,
  makes,
  canOrder,
}: {
  products: ShopProduct[];
  total: number;
  page: number;
  pages: number;
  q: string;
  cat: string;
  merk: string;
  categories: [string, number][];
  makes: [string, number][];
  canOrder: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(q);
  const [busy, setBusy] = useState<string | null>(null);
  const [done, setDone] = useState<Record<string, number>>({});
  const [error, setError] = useState('');

  const go = (next: Partial<{ q: string; cat: string; merk: string; p: string }>) => {
    const values = { q: search, cat, merk, p: '1', ...next };
    const params = new URLSearchParams();
    if (values.q) params.set('q', values.q);
    if (values.cat) params.set('cat', values.cat);
    if (values.merk) params.set('merk', values.merk);
    if (values.p && values.p !== '1') params.set('p', values.p);
    router.push(`/admin/bestellen${params.toString() ? `?${params}` : ''}`);
  };

  async function order(product: ShopProduct) {
    setBusy(product.slug);
    setError('');

    const response = await fetch('/api/admin/part-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_slug: product.slug,
        description: product.title,
        article_code: product.articleCode,
        unit_cost: product.costPrice,
        quantity: 1,
      }),
    }).catch(() => null);

    const result = await response?.json().catch(() => null);
    if (!response?.ok) {
      setError(result?.error ?? 'Aanvragen mislukt.');
      setBusy(null);
      return;
    }

    setDone((prev) => ({ ...prev, [product.slug]: (prev[product.slug] ?? 0) + 1 }));
    setBusy(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          go({ q: search });
        }}
        className="flex flex-wrap items-center gap-2"
      >
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Zoek op artikelnummer, merk of model — bijv. 1012AB, Golf, Peugeot 107"
          className="flex-1 basis-64"
        />
        <Button type="submit">
          <Search data-icon="inline-start" /> <PreviewText>Zoek</PreviewText>
        </Button>
        {(q || cat || merk) && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSearch('');
              router.push('/admin/bestellen');
            }}
          >
            <X data-icon="inline-start" /> <PreviewText>Wis</PreviewText>
          </Button>
        )}
      </form>

      <div className="flex flex-wrap gap-2">
        {categories.map(([value, count]) => (
          <Button key={value} size="sm" variant={cat === value ? 'default' : 'outline'} onClick={() => go({ cat: cat === value ? '' : value })}>
            {CATEGORY_LABEL[value] ?? value} <span className="opacity-70">{count}</span>
          </Button>
        ))}
      </div>

      {makes.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {makes.map(([value, count]) => (
            <Button key={value} size="sm" variant={merk === value ? 'default' : 'outline'} onClick={() => go({ merk: merk === value ? '' : value })}>
              {value} <span className="opacity-70">{count}</span>
            </Button>
          ))}
        </div>
      )}

      {error && <p className="text-destructive text-sm">{error}</p>}

      <p className="text-muted-foreground text-sm">
        <PreviewText>{`${total.toLocaleString('nl-NL')} artikel${total === 1 ? '' : 'en'}${pages > 1 ? ` · pagina ${page} van ${pages}` : ''}`}</PreviewText>
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {products.map((product) => (
          <Card key={product.slug} className="flex flex-col overflow-hidden py-0">
            {product.image ? (
              // eslint-disable-next-line @next/next/no-img-element -- catalogue images are remote and already sized
              <img className="aspect-square w-full object-cover" src={product.image} alt={product.title} loading="lazy" />
            ) : (
              <div className="bg-muted text-muted-foreground flex aspect-square w-full items-center justify-center text-xs">
                <PreviewText>geen eigen foto</PreviewText>
              </div>
            )}

            <div className="flex flex-1 flex-col gap-1.5 p-3">
              <div className="line-clamp-2 text-sm font-medium">{product.title}</div>

              {product.articleCode && <div className="text-muted-foreground text-xs">{product.articleCode}</div>}

              <div className="text-muted-foreground flex flex-wrap gap-x-2 text-xs">
                {product.frequency && <span>{product.frequency}</span>}
                {product.chip && <span>{`chip ${product.chip}`}</span>}
                {product.buttons ? <span><PreviewText>{`${product.buttons} knoppen`}</PreviewText></span> : null}
              </div>

              {product.fits.length > 0 ? (
                <div className="text-muted-foreground truncate text-xs" title={product.fits.join('\n')}>
                  {product.fits.slice(0, 3).join(' · ')}
                  {product.fitsMore > 0 ? ` +${product.fitsMore} meer` : ''}
                </div>
              ) : product.makes.length ? (
                <div className="text-muted-foreground truncate text-xs">{product.makes.join(' · ')}</div>
              ) : null}

              <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                <span className="font-semibold">{product.costPrice != null ? MONEY.format(product.costPrice) : '—'}</span>

                {canOrder ? (
                  <Button
                    size="sm"
                    variant={done[product.slug] ? 'outline' : 'default'}
                    onClick={() => order(product)}
                    disabled={busy === product.slug}
                  >
                    {busy === product.slug ? '…' : done[product.slug] ? (
                      <>
                        <Check data-icon="inline-start" /> {`${done[product.slug]}× gevraagd`}
                      </>
                    ) : (
                      <PreviewText>Vraag aan</PreviewText>
                    )}
                  </Button>
                ) : null}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" disabled={page <= 1} onClick={() => go({ p: String(page - 1) })}>
            <PreviewText>← Vorige</PreviewText>
          </Button>
          <span className="text-muted-foreground text-sm">{`${page} / ${pages}`}</span>
          <Button variant="outline" disabled={page >= pages} onClick={() => go({ p: String(page + 1) })}>
            <PreviewText>Volgende →</PreviewText>
          </Button>
        </div>
      )}
    </div>
  );
}
