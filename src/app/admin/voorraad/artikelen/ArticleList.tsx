'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useMemo, useState, useSyncExternalStore, useTransition, type FormEvent } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowDown, ArrowUp, Bookmark, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Printer, ScanLine, Search, Trash2, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ARTICLE_STATUSES, STOCK_STATES, count, euro, type ReportColumn, type ReportRow } from '@/lib/kfcReportColumns';
import { normaliseCode } from '@/lib/stockBulkCount';
import { usePreviewLanguage } from '../../PreviewLanguage';
import { CellValue, ColumnPicker, ExportMenu, alignOf, articleHref } from '../analyse/TableParts';

const StockCamera = dynamic(() => import('../StockCamera'));

export interface ArticleTotals { articles: number; inStock: number; low: number; zero: number; negative: number; incoming: number; value: number | null; unpriced: number }
export interface ArticleQueryProps {
  q: string; category: string; status: string; supplier: string; location: string; state: string; preset: string;
  sort: string; dir: 'asc' | 'desc'; page: number; size: number; cols: string[]; scan: boolean;
}

const VIEWS_KEY = 'kfc-article-views';
const field = 'border-input bg-background h-9 rounded-md border px-2 text-sm';
type SavedView = { name: string; query: string };

function subscribeViews(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(VIEWS_KEY, callback);
  return () => { window.removeEventListener('storage', callback); window.removeEventListener(VIEWS_KEY, callback); };
}
function readViewsRaw() {
  try { return localStorage.getItem(VIEWS_KEY) ?? '[]'; } catch { return '[]'; }
}
function parseViews(raw: string): SavedView[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v?.name === 'string' && typeof v?.query === 'string') : [];
  } catch { return []; }
}
function writeViews(views: SavedView[]) {
  try { localStorage.setItem(VIEWS_KEY, JSON.stringify(views.slice(0, 30))); } catch { /* private mode: views last this page only */ }
  window.dispatchEvent(new Event(VIEWS_KEY));
}

/**
 * The article master list, modelled on ERPNext's Item list: every filter, the
 * sort, page, page size and visible columns are URL parameters (a link is a
 * saved view; named views are kept per browser), the server pages through the
 * kfc_article_overview view so thousands of articles stay fast, rows can be
 * bulk-selected for export, labels or a status / category change, and the
 * search box takes a handheld scanner (types + Enter) or the camera.
 */
export default function ArticleList({ rows, total, columns, query, options, totals, office }: {
  rows: ReportRow[]; total: number; columns: ReportColumn[]; query: ArticleQueryProps; office: boolean; totals: ArticleTotals;
  options: { categories: string[]; warehouses: string[]; suppliers: string[] };
}) {
  const { english } = usePreviewLanguage();
  const L = (nl: string, en: string) => (english ? en : nl);
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const paramsKey = params.toString();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<string[]>([]);
  const viewsRaw = useSyncExternalStore(subscribeViews, readViewsRaw, () => '[]');
  const views = useMemo(() => parseViews(viewsRaw), [viewsRaw]);
  const [camera, setCamera] = useState(false);
  const [scanState, setScanState] = useState<'idle' | 'reading' | 'none'>('idle');
  const [scanChoices, setScanChoices] = useState<string[]>([]);
  const [bulkMessage, setBulkMessage] = useState('');


  const visible = query.cols.length ? query.cols : columns.filter((c) => !c.optional).map((c) => c.key);
  const shown = columns.filter((c) => visible.includes(c.key));
  const pages = Math.max(1, Math.ceil(total / query.size));

  const go = (changes: Record<string, string | null>, resetPage = true) => {
    const next = new URLSearchParams(paramsKey);
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === '') next.delete(key); else next.set(key, value);
    }
    if (resetPage && !('page' in changes)) next.delete('page');
    startTransition(() => router.push(`${pathname}?${next}`, { scroll: false }));
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    go({ q: String(form.get('q') ?? '').trim(), scan: form.get('scan') ? '1' : null });
  };

  async function scanPhoto(file: File) {
    setCamera(false);
    setScanState('reading');
    setScanChoices([]);
    try {
      const { scanPhotos } = await import('../bulkScanPool');
      let found: string[] = [];
      await scanPhotos([file], { onResult: (result) => {
        found = [...new Set(result.codes.map((code) => normaliseCode(code.text)).filter((code) => /^[A-Z0-9][A-Z0-9._ /-]{0,79}$/.test(code)))];
      } });
      if (found.length === 1) { setScanState('idle'); go({ q: found[0], scan: '1' }); }
      else if (found.length > 1) { setScanState('idle'); setScanChoices(found); }
      else setScanState('none');
    } catch { setScanState('none'); }
  }

  const allOnPage = rows.length > 0 && rows.every((r) => selected.includes(String(r.code)));
  const toggleAll = (on: boolean) => setSelected(on ? [...new Set([...selected, ...rows.map((r) => String(r.code))])] : selected.filter((c) => !rows.some((r) => r.code === c)));
  const toggle = (code: string, on: boolean) => setSelected(on ? [...selected, code] : selected.filter((c) => c !== code));

  async function bulk(action: 'status' | 'category', value: string) {
    if (!value || !selected.length) return;
    setBulkMessage(L('Opslaan…', 'Saving…'));
    const response = await fetch('/api/admin/voorraad-analyse', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, codes: selected, value }) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) { setBulkMessage(body.error ?? L('Opslaan mislukt.', 'Saving failed.')); return; }
    setBulkMessage(L(`${body.updated} artikelen bijgewerkt.`, `${body.updated} items updated.`));
    router.refresh();
  }

  const exportQuery = new URLSearchParams(paramsKey);
  for (const key of ['page', 'size', 'scan']) exportQuery.delete(key);
  exportQuery.set('cols', visible.join(','));
  const exportHref = `/api/admin/voorraad-analyse?export=articles&${exportQuery}`;
  const selectionExport = `/api/admin/voorraad-analyse?export=articles&cols=${encodeURIComponent(visible.join(','))}&codes=${encodeURIComponent(selected.join(','))}`;

  const presetChips: { label: string; value: number | null; changes: Record<string, string | null>; active: boolean; tone?: string }[] = [
    { label: L('Alle', 'All'), value: totals.articles, changes: { state: null, preset: null }, active: !query.state && !query.preset },
    { label: L('Op voorraad', 'In stock'), value: totals.inStock, changes: { state: 'op_voorraad', preset: null }, active: query.state === 'op_voorraad' },
    { label: L('Laag', 'Low'), value: totals.low, changes: { state: 'laag', preset: null }, active: query.state === 'laag', tone: 'text-amber-700' },
    { label: L('Nul', 'Zero'), value: totals.zero, changes: { state: 'nul', preset: null }, active: query.state === 'nul' },
    { label: L('Negatief', 'Negative'), value: totals.negative, changes: { state: 'negatief', preset: null }, active: query.state === 'negatief', tone: 'text-red-700' },
    { label: L('Tekort', 'Short'), value: totals.low + totals.zero + totals.negative, changes: { state: 'tekort', preset: null }, active: query.state === 'tekort' },
    { label: L('Onderweg', 'Incoming'), value: totals.incoming, changes: { preset: 'onderweg', state: null }, active: query.preset === 'onderweg' },
    { label: L('Gereserveerd', 'Reserved'), value: null, changes: { preset: 'gereserveerd', state: null }, active: query.preset === 'gereserveerd' },
    { label: L('Geen verkoop 90 d', 'No sales 90 d'), value: null, changes: { preset: 'dood', state: null }, active: query.preset === 'dood' },
    ...(office ? [{ label: L('Zonder kostprijs', 'Without cost'), value: totals.unpriced, changes: { preset: 'zonder_prijs', state: null }, active: query.preset === 'zonder_prijs', tone: totals.unpriced ? 'text-amber-700' : '' }] : []),
  ];

  const saveView = () => {
    const name = window.prompt(L('Naam van deze weergave', 'Name of this view'))?.trim();
    if (!name) return;
    const next = [...views.filter((v) => v.name !== name), { name: name.slice(0, 60), query: paramsKey }];
    writeViews(next);
  };
  const removeView = (name: string) => writeViews(views.filter((v) => v.name !== name));
  const filtered = !!(query.q || query.category || query.status || query.state || query.supplier || query.location || query.preset);

  return (
    <div className={`flex flex-col gap-4 ${pending ? 'opacity-70' : ''}`} aria-busy={pending}>
      <nav className="flex flex-wrap items-center gap-1.5" aria-label={L('Snelfilters', 'Quick filters')}>
        {presetChips.map((chip) => (
          <button key={chip.label} type="button" onClick={() => go(chip.changes)} aria-pressed={chip.active}
            className={`rounded-lg border px-3 py-1.5 text-sm ${chip.active ? 'border-primary bg-primary text-primary-foreground' : `bg-card hover:bg-accent ${chip.tone ?? ''}`}`}>
            {chip.label}{chip.value !== null && <span className="ml-1.5 tabular-nums opacity-80">{count(chip.value, english)}</span>}
          </button>
        ))}
        {office && totals.value !== null && (
          <span className="text-muted-foreground ml-auto text-sm">{L('Voorraadwaarde', 'Stock value')}: <strong className="text-foreground tabular-nums">{euro(totals.value, english)}</strong></span>
        )}
      </nav>

      <Card>
        <CardContent className="flex flex-col gap-3">
          <form onSubmit={submitSearch} className="flex flex-wrap items-center gap-2" role="search">
            <div className="relative min-w-56 flex-1">
              <Search className="text-muted-foreground absolute top-2.5 left-2.5 size-4" aria-hidden="true" />
              <input name="q" defaultValue={query.q} key={query.q} autoComplete="off" enterKeyHint="search" autoFocus
                className={`${field} w-full pl-8`} aria-label={L('Scan of zoek: code, SKU, EAN, naam of leveranciersref.', 'Scan or search: code, SKU, EAN, name or supplier ref')}
                placeholder={L('Scan of zoek: code, SKU, EAN, naam of leveranciersref.', 'Scan or search: code, SKU, EAN, name or supplier ref')} />
            </div>
            <label className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <input type="checkbox" name="scan" value="1" defaultChecked={query.scan} key={String(query.scan)} /> {L('Exacte scan opent het artikel', 'Exact scan opens the item')}
            </label>
            <Button type="submit" size="sm">{L('Zoeken', 'Search')}</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setCamera(true)} disabled={scanState === 'reading'}><ScanLine aria-hidden="true" />{L('Scannen', 'Scan')}</Button>
          </form>
          {camera && <StockCamera onClose={() => setCamera(false)} onPhoto={(file) => void scanPhoto(file)} />}
          {scanState === 'reading' && <p role="status" className="text-sm">{L('Code lezen…', 'Reading code…')}</p>}
          {scanState === 'none' && <p role="alert" className="text-sm text-red-700">{L('Geen bruikbare code gevonden. Probeer een scherpere foto of typ de code.', 'No usable code found. Try a sharper photo or type the code.')}</p>}
          {scanChoices.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-sm">{L('Kies een code', 'Choose a code')}:
              {scanChoices.map((code) => <Button key={code} type="button" size="sm" variant="outline" onClick={() => { setScanChoices([]); go({ q: code, scan: '1' }); }}>{code}</Button>)}
            </div>
          )}

          <div className="flex flex-wrap items-end gap-2">
            <label className="grid gap-1 text-xs font-medium">{L('Categorie', 'Category')}
              <select className={field} value={query.category} onChange={(e) => go({ category: e.target.value })}>
                <option value="">{L('Alle', 'All')}</option>
                {options.categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select></label>
            <label className="grid gap-1 text-xs font-medium">{L('Status', 'Status')}
              <select className={field} value={query.status} onChange={(e) => go({ status: e.target.value })}>
                <option value="">{L('Alle', 'All')}</option>
                {ARTICLE_STATUSES.map((s) => <option key={s.id} value={s.id}>{english ? s.en : s.nl}</option>)}
              </select></label>
            <label className="grid gap-1 text-xs font-medium">{L('Stand', 'Stock state')}
              <select className={field} value={query.state} onChange={(e) => go({ state: e.target.value })}>
                <option value="">{L('Alle', 'All')}</option>
                {STOCK_STATES.map((s) => <option key={s.id} value={s.id}>{english ? s.en : s.nl}</option>)}
                <option value="tekort">{L('Tekort (laag/nul/negatief)', 'Short (low/zero/negative)')}</option>
              </select></label>
            <label className="grid gap-1 text-xs font-medium">{L('Leverancier', 'Supplier')}
              <select className={field} value={query.supplier} onChange={(e) => go({ supplier: e.target.value })}>
                <option value="">{L('Alle', 'All')}</option>
                {options.suppliers.map((s) => <option key={s} value={s}>{s}</option>)}
              </select></label>
            <label className="grid gap-1 text-xs font-medium">{L('Locatie', 'Location')}
              <select className={field} value={query.location} onChange={(e) => go({ location: e.target.value })}>
                <option value="">{L('Alle', 'All')}</option>
                {options.warehouses.map((w) => <option key={w} value={w}>{w}</option>)}
              </select></label>
            {filtered && (
              <Button type="button" variant="ghost" size="sm" onClick={() => go({ q: null, category: null, status: null, state: null, supplier: null, location: null, preset: null, scan: null })}>
                <X aria-hidden="true" />{L('Filters wissen', 'Clear filters')}
              </Button>
            )}
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button type="button" variant="outline" size="sm"><Bookmark aria-hidden="true" />{L('Weergaven', 'Views')}</Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-60">
                  <DropdownMenuLabel>{L('Opgeslagen in deze browser', 'Saved in this browser')}</DropdownMenuLabel>
                  {views.length === 0 && <p className="text-muted-foreground px-2 py-1.5 text-xs">{L('Nog geen weergaven.', 'No views yet.')}</p>}
                  {views.map((v) => (
                    <DropdownMenuItem key={v.name} onSelect={() => startTransition(() => router.push(`${pathname}?${v.query}`))} className="justify-between">
                      <span className="truncate">{v.name}</span>
                      <button type="button" aria-label={L(`Verwijder ${v.name}`, `Delete ${v.name}`)} onClick={(e) => { e.stopPropagation(); e.preventDefault(); removeView(v.name); }}><Trash2 className="size-3.5" /></button>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={saveView}>{L('Huidige weergave opslaan…', 'Save current view…')}</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => { void navigator.clipboard?.writeText(window.location.href); }}>{L('Link naar deze weergave kopiëren', 'Copy link to this view')}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <ColumnPicker columns={columns} visible={visible} onChange={(next) => go({ cols: next.join(',') }, false)} />
              <ExportMenu href={exportHref} label={L('Alles exporteren', 'Export all')} />
            </div>
          </div>

          {selected.length > 0 && (
            <div className="bg-muted/60 flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-sm" role="region" aria-label={L('Bulkacties', 'Bulk actions')}>
              <strong>{L(`${selected.length} geselecteerd`, `${selected.length} selected`)}</strong>
              <ExportMenu href={selectionExport} label={L('Selectie exporteren', 'Export selection')} />
              <Button asChild size="sm" variant="outline">
                <a href={`/admin/voorraad/etiketten?codes=${encodeURIComponent(selected.join(','))}`} target="_blank" rel="noreferrer"><Printer aria-hidden="true" />{L('Etiketten', 'Labels')}</a>
              </Button>
              {office && (
                <>
                  <select className={field} defaultValue="" onChange={(e) => { void bulk('status', e.target.value); e.target.value = ''; }} aria-label={L('Status wijzigen', 'Change status')}>
                    <option value="" disabled>{L('Status wijzigen…', 'Change status…')}</option>
                    {ARTICLE_STATUSES.map((s) => <option key={s.id} value={s.id}>{english ? s.en : s.nl}</option>)}
                  </select>
                  <select className={field} defaultValue="" onChange={(e) => {
                    const value = e.target.value === '__new' ? window.prompt(L('Nieuwe categorie', 'New category'))?.trim() ?? '' : e.target.value;
                    void bulk('category', value); e.target.value = '';
                  }} aria-label={L('Categorie wijzigen', 'Change category')}>
                    <option value="" disabled>{L('Categorie wijzigen…', 'Change category…')}</option>
                    {options.categories.map((c) => <option key={c} value={c}>{c}</option>)}
                    <option value="__new">{L('Nieuwe categorie…', 'New category…')}</option>
                  </select>
                </>
              )}
              <Button type="button" size="sm" variant="ghost" onClick={() => setSelected([])}>{L('Selectie wissen', 'Clear selection')}</Button>
              {bulkMessage && <span role="status" className="text-muted-foreground text-xs">{bulkMessage}</span>}
            </div>
          )}

          <div className="overflow-x-auto">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"><Checkbox checked={allOnPage} onCheckedChange={(on) => toggleAll(!!on)} aria-label={L('Alles op deze pagina selecteren', 'Select all on this page')} /></TableHead>
                  {shown.map((c) => {
                    const sortable = !['ean', 'locations'].includes(c.key);
                    const active = query.sort === c.key;
                    return (
                      <TableHead key={c.key} className={alignOf(c)} aria-sort={active ? (query.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
                        {sortable ? (
                          <button type="button" className="inline-flex items-center gap-1 hover:underline"
                            onClick={() => go({ sort: c.key, dir: active ? (query.dir === 'asc' ? 'desc' : 'asc') : (['int', 'money', 'pct', 'date'].includes(c.type) ? 'desc' : 'asc') })}>
                            {english ? c.en : c.nl}
                            {active && (query.dir === 'asc' ? <ArrowUp className="size-3" aria-hidden="true" /> : <ArrowDown className="size-3" aria-hidden="true" />)}
                          </button>
                        ) : english ? c.en : c.nl}
                      </TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow><TableCell colSpan={shown.length + 1} className="text-muted-foreground py-10 text-center">{L('Geen artikelen in deze selectie.', 'No items in this selection.')}</TableCell></TableRow>
                )}
                {rows.map((row) => {
                  const code = String(row.code);
                  return (
                    <TableRow key={code} data-state={selected.includes(code) ? 'selected' : undefined}>
                      <TableCell><Checkbox checked={selected.includes(code)} onCheckedChange={(on) => toggle(code, !!on)} aria-label={L(`Selecteer ${code}`, `Select ${code}`)} /></TableCell>
                      {shown.map((c) => (
                        <TableCell key={c.key} className={`${alignOf(c)} ${c.key === 'name' ? 'max-w-80 whitespace-normal' : ''}`}>
                          {c.key === 'name' ? (
                            <Link href={articleHref(code)} className="flex items-center gap-2 hover:underline">
                              {/* eslint-disable-next-line @next/next/no-img-element -- stock photo from the CRM's own route */}
                              {typeof row.image === 'string' && <img src={row.image} alt="" loading="lazy" className="size-8 shrink-0 rounded object-cover" />}
                              <span>{String(row.name ?? '')}</span>
                            </Link>
                          ) : <CellValue column={c} value={row[c.key]} english={english} />}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <nav className="flex flex-wrap items-center justify-between gap-2" aria-label={L('Pagina’s', 'Pages')}>
            <span className="text-muted-foreground text-sm">
              {total ? `${count((query.page - 1) * query.size + 1, english)}–${count(Math.min(query.page * query.size, total), english)} ${L('van', 'of')} ${count(total, english)}` : '0'}
            </span>
            <div className="flex items-center gap-1.5">
              <select className={field} value={query.size} onChange={(e) => go({ size: e.target.value })} aria-label={L('Regels per pagina', 'Rows per page')}>
                {[50, 100, 250, 500].map((n) => <option key={n} value={n}>{n} / {L('pagina', 'page')}</option>)}
              </select>
              <Button type="button" variant="outline" size="icon-sm" disabled={query.page <= 1} onClick={() => go({ page: '1' }, false)} aria-label={L('Eerste pagina', 'First page')}><ChevronsLeft /></Button>
              <Button type="button" variant="outline" size="icon-sm" disabled={query.page <= 1} onClick={() => go({ page: String(query.page - 1) }, false)} aria-label={L('Vorige pagina', 'Previous page')}><ChevronLeft /></Button>
              <span className="px-1 text-sm tabular-nums">{query.page} / {pages}</span>
              <Button type="button" variant="outline" size="icon-sm" disabled={query.page >= pages} onClick={() => go({ page: String(query.page + 1) }, false)} aria-label={L('Volgende pagina', 'Next page')}><ChevronRight /></Button>
              <Button type="button" variant="outline" size="icon-sm" disabled={query.page >= pages} onClick={() => go({ page: String(pages) }, false)} aria-label={L('Laatste pagina', 'Last page')}><ChevronsRight /></Button>
            </div>
          </nav>
        </CardContent>
      </Card>
    </div>
  );
}
