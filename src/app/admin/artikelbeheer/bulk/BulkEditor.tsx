'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { PreviewText, usePreviewLanguage } from '@/app/admin/PreviewLanguage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Issue, MasterArticle } from '@/lib/kfcProductMaster';
import { saveArticlesAction } from '../actions';

type CategoryOption = { id: string; path: string; margin: number | null; vat: number; parent: string | null };
type Field = 'name' | 'sku' | 'ean' | 'category_id' | 'status' | 'sale' | 'purchase' | 'min_stock';
type Draft = Partial<Record<Field, string>>;

const PAGE = 50;
const SELECT = 'border-input bg-background h-8 w-full rounded-md border px-1.5 text-sm';
const STATUS_LABELS: Record<string, string> = { held: 'Voorraad', on_demand: 'Op bestelling', discontinued: 'Uitlopend' };
const ISSUE_LABELS: Record<Issue, string> = {
  no_barcode: 'Zonder barcode', duplicate_barcode: 'Dubbele barcode', invalid_barcode: 'Ongeldige barcode', no_category: 'Zonder categorie',
  no_price: 'Zonder verkoopprijs', no_purchase_price: 'Zonder inkoopprijs', negative_stock: 'Negatieve voorraad',
};

const euro = (cents: number | null) => (cents === null ? '' : (cents / 100).toFixed(2).replace('.', ','));
/** "12,50" / "12.5" / "" → cents | null (empty) | NaN (invalid). */
function cents(text: string): number | null {
  const s = text.trim().replace(/[€\s]/g, '');
  if (!s) return null;
  const normal = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s;
  return /^\d+(\.\d{1,2})?$/.test(normal) ? Math.round(Number(normal) * 100) : NaN;
}
const barcodes = (text: string) => [...new Set(text.split(/[;,\s]+/).map((e) => e.trim()).filter(Boolean))];

function gtinInvalid(code: string) {
  if (!/^\d+$/.test(code)) return false;
  if (![8, 12, 13, 14].includes(code.length)) return code.length >= 7 && code.length <= 14;
  const digits = code.split('').map(Number);
  const check = digits.pop()!;
  const sum = digits.reverse().reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 !== check;
}
const issueOf = (a: MasterArticle, issue: Issue) => (issue === 'invalid_barcode' ? a.ean.some(gtinInvalid) : a[issue]);

const original = (a: MasterArticle): Record<Field, string> => ({
  name: a.name, sku: a.sku, ean: a.ean.join('; '), category_id: a.category_id ?? '', status: a.status,
  sale: euro(a.sale_price_cents), purchase: euro(a.purchase_price_cents), min_stock: a.min_stock === null ? '' : String(a.min_stock),
});

export default function BulkEditor({ articles, categories, initialIssue, initialCategory }: {
  articles: MasterArticle[]; categories: CategoryOption[]; initialIssue: Issue | null; initialCategory: string;
}) {
  const { t } = usePreviewLanguage();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [status, setStatus] = useState('');
  const [issue, setIssue] = useState<Issue | ''>(initialIssue ?? '');
  const [page, setPage] = useState(0);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [bulkCategory, setBulkCategory] = useState('');
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkMin, setBulkMin] = useState('');
  const [bulkPercent, setBulkPercent] = useState('');
  const [inclVat, setInclVat] = useState(true);

  const byCode = useMemo(() => new Map(articles.map((a) => [a.code, a])), [articles]);
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  /** The category's own margin, else the nearest ancestor's. */
  const marginFor = (id: string) => {
    for (let at = categoryById.get(id), guard = 0; at && guard < 20; at = at.parent ? categoryById.get(at.parent) : undefined, guard++) {
      if (at.margin !== null) return { margin: at.margin, vat: categoryById.get(id)!.vat };
    }
    return null;
  };
  const underCategory = (id: string | null, root: string) => {
    for (let at = id, guard = 0; at && guard < 20; at = categoryById.get(at)?.parent ?? null, guard++) if (at === root) return true;
    return false;
  };

  const value = (a: MasterArticle, field: Field) => drafts[a.code]?.[field] ?? original(a)[field];

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase();
    return articles.filter((a) => {
      if (q && !`${a.code} ${a.sku} ${a.name} ${a.ean.join(' ')} ${a.supplier_ref ?? ''}`.toLocaleLowerCase().includes(q)) return false;
      if (category === 'none' ? a.category_id !== null : category && !underCategory(a.category_id, category)) return false;
      if (status && a.status !== status) return false;
      if (issue && !issueOf(a, issue)) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articles, search, category, status, issue, categoryById]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const shown = filtered.slice(Math.min(page, pages - 1) * PAGE, Math.min(page, pages - 1) * PAGE + PAGE);

  const edit = (code: string, field: Field, text: string) => {
    setMessage(null);
    setDrafts((current) => {
      const a = byCode.get(code)!;
      const next = { ...(current[code] ?? {}), [field]: text };
      if (text === original(a)[field]) delete next[field];
      const copy = { ...current };
      if (Object.keys(next).length) copy[code] = next; else delete copy[code];
      return copy;
    });
  };
  const editMany = (codes: string[], make: (a: MasterArticle) => Draft) => {
    setMessage(null);
    setDrafts((current) => {
      const copy = { ...current };
      for (const code of codes) {
        const a = byCode.get(code)!;
        const base = original(a);
        const next = { ...(copy[code] ?? {}), ...make(a) };
        for (const key of Object.keys(next) as Field[]) if (next[key] === base[key]) delete next[key];
        if (Object.keys(next).length) copy[code] = next; else delete copy[code];
      }
      return copy;
    });
  };

  const chosen = [...selected];
  const dirtyCodes = Object.keys(drafts);

  /** Turn drafts into {code, before, after} with real types; collect per-row errors. */
  function buildChanges() {
    const changes: { code: string; before: Record<string, unknown>; after: Record<string, unknown> }[] = [];
    const errors: string[] = [];
    const seen = new Map<string, string>();
    for (const a of articles) for (const e of a.ean) seen.set(e, a.code);
    for (const code of dirtyCodes) {
      const a = byCode.get(code)!;
      const d = drafts[code];
      const before: Record<string, unknown> = {};
      const after: Record<string, unknown> = {};
      const fail = (text: string) => errors.push(`${code}: ${text}`);
      if (d.name !== undefined) { if (!d.name.trim()) fail(t('naam is leeg')); before.name = a.name; after.name = d.name.trim(); }
      if (d.sku !== undefined) { before.sku = a.sku; after.sku = d.sku.trim(); }
      if (d.ean !== undefined) {
        const list = barcodes(d.ean);
        if (list.some((e) => !/^[0-9A-Za-z.\-]{1,40}$/.test(e))) fail(t('ongeldige barcode'));
        for (const e of list) {
          const owner = seen.get(e);
          if (owner && owner !== code && a.tracking === 'quantity' && byCode.get(owner)?.tracking === 'quantity' && !a.ean.includes(e)) fail(`${t('barcode')} ${e} ${t('hoort bij')} ${owner}`);
        }
        before.ean = a.ean; after.ean = list;
      }
      if (d.category_id !== undefined) { before.category_id = a.category_id; after.category_id = d.category_id || null; }
      if (d.status !== undefined) { before.status = a.status; after.status = d.status; }
      for (const [field, column, current] of [['sale', 'sale_price_cents', a.sale_price_cents], ['purchase', 'purchase_price_cents', a.purchase_price_cents]] as const) {
        const text = d[field];
        if (text === undefined) continue;
        const parsed = cents(text);
        if (Number.isNaN(parsed)) fail(`${t('ongeldig bedrag')} "${text}"`);
        before[column] = current; after[column] = parsed;
      }
      if (d.min_stock !== undefined) {
        const n = d.min_stock.trim() === '' ? null : Number(d.min_stock);
        if (n !== null && (!Number.isInteger(n) || n < 0)) fail(t('ongeldige minimumvoorraad'));
        before.min_stock = a.min_stock; after.min_stock = n;
      }
      changes.push({ code, before, after });
    }
    return { changes, errors };
  }

  function save() {
    const { changes, errors } = buildChanges();
    if (errors.length) { setMessage({ tone: 'error', text: errors.slice(0, 6).join(' · ') }); return; }
    if (!changes.length) return;
    start(async () => {
      const result = await saveArticlesAction(changes);
      if (!result.ok) { setMessage({ tone: 'error', text: result.error }); return; }
      setDrafts({});
      setMessage({ tone: 'ok', text: `${result.data ?? 0} ${t('artikelen opgeslagen.')}` });
      router.refresh();
    });
  }

  function priceFromMargin() {
    const prices = new Map<string, string>();
    for (const code of chosen) {
      const a = byCode.get(code)!;
      const cat = value(a, 'category_id');
      const rule = cat ? marginFor(cat) : null;
      const cost = cents(value(a, 'purchase'));
      if (!rule || cost === null || Number.isNaN(cost)) continue;
      prices.set(code, euro(Math.round(cost * (1 + rule.margin / 100) * (inclVat ? 1 + rule.vat / 100 : 1))));
    }
    editMany([...prices.keys()], (a) => ({ sale: prices.get(a.code)! }));
    const skipped = chosen.length - prices.size;
    if (skipped) setMessage({ tone: 'error', text: `${skipped} ${t('artikelen overgeslagen: geen inkoopprijs of geen marge in de categorie.')}` });
  }

  function priceByPercent() {
    const p = Number(bulkPercent.replace(',', '.'));
    if (!Number.isFinite(p) || p <= -100) { setMessage({ tone: 'error', text: t('Ongeldig percentage.') }); return; }
    editMany(chosen, (a) => {
      const now = cents(value(a, 'sale'));
      return now === null || Number.isNaN(now) ? {} : { sale: euro(Math.round(now * (1 + p / 100))) };
    });
  }

  const allShownSelected = shown.length > 0 && shown.every((a) => selected.has(a.code));
  const toggle = (code: string) => setSelected((s) => { const n = new Set(s); if (n.has(code)) n.delete(code); else n.add(code); return n; });
  const changed = (a: MasterArticle, field: Field) => drafts[a.code]?.[field] !== undefined ? 'bg-amber-50 dark:bg-amber-950/40' : '';

  return (
    <div className="grid gap-4">
      <Card>
        <CardContent className="grid gap-3 pt-6 md:grid-cols-4">
          <div className="grid gap-1.5"><Label htmlFor="bulk-search"><PreviewText>Zoeken</PreviewText></Label>
            <Input id="bulk-search" type="search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} placeholder={t('Code, SKU, naam of barcode')} /></div>
          <div className="grid gap-1.5"><Label htmlFor="bulk-cat"><PreviewText>Categorie</PreviewText></Label>
            <select id="bulk-cat" className={SELECT + ' h-9'} value={category} onChange={(e) => { setCategory(e.target.value); setPage(0); }}>
              <option value="">{t('Alle categorieën')}</option>
              <option value="none">{t('(zonder categorie)')}</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.path}</option>)}
            </select></div>
          <div className="grid gap-1.5"><Label htmlFor="bulk-status"><PreviewText>Status</PreviewText></Label>
            <select id="bulk-status" className={SELECT + ' h-9'} value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }}>
              <option value="">{t('Alle statussen')}</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{t(v)}</option>)}
            </select></div>
          <div className="grid gap-1.5"><Label htmlFor="bulk-issue"><PreviewText>Datakwaliteit</PreviewText></Label>
            <select id="bulk-issue" className={SELECT + ' h-9'} value={issue} onChange={(e) => { setIssue(e.target.value as Issue | ''); setPage(0); }}>
              <option value="">{t('Alles')}</option>
              {Object.entries(ISSUE_LABELS).map(([k, v]) => <option key={k} value={k}>{t(v)}</option>)}
            </select></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle><PreviewText>Selectie</PreviewText> <span className="text-muted-foreground text-sm font-normal">({chosen.length} {t('geselecteerd')})</span></CardTitle></CardHeader>
        <CardContent className="grid gap-3">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setSelected(new Set(filtered.map((a) => a.code)))}>{t('Selecteer alle')} {filtered.length} {t('gefilterde')}</Button>
            <Button size="sm" variant="outline" disabled={!chosen.length} onClick={() => setSelected(new Set())}><PreviewText>Selectie wissen</PreviewText></Button>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="flex items-end gap-2">
              <div className="grid flex-1 gap-1.5"><Label htmlFor="set-cat"><PreviewText>Categorie zetten</PreviewText></Label>
                <select id="set-cat" className={SELECT + ' h-9'} value={bulkCategory} onChange={(e) => setBulkCategory(e.target.value)}>
                  <option value="">{t('Kies…')}</option>
                  <option value="none">{t('(geen categorie)')}</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.path}</option>)}
                </select></div>
              <Button size="sm" disabled={!chosen.length || !bulkCategory} onClick={() => editMany(chosen, () => ({ category_id: bulkCategory === 'none' ? '' : bulkCategory }))}><PreviewText>Toepassen</PreviewText></Button>
            </div>
            <div className="flex items-end gap-2">
              <div className="grid flex-1 gap-1.5"><Label htmlFor="set-status"><PreviewText>Status zetten</PreviewText></Label>
                <select id="set-status" className={SELECT + ' h-9'} value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)}>
                  <option value="">{t('Kies…')}</option>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{t(v)}</option>)}
                </select></div>
              <Button size="sm" disabled={!chosen.length || !bulkStatus} onClick={() => editMany(chosen, () => ({ status: bulkStatus }))}><PreviewText>Toepassen</PreviewText></Button>
            </div>
            <div className="flex items-end gap-2">
              <div className="grid flex-1 gap-1.5"><Label htmlFor="set-min"><PreviewText>Minimumvoorraad zetten</PreviewText></Label>
                <Input id="set-min" inputMode="numeric" value={bulkMin} onChange={(e) => setBulkMin(e.target.value)} placeholder={t('leeg = geen minimum')} /></div>
              <Button size="sm" disabled={!chosen.length} onClick={() => editMany(chosen, () => ({ min_stock: bulkMin.trim() }))}><PreviewText>Toepassen</PreviewText></Button>
            </div>
            <div className="flex items-end gap-2">
              <div className="grid flex-1 gap-1.5"><Label htmlFor="set-pct"><PreviewText>Verkoopprijs aanpassen met %</PreviewText></Label>
                <Input id="set-pct" inputMode="decimal" value={bulkPercent} onChange={(e) => setBulkPercent(e.target.value)} placeholder="+5 / -10" /></div>
              <Button size="sm" disabled={!chosen.length || !bulkPercent.trim()} onClick={priceByPercent}><PreviewText>Toepassen</PreviewText></Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Button size="sm" variant="secondary" disabled={!chosen.length} onClick={priceFromMargin}><PreviewText>Verkoopprijs uit categoriemarge</PreviewText></Button>
            <label className="flex items-center gap-2"><input type="checkbox" checked={inclVat} onChange={(e) => setInclVat(e.target.checked)} /> <PreviewText>incl. btw van de categorie</PreviewText></label>
            <span className="text-muted-foreground">{inclVat ? t('inkoop × (1 + marge) × (1 + btw)') : t('inkoop × (1 + marge)')}</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <Button disabled={pending || !dirtyCodes.length} onClick={save}>{t('Opslaan')} ({dirtyCodes.length})</Button>
        <Button variant="outline" disabled={pending || !dirtyCodes.length} onClick={() => { setDrafts({}); setMessage(null); }}><PreviewText>Wijzigingen weggooien</PreviewText></Button>
        <span className="text-muted-foreground text-sm">{filtered.length} {t('artikelen')}</span>
        {message && <span role="status" className={message.tone === 'error' ? 'text-destructive text-sm' : 'text-sm text-emerald-700'}>{message.text}</span>}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"><input type="checkbox" aria-label={t('Alles op deze pagina')} checked={allShownSelected}
                  onChange={() => setSelected((s) => { const n = new Set(s); for (const a of shown) { if (allShownSelected) n.delete(a.code); else n.add(a.code); } return n; })} /></TableHead>
                <TableHead><PreviewText>Code</PreviewText></TableHead>
                <TableHead className="min-w-56"><PreviewText>Naam</PreviewText></TableHead>
                <TableHead className="min-w-28"><PreviewText>SKU</PreviewText></TableHead>
                <TableHead className="min-w-40"><PreviewText>Barcodes</PreviewText></TableHead>
                <TableHead className="min-w-48"><PreviewText>Categorie</PreviewText></TableHead>
                <TableHead className="min-w-32"><PreviewText>Status</PreviewText></TableHead>
                <TableHead className="min-w-24 text-right"><PreviewText>Verkoop €</PreviewText></TableHead>
                <TableHead className="min-w-24 text-right"><PreviewText>Inkoop €</PreviewText></TableHead>
                <TableHead className="min-w-20 text-right"><PreviewText>Min.</PreviewText></TableHead>
                <TableHead className="text-right"><PreviewText>Voorraad</PreviewText></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((a) => (
                <TableRow key={a.code} data-state={selected.has(a.code) ? 'selected' : undefined}>
                  <TableCell><input type="checkbox" aria-label={a.code} checked={selected.has(a.code)} onChange={() => toggle(a.code)} /></TableCell>
                  <TableCell className="font-mono text-xs whitespace-nowrap">{a.code}{a.tracking === 'serial' && <Badge variant="outline" className="ml-1">{t('serie')}</Badge>}</TableCell>
                  <TableCell><Input className={`h-8 ${changed(a, 'name')}`} value={value(a, 'name')} onChange={(e) => edit(a.code, 'name', e.target.value)} aria-label={t('Naam')} /></TableCell>
                  <TableCell><Input className={`h-8 ${changed(a, 'sku')}`} value={value(a, 'sku')} onChange={(e) => edit(a.code, 'sku', e.target.value)} aria-label="SKU" /></TableCell>
                  <TableCell><Input className={`h-8 font-mono text-xs ${changed(a, 'ean')}`} value={value(a, 'ean')} onChange={(e) => edit(a.code, 'ean', e.target.value)} aria-label={t('Barcodes')} placeholder={t('a; b')} /></TableCell>
                  <TableCell>
                    <select className={`${SELECT} ${changed(a, 'category_id')}`} value={value(a, 'category_id')} onChange={(e) => edit(a.code, 'category_id', e.target.value)} aria-label={t('Categorie')}>
                      <option value="">—</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.path}</option>)}
                    </select>
                  </TableCell>
                  <TableCell>
                    <select className={`${SELECT} ${changed(a, 'status')}`} value={value(a, 'status')} onChange={(e) => edit(a.code, 'status', e.target.value)} aria-label={t('Status')}>
                      {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{t(v)}</option>)}
                    </select>
                  </TableCell>
                  <TableCell><Input className={`h-8 text-right ${changed(a, 'sale')}`} inputMode="decimal" value={value(a, 'sale')} onChange={(e) => edit(a.code, 'sale', e.target.value)} aria-label={t('Verkoopprijs')} /></TableCell>
                  <TableCell><Input className={`h-8 text-right ${changed(a, 'purchase')}`} inputMode="decimal" value={value(a, 'purchase')} onChange={(e) => edit(a.code, 'purchase', e.target.value)} aria-label={t('Inkoopprijs')} /></TableCell>
                  <TableCell><Input className={`h-8 text-right ${changed(a, 'min_stock')}`} inputMode="numeric" value={value(a, 'min_stock')} onChange={(e) => edit(a.code, 'min_stock', e.target.value)} aria-label={t('Minimumvoorraad')} /></TableCell>
                  <TableCell className={`text-right tabular-nums ${a.physical < 0 ? 'text-destructive font-medium' : ''}`}>{a.physical}</TableCell>
                </TableRow>
              ))}
              {shown.length === 0 && <TableRow><TableCell colSpan={11} className="text-muted-foreground py-6 text-center"><PreviewText>Geen artikelen gevonden.</PreviewText></TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}><PreviewText>Vorige</PreviewText></Button>
        <span className="text-sm">{Math.min(page, pages - 1) + 1} / {pages}</span>
        <Button size="sm" variant="outline" disabled={page >= pages - 1} onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}><PreviewText>Volgende</PreviewText></Button>
      </div>
    </div>
  );
}
