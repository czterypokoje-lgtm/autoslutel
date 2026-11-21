'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCell, type Cell, type ReportData } from '@/lib/kfcReportColumns';
import { usePreviewLanguage } from '../../PreviewLanguage';
import { CellValue, ColumnPicker, ExportMenu, alignOf } from './TableParts';

const CLIENT_PAGE = 100;
const TONE = { ok: 'border-t-emerald-500', warn: 'border-t-amber-500', stop: 'border-t-red-500' } as const;

/**
 * One report as a table: summary cards, column picker, sort, paging, totals
 * row and export. Visible columns and sort live in the URL (cols, sort, dir),
 * so a bookmarked or shared link is a saved view. The ledger is paged on the
 * server (page=…); every other report arrives whole and pages here.
 */
export default function ReportTable({ data, exportHref, title }: { data: ReportData; exportHref: string; title: string }) {
  const { english } = usePreviewLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const serverPaged = data.total !== undefined && data.pageSize !== undefined;

  const allKeys = data.columns.map((c) => c.key);
  const fromUrl = (params.get('cols') ?? '').split(',').filter((k) => allKeys.includes(k));
  const visible = fromUrl.length ? fromUrl : data.columns.filter((c) => !c.optional).map((c) => c.key);
  const columns = data.columns.filter((c) => visible.includes(c.key));
  const sortKey = allKeys.includes(params.get('sort') ?? '') ? params.get('sort')! : '';
  const dir = params.get('dir') === 'asc' ? 'asc' : 'desc';
  const [page, setPage] = useState(0);

  const setUrl = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === '') next.delete(key); else next.set(key, value);
    }
    router.replace(`${pathname}?${next}`, { scroll: false });
  };

  const sorted = useMemo(() => {
    if (!sortKey || serverPaged) return data.rows;
    const column = data.columns.find((c) => c.key === sortKey)!;
    const numeric = ['int', 'money', 'pct', 'days'].includes(column.type);
    const value = (cell: Cell | undefined) => (cell === null || cell === undefined ? null : numeric ? Number(cell) : String(cell));
    return [...data.rows].sort((a, b) => {
      const x = value(a[sortKey]), y = value(b[sortKey]);
      if (x === null && y === null) return 0;
      if (x === null) return 1;
      if (y === null) return -1;
      const order = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'nl', { numeric: true });
      return dir === 'asc' ? order : -order;
    });
  }, [data.rows, data.columns, sortKey, dir, serverPaged]);

  const pages = serverPaged ? Math.max(1, Math.ceil(data.total! / data.pageSize!)) : Math.max(1, Math.ceil(sorted.length / CLIENT_PAGE));
  const current = serverPaged ? (data.page ?? 1) - 1 : Math.min(page, pages - 1);
  const shown = serverPaged ? sorted : sorted.slice(current * CLIENT_PAGE, (current + 1) * CLIENT_PAGE);
  const pageHref = (n: number) => { const next = new URLSearchParams(params.toString()); next.set('page', String(n + 1)); return `${pathname}?${next}`; };

  const summable = (key: string) => ['quantity', 'value_cents', 'revenue_cents', 'cost_cents', 'profit_cents', 'sold', 'physical', 'suggest', 'order_value_cents',
    'difference', 'incoming', 'outgoing', 'stock_value_cents', 'lines', 'articles', 'q_0_30', 'q_31_60', 'q_61_90', 'q_91_180', 'q_181_365', 'q_365p', 'available', 'reserved'].includes(key);
  const totals = Object.fromEntries(columns.filter((c) => summable(c.key)).map((c) => [c.key, sorted.reduce((s, r) => s + (Number(r[c.key]) || 0), 0)]));
  const sortBy = (key: string) => setUrl({ sort: key, dir: sortKey === key && dir === 'desc' ? 'asc' : 'desc' });
  const exportCols = `${exportHref}&cols=${encodeURIComponent(visible.join(','))}`;
  const rowsLabel = english ? 'rows' : 'regels';

  return (
    <div className="flex flex-col gap-4">
      {data.summary.length > 0 && (
        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label={english ? 'Summary' : 'Samenvatting'}>
          {data.summary.map((s) => (
            <Card key={s.nl} className={`gap-1 border-t-2 py-4 ${s.tone ? TONE[s.tone] : 'border-t-slate-300'}`}>
              <CardHeader className="px-4 pb-0"><CardDescription>{english ? s.en : s.nl}</CardDescription></CardHeader>
              <CardContent className="px-4"><div className="text-xl font-semibold tabular-nums tracking-tight lg:text-2xl">
                {typeof s.value === 'string' && s.type === 'text' ? s.value : formatCell(s.value, s.type, english)}
              </div></CardContent>
            </Card>
          ))}
        </section>
      )}
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{formatCell(serverPaged ? data.total! : sorted.length, 'int', english)} {rowsLabel}</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <ColumnPicker columns={data.columns} visible={visible} onChange={(next) => setUrl({ cols: next.join(',') })} />
            <ExportMenu href={exportCols} />
            <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>{english ? 'Print' : 'Afdrukken'}</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="min-w-[720px]">
              <TableHeader>
                <TableRow>
                  {columns.map((c) => (
                    <TableHead key={c.key} className={alignOf(c)} aria-sort={sortKey === c.key ? (dir === 'asc' ? 'ascending' : 'descending') : undefined}>
                      {serverPaged ? (english ? c.en : c.nl) : (
                        <button type="button" className="inline-flex items-center gap-1 hover:underline" onClick={() => sortBy(c.key)}>
                          {english ? c.en : c.nl}
                          {sortKey === c.key && (dir === 'asc' ? <ArrowUp className="size-3" aria-hidden="true" /> : <ArrowDown className="size-3" aria-hidden="true" />)}
                        </button>
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {shown.length === 0 && (
                  <TableRow><TableCell colSpan={columns.length} className="text-muted-foreground py-10 text-center">
                    {english ? 'Nothing in this selection.' : 'Niets in deze selectie.'}
                  </TableCell></TableRow>
                )}
                {shown.map((row, index) => (
                  <TableRow key={`${row.code ?? ''}-${row.location ?? row.label ?? ''}-${row.created_at ?? ''}-${index}`}>
                    {columns.map((c) => (
                      <TableCell key={c.key} className={`${alignOf(c)} ${c.key === 'name' ? 'max-w-72 whitespace-normal' : ''}`}>
                        <CellValue column={c} value={row[c.key]} english={english} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
              {!serverPaged && sorted.length > 1 && Object.keys(totals).length > 0 && (
                <TableFooter>
                  <TableRow>
                    {columns.map((c, i) => (
                      <TableCell key={c.key} className={`${alignOf(c)} font-semibold`}>
                        {c.key in totals ? formatCell(totals[c.key], c.type, english) : i === 0 ? (english ? 'Total' : 'Totaal') : ''}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </div>
          {pages > 1 && (
            <nav className="mt-4 flex items-center justify-end gap-2 print:hidden" aria-label={english ? 'Pages' : 'Pagina’s'}>
              {serverPaged ? (
                <>
                  {current > 0 && <Button asChild variant="outline" size="sm"><Link href={pageHref(current - 1)}><ChevronLeft aria-hidden="true" />{english ? 'Previous' : 'Vorige'}</Link></Button>}
                  <span className="text-muted-foreground text-sm">{current + 1} / {pages}</span>
                  {current < pages - 1 && <Button asChild variant="outline" size="sm"><Link href={pageHref(current + 1)}>{english ? 'Next' : 'Volgende'}<ChevronRight aria-hidden="true" /></Link></Button>}
                </>
              ) : (
                <>
                  <Button type="button" variant="outline" size="sm" disabled={current === 0} onClick={() => setPage(current - 1)}><ChevronLeft aria-hidden="true" />{english ? 'Previous' : 'Vorige'}</Button>
                  <span className="text-muted-foreground text-sm">{current + 1} / {pages}</span>
                  <Button type="button" variant="outline" size="sm" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>{english ? 'Next' : 'Volgende'}<ChevronRight aria-hidden="true" /></Button>
                </>
              )}
            </nav>
          )}
        </CardContent>
      </Card>
      {data.notes.map((note) => (
        <p key={note.nl} className="text-muted-foreground flex gap-2 text-xs"><Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />{english ? note.en : note.nl}</p>
      ))}
    </div>
  );
}
