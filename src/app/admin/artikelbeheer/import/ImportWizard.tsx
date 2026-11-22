'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, FileUp, Play } from 'lucide-react';
import { PreviewText, usePreviewLanguage } from '@/app/admin/PreviewLanguage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ImportPlan, ImportResult, ImportRun, PlanRow } from '@/lib/kfcProductMaster';

const SELECT = 'border-input bg-background h-9 w-full rounded-md border px-2 text-sm';
const PAGE = 100;
const ACTION_LABELS: Record<PlanRow['action'], string> = { create: 'Nieuw', update: 'Wijzigen', unchanged: 'Ongewijzigd', skip: 'Overgeslagen' };
const ACTION_VARIANT: Record<PlanRow['action'], 'default' | 'secondary' | 'outline' | 'destructive'> = { create: 'default', update: 'secondary', unchanged: 'outline', skip: 'destructive' };
const FIELD_LABELS: Record<string, string> = {
  name: 'Naam', sku: 'SKU', ean: 'Barcodes', category_id: 'Categorie', status: 'Status', sale_price_cents: 'Verkoopprijs',
  purchase_price_cents: 'Inkoopprijs', min_stock: 'Min. voorraad', supplier_ref: 'Leveranciersref.', brand: 'Merk',
  key_type: 'Sleuteltype', frequency: 'Frequentie', chip: 'Chip', buttons: 'Knoppen', blade: 'Baard', fitments: 'Voertuigen',
};
const dateTime = (iso: string | null) => (iso ? new Date(iso).toLocaleString('nl-NL', { dateStyle: 'short', timeStyle: 'short' }) : '—');

export default function ImportWizard({ runs, categories }: { runs: ImportRun[]; categories: { id: string; path: string }[] }) {
  const { t } = usePreviewLanguage();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [match, setMatch] = useState<'sku' | 'ean'>('sku');
  const [plan, setPlan] = useState<ImportPlan | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<PlanRow['action'] | 'all'>('all');
  const [page, setPage] = useState(0);
  const [exportCategory, setExportCategory] = useState('');
  const [exportStatus, setExportStatus] = useState('');

  async function send(mode: 'plan' | 'apply') {
    if (!file) return;
    setBusy(true); setError('');
    if (mode === 'plan') { setPlan(null); setResult(null); }
    const body = new FormData();
    body.set('file', file); body.set('match', match); body.set('mode', mode);
    if (mode === 'apply' && plan) body.set('checksum', plan.checksum);
    try {
      const response = await fetch('/api/admin/artikelbeheer/import', { method: 'POST', body });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) { setError(json.error ?? t('Er ging iets mis.')); return; }
      if (mode === 'plan') { setPlan(json.plan); setTab('all'); setPage(0); }
      else { setResult(json.result); router.refresh(); }
    } catch {
      setError(t('Geen verbinding. Probeer het opnieuw.'));
    } finally {
      setBusy(false);
    }
  }

  const rows = useMemo(() => (plan ? (tab === 'all' ? plan.rows : plan.rows.filter((r) => r.action === tab)) : []), [plan, tab]);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const shown = rows.slice(page * PAGE, page * PAGE + PAGE);
  const writes = plan ? plan.counts.create + plan.counts.update : 0;
  const exportQuery = (format: 'csv' | 'xlsx') => {
    const q = new URLSearchParams({ format });
    if (exportCategory) q.set('category', exportCategory);
    if (exportStatus) q.set('status', exportStatus);
    return `/api/admin/artikelbeheer/export?${q}`;
  };

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle><PreviewText>1. Bestand kiezen</PreviewText></CardTitle>
          <CardDescription>
            <PreviewText>Kolommen worden op naam herkend (Nederlands of Engels): code, sku, ean, naam, categorie (A &gt; B), status, verkoopprijs, inkoopprijs, min_voorraad, leveranciersref, merk, sleuteltype, frequentie, chip, knoppen, baard, voertuigen (Merk|Model|Van|Tot; …). Een lege cel laat het veld zoals het is; barcodes worden toegevoegd, nooit weggehaald.</PreviewText>
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[2fr_1fr_auto] md:items-end">
          <div className="grid gap-1.5">
            <Label htmlFor="import-file"><PreviewText>CSV of XLSX (max 5 MB)</PreviewText></Label>
            <Input id="import-file" type="file" accept=".csv,.txt,.xlsx" onChange={(e) => { setFile(e.target.files?.[0] ?? null); setPlan(null); setResult(null); setError(''); }} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="import-match"><PreviewText>Artikelen herkennen op</PreviewText></Label>
            <select id="import-match" className={SELECT} value={match} onChange={(e) => { setMatch(e.target.value as 'sku' | 'ean'); setPlan(null); setResult(null); }}>
              <option value="sku">{t('SKU (of code)')}</option>
              <option value="ean">{t('EAN/barcode (of code)')}</option>
            </select>
          </div>
          <Button disabled={!file || busy} onClick={() => send('plan')}><FileUp /> <PreviewText>Proefrun</PreviewText></Button>
          <p className="text-muted-foreground text-xs md:col-span-3">
            <a className="underline" href="/api/admin/artikelbeheer/export?format=csv&template=1"><PreviewText>Voorbeeldbestand (CSV)</PreviewText></a>
            {' · '}
            <a className="underline" href="/api/admin/artikelbeheer/export?format=xlsx&template=1"><PreviewText>Voorbeeldbestand (Excel)</PreviewText></a>
            {' · '}<PreviewText>Een export van deze pagina kan na bewerken direct weer worden geïmporteerd.</PreviewText>
          </p>
          {error && <p role="alert" className="text-destructive text-sm md:col-span-3">{error}</p>}
        </CardContent>
      </Card>

      {plan && (
        <Card>
          <CardHeader>
            <CardTitle><PreviewText>2. Proefrun: wat er zou veranderen</PreviewText></CardTitle>
            <CardDescription>{plan.fileName} · {plan.rows.length} {t('regels')} · {t('herkend op')} {plan.matchBy === 'sku' ? 'SKU' : 'EAN'}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {plan.alreadyApplied && (
              <p className="rounded-md border border-amber-300 bg-amber-50 p-2 text-sm text-amber-900">
                {t('Dit bestand is al toegepast op')} {dateTime(plan.alreadyApplied.at)} ({t('run')} {plan.alreadyApplied.run}). {t('Nogmaals toepassen verandert niets.')}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {(['all', 'create', 'update', 'unchanged', 'skip'] as const).map((key) => (
                <Button key={key} size="sm" variant={tab === key ? 'default' : 'outline'} onClick={() => { setTab(key); setPage(0); }}>
                  {key === 'all' ? t('Alle') : t(ACTION_LABELS[key])} ({key === 'all' ? plan.rows.length : plan.counts[key]})
                </Button>
              ))}
            </div>
            <p className="text-muted-foreground text-xs">
              {t('Herkende kolommen')}: {plan.columns.join(', ') || '—'}
              {plan.ignored.length > 0 && <> · {t('Genegeerd')}: {plan.ignored.join(', ')}</>}
            </p>
            {plan.newCategories.length > 0 && (
              <p className="text-sm">{t('Nieuwe categorieën die worden aangemaakt')}: {plan.newCategories.slice(0, 20).join(' · ')}{plan.newCategories.length > 20 ? ` … (+${plan.newCategories.length - 20})` : ''}</p>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16"><PreviewText>Regel</PreviewText></TableHead>
                  <TableHead className="w-28"><PreviewText>Actie</PreviewText></TableHead>
                  <TableHead><PreviewText>Artikel</PreviewText></TableHead>
                  <TableHead><PreviewText>Wijzigingen</PreviewText></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shown.map((row) => (
                  <TableRow key={row.line}>
                    <TableCell className="tabular-nums">{row.line}</TableCell>
                    <TableCell><Badge variant={ACTION_VARIANT[row.action]}>{t(ACTION_LABELS[row.action])}</Badge></TableCell>
                    <TableCell className="max-w-72"><span className="font-mono text-xs">{row.code ?? ''}</span> {row.name}</TableCell>
                    <TableCell className="text-sm whitespace-normal">
                      {row.reason && <p className="text-destructive">{row.reason}</p>}
                      {row.changes.map((c, i) => (
                        <p key={i}><span className="text-muted-foreground">{t(FIELD_LABELS[c.field] ?? c.field)}:</span> {c.from} → <strong>{c.to}</strong></p>
                      ))}
                      {row.warnings.map((w, i) => <p key={`w${i}`} className="text-amber-700">{w}</p>)}
                    </TableCell>
                  </TableRow>
                ))}
                {shown.length === 0 && <TableRow><TableCell colSpan={4} className="text-muted-foreground py-6 text-center"><PreviewText>Geen regels.</PreviewText></TableCell></TableRow>}
              </TableBody>
            </Table>
            {pages > 1 && (
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}><PreviewText>Vorige</PreviewText></Button>
                <span className="text-sm">{page + 1} / {pages}</span>
                <Button size="sm" variant="outline" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}><PreviewText>Volgende</PreviewText></Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {plan && (
        <Card>
          <CardHeader>
            <CardTitle><PreviewText>3. Toepassen</PreviewText></CardTitle>
            <CardDescription>
              {plan.counts.create} {t('nieuw')} · {plan.counts.update} {t('wijzigen')} · {plan.counts.skip} {t('overgeslagen')}.{' '}
              {t('Alles in één keer: als iemand intussen een van deze artikelen wijzigt, wordt niets geschreven en doe je een nieuwe proefrun.')}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div><Button disabled={busy || writes === 0 || !!result} onClick={() => send('apply')}><Play /> {t('Toepassen')} ({writes})</Button></div>
            {result && (
              <p role="status" className="text-sm text-emerald-700">
                {result.replay ? t('Dit bestand was al toegepast; er is niets veranderd.') : t('Klaar.')}{' '}
                {result.summary && `${result.summary.created} ${t('aangemaakt')}, ${result.summary.updated} ${t('bijgewerkt')}, ${result.skipped} ${t('overgeslagen')}.`}{' '}
                ({t('run')} {result.run})
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle><PreviewText>Exporteren</PreviewText></CardTitle>
          <CardDescription><PreviewText>Alle artikelen met prijzen, categoriepad, barcodes, kenmerken en voertuigen. Dezelfde kolommen als de import.</PreviewText></CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[2fr_1fr_auto_auto] md:items-end">
          <div className="grid gap-1.5">
            <Label htmlFor="export-cat"><PreviewText>Categorie (met subcategorieën)</PreviewText></Label>
            <select id="export-cat" className={SELECT} value={exportCategory} onChange={(e) => setExportCategory(e.target.value)}>
              <option value="">{t('Alle categorieën')}</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.path}</option>)}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="export-status"><PreviewText>Status</PreviewText></Label>
            <select id="export-status" className={SELECT} value={exportStatus} onChange={(e) => setExportStatus(e.target.value)}>
              <option value="">{t('Alle statussen')}</option>
              <option value="held">{t('Voorraad')}</option>
              <option value="on_demand">{t('Op bestelling')}</option>
              <option value="discontinued">{t('Uitlopend')}</option>
            </select>
          </div>
          <Button asChild variant="outline"><a href={exportQuery('csv')}><Download /> CSV</a></Button>
          <Button asChild variant="outline"><a href={exportQuery('xlsx')}><Download /> Excel</a></Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle><PreviewText>Laatste imports</PreviewText></CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><PreviewText>Run</PreviewText></TableHead>
                <TableHead><PreviewText>Bestand</PreviewText></TableHead>
                <TableHead><PreviewText>Klaar</PreviewText></TableHead>
                <TableHead><PreviewText>Resultaat</PreviewText></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((run) => (
                <TableRow key={run.id}>
                  <TableCell className="tabular-nums">{run.id}</TableCell>
                  <TableCell>{run.file_name ?? '—'}</TableCell>
                  <TableCell>{dateTime(run.finished_at)}</TableCell>
                  <TableCell className="text-sm">
                    {run.error ? <span className="text-destructive">{t('Mislukt')}: {run.error}</span>
                      : run.summary ? `${run.summary.created ?? 0} ${t('aangemaakt')}, ${run.summary.updated ?? 0} ${t('bijgewerkt')}` : '—'}
                  </TableCell>
                </TableRow>
              ))}
              {runs.length === 0 && <TableRow><TableCell colSpan={4} className="text-muted-foreground py-6 text-center"><PreviewText>Nog geen imports.</PreviewText></TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
