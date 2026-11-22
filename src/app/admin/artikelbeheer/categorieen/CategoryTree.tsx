'use client';

import { useMemo, useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, FolderPlus, GitMerge, MoveRight, Pencil, Trash2 } from 'lucide-react';
import { PreviewText, usePreviewLanguage } from '@/app/admin/PreviewLanguage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Category } from '@/lib/kfcProductMaster';
import {
  addCategoryAction, deleteCategoryAction, mergeCategoryAction, moveCategoryAction, updateCategoryAction, type ActionResult,
} from '../actions';

type Mode = { id: string; kind: 'edit' | 'child' | 'move' | 'merge' } | null;
const SELECT = 'border-input bg-background h-9 w-full rounded-md border px-2 text-sm';

export default function CategoryTree({ categories }: { categories: Category[] }) {
  const { t } = usePreviewLanguage();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [mode, setMode] = useState<Mode>(null);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [filter, setFilter] = useState('');
  const [rootName, setRootName] = useState('');

  const children = useMemo(() => {
    const map = new Map<string | null, Category[]>();
    for (const c of categories) map.set(c.parent_id, [...(map.get(c.parent_id) ?? []), c]);
    return map;
  }, [categories]);

  /** A category and everything under it: never a valid new parent or merge target. */
  const descendants = (id: string) => {
    const out = new Set<string>([id]);
    const walk = (at: string) => { for (const c of children.get(at) ?? []) { out.add(c.id); walk(c.id); } };
    walk(id);
    return out;
  };

  const visible = useMemo(() => {
    const q = filter.trim().toLocaleLowerCase();
    return q ? categories.filter((c) => c.path.toLocaleLowerCase().includes(q)) : categories;
  }, [categories, filter]);

  function act<T>(work: () => Promise<ActionResult<T>>, done: (data: T | undefined) => string) {
    setMessage(null);
    start(async () => {
      const result = await work();
      if (!result.ok) { setMessage({ tone: 'error', text: result.error }); return; }
      setMessage({ tone: 'ok', text: done(result.data) });
      setMode(null);
      router.refresh();
    });
  }

  function addRoot(event: FormEvent) {
    event.preventDefault();
    act(() => addCategoryAction({ name: rootName, parent_id: null }), () => { setRootName(''); return t('Categorie toegevoegd.'); });
  }

  /** Swap sort with the neighbour above or below (same parent). */
  function nudge(category: Category, direction: -1 | 1) {
    const siblings = children.get(category.parent_id) ?? [];
    const index = siblings.findIndex((c) => c.id === category.id);
    const other = siblings[index + direction];
    if (!other) return;
    // Equal sort values (the default 0) are ordered by name; give them distinct numbers first.
    const base = siblings.map((c, i) => ({ id: c.id, sort: i * 10 }));
    const a = base[index], b = base[index + direction];
    act(async () => {
      for (const s of base) {
        const sort = s.id === a.id ? b.sort : s.id === b.id ? a.sort : s.sort;
        const current = siblings.find((c) => c.id === s.id)!;
        if (current.sort === sort) continue;
        const result = await updateCategoryAction({ id: s.id, sort });
        if (!result.ok) return result;
      }
      return { ok: true } as const;
    }, () => t('Volgorde aangepast.'));
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader><CardTitle><PreviewText>Nieuwe hoofdcategorie</PreviewText></CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={addRoot} className="flex flex-wrap items-end gap-2">
            <div className="grid min-w-64 flex-1 gap-1.5">
              <Label htmlFor="root-name"><PreviewText>Naam</PreviewText></Label>
              <Input id="root-name" value={rootName} maxLength={80} onChange={(e) => setRootName(e.target.value)} placeholder={t('Bijvoorbeeld Autosleutels')} />
            </div>
            <Button type="submit" disabled={pending || !rootName.trim()}><FolderPlus /> <PreviewText>Toevoegen</PreviewText></Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle><PreviewText>Boom</PreviewText> <span className="text-muted-foreground text-sm font-normal">({categories.length})</span></CardTitle>
          <Input type="search" className="max-w-xs" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder={t('Zoek categorie')} aria-label={t('Zoek categorie')} />
        </CardHeader>
        <CardContent className="grid gap-1">
          {message && <p role="status" className={message.tone === 'error' ? 'text-destructive text-sm' : 'text-sm text-emerald-700'}>{message.text}</p>}
          {visible.length === 0 && <p className="text-muted-foreground text-sm"><PreviewText>Nog geen categorieën.</PreviewText></p>}
          {visible.map((category) => {
            const kids = children.get(category.id) ?? [];
            const siblings = children.get(category.parent_id) ?? [];
            const position = siblings.findIndex((c) => c.id === category.id);
            const open = mode?.id === category.id ? mode.kind : null;
            const blocked = open === 'move' || open === 'merge' ? descendants(category.id) : new Set<string>();
            const targets = categories.filter((c) => !blocked.has(c.id));
            return (
              <div key={category.id} className="rounded-md border px-3 py-2" style={{ marginLeft: filter ? 0 : category.depth * 20 }}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{filter ? category.path : category.name}</span>
                  <Badge variant="secondary">{category.direct} <PreviewText>artikelen</PreviewText>{category.total !== category.direct ? ` · ${category.total} ${t('incl. sub')}` : ''}</Badge>
                  <Badge variant="outline">{t('btw')} {category.vat_rate.toLocaleString('nl-NL')}%</Badge>
                  {category.default_margin_pct !== null && <Badge variant="outline">{t('marge')} {category.default_margin_pct.toLocaleString('nl-NL')}%</Badge>}
                  <div className="ml-auto flex flex-wrap gap-1">
                    <Button size="icon-sm" variant="ghost" aria-label={t('Omhoog')} disabled={pending || filter !== '' || position <= 0} onClick={() => nudge(category, -1)}><ArrowUp /></Button>
                    <Button size="icon-sm" variant="ghost" aria-label={t('Omlaag')} disabled={pending || filter !== '' || position === siblings.length - 1} onClick={() => nudge(category, 1)}><ArrowDown /></Button>
                    <Button size="sm" variant="ghost" onClick={() => setMode(open === 'edit' ? null : { id: category.id, kind: 'edit' })}><Pencil /> <PreviewText>Bewerken</PreviewText></Button>
                    <Button size="sm" variant="ghost" onClick={() => setMode(open === 'child' ? null : { id: category.id, kind: 'child' })}><FolderPlus /> <PreviewText>Sub</PreviewText></Button>
                    <Button size="sm" variant="ghost" onClick={() => setMode(open === 'move' ? null : { id: category.id, kind: 'move' })}><MoveRight /> <PreviewText>Verplaatsen</PreviewText></Button>
                    <Button size="sm" variant="ghost" onClick={() => setMode(open === 'merge' ? null : { id: category.id, kind: 'merge' })}><GitMerge /> <PreviewText>Samenvoegen</PreviewText></Button>
                    <Button size="sm" variant="ghost" disabled={pending || category.direct > 0 || kids.length > 0}
                      title={category.direct > 0 || kids.length > 0 ? t('Alleen lege categorieën zonder subcategorieën') : undefined}
                      onClick={() => { if (window.confirm(t('Categorie verwijderen?'))) act(() => deleteCategoryAction({ id: category.id }), () => t('Categorie verwijderd.')); }}>
                      <Trash2 /> <PreviewText>Verwijderen</PreviewText>
                    </Button>
                  </div>
                </div>

                {open === 'edit' && (
                  <form className="mt-3 grid gap-2 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end" onSubmit={(e) => {
                    e.preventDefault();
                    const form = new FormData(e.currentTarget);
                    act(() => updateCategoryAction({
                      id: category.id, name: String(form.get('name') ?? ''), vat_rate: String(form.get('vat') ?? ''),
                      default_margin_pct: String(form.get('margin') ?? ''),
                    }), () => t('Categorie opgeslagen.'));
                  }}>
                    <div className="grid gap-1.5"><Label htmlFor={`name-${category.id}`}><PreviewText>Naam</PreviewText></Label><Input id={`name-${category.id}`} name="name" defaultValue={category.name} maxLength={80} required /></div>
                    <div className="grid gap-1.5"><Label htmlFor={`vat-${category.id}`}><PreviewText>Btw %</PreviewText></Label><Input id={`vat-${category.id}`} name="vat" inputMode="decimal" defaultValue={String(category.vat_rate).replace('.', ',')} required /></div>
                    <div className="grid gap-1.5"><Label htmlFor={`margin-${category.id}`}><PreviewText>Standaardmarge %</PreviewText></Label><Input id={`margin-${category.id}`} name="margin" inputMode="decimal" defaultValue={category.default_margin_pct === null ? '' : String(category.default_margin_pct).replace('.', ',')} placeholder={t('geen')} /></div>
                    <Button type="submit" disabled={pending}><PreviewText>Opslaan</PreviewText></Button>
                  </form>
                )}

                {open === 'child' && (
                  <form className="mt-3 flex flex-wrap items-end gap-2" onSubmit={(e) => {
                    e.preventDefault();
                    const name = String(new FormData(e.currentTarget).get('name') ?? '');
                    act(() => addCategoryAction({ name, parent_id: category.id }), () => t('Subcategorie toegevoegd.'));
                  }}>
                    <div className="grid min-w-64 flex-1 gap-1.5"><Label htmlFor={`child-${category.id}`}><PreviewText>Naam van de subcategorie</PreviewText></Label><Input id={`child-${category.id}`} name="name" maxLength={80} required autoFocus /></div>
                    <Button type="submit" disabled={pending}><PreviewText>Toevoegen</PreviewText></Button>
                  </form>
                )}

                {open === 'move' && (
                  <form className="mt-3 flex flex-wrap items-end gap-2" onSubmit={(e) => {
                    e.preventDefault();
                    const parent = String(new FormData(e.currentTarget).get('parent') ?? '');
                    act(() => moveCategoryAction({ id: category.id, parent_id: parent || null }), () => t('Categorie verplaatst.'));
                  }}>
                    <div className="grid min-w-64 flex-1 gap-1.5">
                      <Label htmlFor={`move-${category.id}`}><PreviewText>Nieuwe bovenliggende categorie</PreviewText></Label>
                      <select id={`move-${category.id}`} name="parent" className={SELECT} defaultValue={category.parent_id ?? ''}>
                        <option value="">{t('(hoofdniveau)')}</option>
                        {targets.map((c) => <option key={c.id} value={c.id}>{c.path}</option>)}
                      </select>
                    </div>
                    <Button type="submit" disabled={pending}><PreviewText>Verplaatsen</PreviewText></Button>
                  </form>
                )}

                {open === 'merge' && (
                  <form className="mt-3 grid gap-2" onSubmit={(e) => {
                    e.preventDefault();
                    const into = String(new FormData(e.currentTarget).get('into') ?? '');
                    const target = categories.find((c) => c.id === into);
                    if (!target || !window.confirm(`${t('Samenvoegen in')} ${target.path}? ${t('Artikelen en subcategorieën verhuizen; deze categorie verdwijnt.')}`)) return;
                    act(() => mergeCategoryAction({ from: category.id, into }), (moved) => `${t('Samengevoegd.')} ${moved ?? 0} ${t('artikelen verplaatst.')}`);
                  }}>
                    <p className="text-muted-foreground text-sm"><PreviewText>Alle artikelen en subcategorieën gaan naar de gekozen categorie. De oude naam blijft als alias bestaan, zodat een import of webshop die nog de oude naam stuurt op de juiste plek uitkomt.</PreviewText></p>
                    <div className="flex flex-wrap items-end gap-2">
                      <div className="grid min-w-64 flex-1 gap-1.5">
                        <Label htmlFor={`merge-${category.id}`}><PreviewText>Samenvoegen in</PreviewText></Label>
                        <select id={`merge-${category.id}`} name="into" className={SELECT} required defaultValue="">
                          <option value="" disabled>{t('Kies een categorie')}</option>
                          {targets.map((c) => <option key={c.id} value={c.id}>{c.path}</option>)}
                        </select>
                      </div>
                      <Button type="submit" variant="destructive" disabled={pending}><PreviewText>Samenvoegen</PreviewText></Button>
                    </div>
                  </form>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
