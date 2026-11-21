'use client';

import Link from 'next/link';
import { Columns3, Download, FileSpreadsheet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatCell, labelOf, reasonLabel, STOCK_STATES, ARTICLE_STATUSES, type Cell, type ReportColumn } from '@/lib/kfcReportColumns';
import { usePreviewLanguage } from '../../PreviewLanguage';

/*
 * Pieces shared by the report table (analyse/ReportTable.tsx) and the article
 * master list (artikelen/ArticleList.tsx): one cell renderer, one column
 * picker, one export menu.
 */

export const articleHref = (code: string) => `/admin/voorraad/artikel/${encodeURIComponent(code)}`;

const NUMERIC = new Set(['int', 'money', 'pct', 'days']);
export const alignOf = (column: ReportColumn) => (NUMERIC.has(column.type) ? 'text-right tabular-nums' : '');

const TONE: Record<string, string> = {
  negatief: 'border-red-300 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-200',
  nul: 'border-slate-300 bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-200',
  laag: 'border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  op_voorraad: 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  Kritiek: 'border-red-300 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-200',
  Bestellen: 'border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  A: 'border-emerald-300 bg-emerald-50 text-emerald-800', B: 'border-sky-300 bg-sky-50 text-sky-800',
  C: 'border-slate-300 bg-slate-50 text-slate-700', D: 'border-red-300 bg-red-50 text-red-700',
  Snel: 'border-emerald-300 bg-emerald-50 text-emerald-800', Traag: 'border-amber-300 bg-amber-50 text-amber-800',
  'Niet verkocht': 'border-red-300 bg-red-50 text-red-700',
};
const BADGE_EN: Record<string, string> = {
  Kritiek: 'Critical', Bestellen: 'Order', 'Op (geen verkoop)': 'Out (no sales)', Snel: 'Fast', Traag: 'Slow', 'Niet verkocht': 'Not sold', Normaal: 'Normal',
};

function badgeText(column: ReportColumn, value: string, english: boolean) {
  if (column.key === 'stock_state') return labelOf(STOCK_STATES, value, english);
  if (column.key === 'status') return labelOf(ARTICLE_STATUSES, value, english);
  if (column.key === 'reason') return reasonLabel(value, english);
  return english ? BADGE_EN[value] ?? value : value;
}

export function CellValue({ column, value, english }: { column: ReportColumn; value: Cell | undefined; english: boolean }) {
  if (value === null || value === undefined || value === '') return <span className="text-muted-foreground">—</span>;
  if (column.type === 'code' && typeof value === 'string') {
    return <Link className="font-mono text-xs font-medium underline-offset-4 hover:underline" href={articleHref(value)}>{value}</Link>;
  }
  if (column.type === 'badge') {
    const text = String(value);
    return <Badge variant="outline" className={TONE[text] ?? ''}>{badgeText(column, text, english)}</Badge>;
  }
  const shown = formatCell(value, column.type, english);
  if (column.type === 'int' && typeof value === 'number' && value < 0) return <span className="font-medium text-red-600">{shown}</span>;
  return <>{shown}</>;
}

export function ColumnPicker({ columns, visible, onChange }: { columns: ReportColumn[]; visible: string[]; onChange: (next: string[]) => void }) {
  const { english } = usePreviewLanguage();
  const toggle = (key: string, on: boolean) => {
    const next = on ? columns.map((c) => c.key).filter((k) => k === key || visible.includes(k)) : visible.filter((k) => k !== key);
    if (next.length) onChange(next);
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm"><Columns3 aria-hidden="true" />{english ? 'Columns' : 'Kolommen'}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-96 overflow-y-auto">
        <DropdownMenuLabel>{english ? 'Show columns' : 'Kolommen tonen'}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns.map((column) => (
          <DropdownMenuCheckboxItem key={column.key} checked={visible.includes(column.key)} onSelect={(event) => event.preventDefault()}
            onCheckedChange={(on) => toggle(column.key, !!on)}>
            {english ? column.en : column.nl}
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onChange(columns.filter((c) => !c.optional).map((c) => c.key))}>{english ? 'Default columns' : 'Standaardkolommen'}</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onChange(columns.map((c) => c.key))}>{english ? 'All columns' : 'Alle kolommen'}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** `href` is the export URL without format; CSV and Excel are the same data. */
export function ExportMenu({ href, label }: { href: string; label?: string }) {
  const { english } = usePreviewLanguage();
  const lang = english ? '&lang=en' : '';
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm"><Download aria-hidden="true" />{label ?? (english ? 'Export' : 'Exporteren')}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild><a href={`${href}&format=xlsx${lang}`} download><FileSpreadsheet aria-hidden="true" />Excel (.xlsx)</a></DropdownMenuItem>
        <DropdownMenuItem asChild><a href={`${href}&format=csv${lang}`} download><Download aria-hidden="true" />CSV (;)</a></DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
