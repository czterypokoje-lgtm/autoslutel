'use client';
import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { type ColumnDef, type ColumnVisibilityState, type PaginationState, Subscribe, useTable } from '@tanstack/react-table';
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronsLeftIcon, ChevronsRightIcon, Download, EllipsisVertical, Settings2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { type DataTableFeatures, dataTableFeatures } from '@/lib/data-table-features';
import type { LeadLite } from '@/lib/kfcLeads';
import { usePreviewLanguage } from '../../PreviewLanguage';

import { sourceLabel, statusLabel } from './labels';

const COLUMN_LABELS: Record<string, string> = { name: 'Naam', car: 'Auto', status: 'Status', source: 'Bron', lastActivity: 'Laatste activiteit' };
const NEXT_STATUSES = ['qualified', 'contacted', 'sold', 'rejected'];

type RecentLead = LeadLite & { lastActivity: string };

export function RecentLeadsTable({ rows }: { rows: RecentLead[] }) {
  const router = useRouter();
  const { t } = usePreviewLanguage();
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<ColumnVisibilityState>({});
  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [busy, setBusy] = React.useState<string | null>(null);

  async function setStatus(lead: RecentLead, status: string) {
    setBusy(lead.id);
    const res = await fetch(`/api/admin/leads/${lead.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }).catch(() => null);
    setBusy(null);
    if (res?.ok) router.refresh();
  }

  const columns = React.useMemo<ColumnDef<DataTableFeatures, RecentLead>[]>(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Subscribe source={table.atoms.rowSelection} selector={() => table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected() && 'indeterminate')}>
            {(checked) => <Checkbox checked={checked} onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)} aria-label={t('Alles selecteren')} />}
          </Subscribe>
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Subscribe source={row.table.atoms.rowSelection} selector={(selection) => Boolean(selection?.[row.id])}>
            {(checked) => <Checkbox checked={checked} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label={t('Rij selecteren')} />}
          </Subscribe>
        </div>
      ),
      enableHiding: false,
    },
    { accessorKey: 'id', header: 'Ref', cell: ({ row }) => <span className="tabular-nums">L-{row.original.id.slice(0, 4).toUpperCase()}</span>, enableHiding: false },
    { accessorKey: 'name', header: t('Naam'), cell: ({ row }) => row.original.name ?? <span className="text-muted-foreground">{row.original.phone_e164 ?? '—'}</span>, enableHiding: false },
    { id: 'car', accessorFn: (r) => [r.brand, r.model].filter(Boolean).join(' '), header: t('Auto'), cell: ({ row }) => [row.original.brand, row.original.model].filter(Boolean).join(' ') || <span className="text-muted-foreground">—</span> },
    { accessorKey: 'status', header: t('Status'), cell: ({ row }) => <Badge variant="secondary">{t(statusLabel(row.original.status))}</Badge> },
    { accessorKey: 'source', header: t('Bron'), cell: ({ row }) => <Badge variant="outline">{t(sourceLabel(row.original.source))}</Badge> },
    { id: 'lastActivity', accessorFn: (r) => r.updated_at ?? r.created_at, header: t('Laatste activiteit'), cell: ({ row }) => <span className="text-muted-foreground tabular-nums">{row.original.lastActivity}</span> },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground flex size-8" disabled={busy === row.original.id}>
              <EllipsisVertical />
              <span className="sr-only">{t('Menu openen')}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuGroup>
              <DropdownMenuItem asChild><Link href={`/admin/leads/lijst?q=${encodeURIComponent(row.original.phone_e164 ?? row.original.name ?? '')}&dagen=all`}>{t('Bekijken')}</Link></DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {NEXT_STATUSES.filter((s) => s !== row.original.status).map((s) => (
                <DropdownMenuItem key={s} variant={s === 'rejected' ? 'destructive' : 'default'} onClick={() => setStatus(row.original, s)}>{t(statusLabel(s))}</DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      enableHiding: false,
    },
  ], [t, busy]); // eslint-disable-line react-hooks/exhaustive-deps

  const table = useTable({
    features: dataTableFeatures,
    data: rows,
    columns,
    state: { rowSelection, columnVisibility, pagination },
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
  });

  function exportCsv() {
    const source = table.getFilteredSelectedRowModel().rows.length ? table.getFilteredSelectedRowModel().rows : table.getFilteredRowModel().rows;
    const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [['Ref', 'Naam', 'Telefoon', 'Auto', 'Dienst', 'Status', 'Bron', 'Aangemaakt'].join(';'), ...source.map(({ original: r }) =>
      [r.id, r.name, r.phone_e164, [r.brand, r.model].filter(Boolean).join(' '), r.service, statusLabel(r.status), sourceLabel(r.source), r.created_at].map(cell).join(';'))];
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })), download: 'recente-leads.csv' });
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('Recente leads')}</CardTitle>
        <CardDescription>{t('De laatste aanvragen en hun status.')}</CardDescription>
        <CardAction>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings2 data-icon="inline-start" />
                  {t('Weergave')}
                  <ChevronDownIcon data-icon="inline-end" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel>{t('Kolommen')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  {table.getAllColumns().filter((column) => typeof column.accessorFn !== 'undefined' && column.getCanHide()).map((column) => (
                    <DropdownMenuCheckboxItem key={column.id} checked={column.getIsVisible()} onCheckedChange={(value) => column.toggleVisibility(!!value)}>
                      {t(COLUMN_LABELS[column.id] ?? column.id)}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download data-icon="inline-start" />
              <span className="hidden lg:inline">{t('Exporteren')}</span>
            </Button>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader className="bg-muted">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="**:data-[slot=table-cell]:first:w-8">
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={table.state.rowSelection[row.id] && 'selected'}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        <table.FlexRender cell={cell} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={table.getVisibleLeafColumns().length} className="h-24 text-center">
                    {t('Geen leads.')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} {t('van')} {table.getFilteredRowModel().rows.length} {t('rijen geselecteerd.')}
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="recent-leads-rows-per-page" className="text-sm font-medium">{t('Rijen per pagina')}</Label>
              <Select value={`${table.state.pagination.pageSize}`} onValueChange={(value) => table.setPageSize(Number(value))}>
                <SelectTrigger size="sm" className="w-20" id="recent-leads-rows-per-page">
                  <SelectValue placeholder={table.state.pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  <SelectGroup>
                    {[10, 20, 30, 40, 50].map((pageSize) => (
                      <SelectItem key={pageSize} value={`${pageSize}`}>{pageSize}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              {t('Pagina')} {table.state.pagination.pageIndex + 1} {t('van')} {Math.max(table.getPageCount(), 1)}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
                <span className="sr-only">{t('Eerste pagina')}</span>
                <ChevronsLeftIcon />
              </Button>
              <Button variant="outline" size="icon" className="size-8" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                <span className="sr-only">{t('Vorige pagina')}</span>
                <ChevronLeftIcon />
              </Button>
              <Button variant="outline" size="icon" className="size-8" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                <span className="sr-only">{t('Volgende pagina')}</span>
                <ChevronRightIcon />
              </Button>
              <Button variant="outline" size="icon" className="hidden size-8 lg:flex" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
                <span className="sr-only">{t('Laatste pagina')}</span>
                <ChevronsRightIcon />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
