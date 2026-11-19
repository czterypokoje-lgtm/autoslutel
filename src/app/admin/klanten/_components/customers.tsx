'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';

import {
  type ColumnFiltersState, type ColumnVisibilityState, type PaginationState, type SortingState, useTable,
} from '@tanstack/react-table';
import { Download, Grid, Rows3, Search, SlidersHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Kbd } from '@/components/ui/kbd';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { dataTableFeatures } from '@/lib/data-table-features';
import { usePreviewLanguage } from '../../PreviewLanguage';
import { CustomerDialog } from '../KfcCustomers';

import { ALL, type CustomerRow, type CustomerStatus, customerStatus, statusOptions } from './data';
import { customersColumns } from './customers-columns';
import { CustomersTable } from './customers-table';

const COLUMN_LABELS: Record<string, string> = {
  company: 'Klant', terms: 'Termijn / Plaats', country: 'Land', open_cents: 'Open', overdue_cents: 'Vervallen', status: 'Status', lastEntry: 'Laatste boeking',
};

export function Customers({ rows, initialStatus, initialQuery }: {
  rows: CustomerRow[];
  initialStatus?: CustomerStatus;
  initialQuery?: string;
}) {
  const router = useRouter();
  const { t } = usePreviewLanguage();
  const columns = React.useMemo(() => customersColumns(t), [t]);
  const searchRef = React.useRef<HTMLInputElement>(null);

  const [rowSelection, setRowSelection] = React.useState({});
  const [sorting, setSorting] = React.useState<SortingState>([{ id: 'lastEntry', desc: true }]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(() => [
    ...(initialStatus ? [{ id: 'status', value: initialStatus }] : []),
    ...(initialQuery ? [{ id: 'search', value: initialQuery }] : []),
  ]);
  const [columnVisibility, setColumnVisibility] = React.useState<ColumnVisibilityState>({ search: false, country: false });
  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  const table = useTable({
    features: dataTableFeatures,
    data: rows,
    columns,
    state: { rowSelection, sorting, columnFilters, columnVisibility, pagination },
    getRowId: (row) => row.id,
    autoResetPageIndex: false,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
  });

  // ⌘K / Ctrl+K focuses the search, as the hint in the field promises.
  React.useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const termsOptions = React.useMemo(() => [ALL, ...Array.from(new Set(rows.map((r) => String(r.terms_days)))).sort((a, b) => Number(a) - Number(b))], [rows]);
  const countryOptions = React.useMemo(() => [ALL, ...Array.from(new Set(rows.map((r) => r.country))).sort()], [rows]);

  const searchQuery = (table.getColumn('search')?.getFilterValue() as string | undefined) ?? '';
  const termsFilter = (table.getColumn('terms')?.getFilterValue() as string | undefined) ?? ALL;
  const statusFilter = (table.getColumn('status')?.getFilterValue() as string | undefined) ?? ALL;
  const countryFilter = (table.getColumn('country')?.getFilterValue() as string | undefined) ?? ALL;
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  function setColumnSelectFilter(columnId: string, value: string) {
    table.getColumn(columnId)?.setFilterValue(value === ALL ? undefined : value);
    table.setPageIndex(0);
  }

  /* CSV of the selected rows, or of everything that passes the filters. Semicolons and a BOM: what Dutch Excel opens cleanly. */
  function exportCsv() {
    const source = selectedCount > 0 ? table.getFilteredSelectedRowModel().rows : table.getFilteredRowModel().rows;
    const head = ['Bedrijf', 'Contact', 'E-mail', 'Telefoon', 'Plaats', 'Land', 'Termijn (dagen)', 'Open (EUR)', 'Vervallen (EUR)', 'Status', 'Laatste boeking'];
    const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = source.map(({ original: r }) => [
      r.company, r.contact_name, r.email, r.phone, r.city, r.country, r.terms_days,
      (r.open_cents / 100).toFixed(2).replace('.', ','), (r.overdue_cents / 100).toFixed(2).replace('.', ','), customerStatus(r), r.last_entry,
    ].map(cell).join(';'));
    const blob = new Blob(['\uFEFF' + [head.join(';'), ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `klanten-${new Date().toISOString().slice(0, 10)}.csv` });
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="kfc-neutral">
    <Card>
      <CardHeader className="border-b has-data-[slot=card-action]:grid-cols-1 md:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
        <CardTitle className="text-xl leading-none">{t('Klanten')}</CardTitle>
        <CardDescription className="max-w-sm leading-snug">
          {t('Zakelijke klanten met een rekening: dealers, slotenmakers, garages.')}
        </CardDescription>
        <CardAction className="col-start-1 row-start-auto flex w-full flex-wrap justify-start gap-2 justify-self-stretch md:col-start-2 md:row-span-2 md:row-start-1 md:w-auto md:flex-nowrap md:justify-end md:justify-self-end">
          <InputGroup className="h-7 w-full md:w-64">
            <InputGroupAddon align="inline-start">
              <Search className="size-3.5" />
            </InputGroupAddon>
            <InputGroupInput
              ref={searchRef}
              className="h-7"
              placeholder={t('Zoek klant…')}
              value={searchQuery}
              onChange={(event) => {
                table.getColumn('search')?.setFilterValue(event.target.value || undefined);
                table.setPageIndex(0);
              }}
            />
            <InputGroupAddon align="inline-end">
              <Kbd className="h-4 text-[10px]">⌘K</Kbd>
            </InputGroupAddon>
          </InputGroup>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <SlidersHorizontal /> {t('Kolommen')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t('Zichtbare kolommen')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table.getAllLeafColumns().filter((column) => column.getCanHide() && column.id !== 'search').map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {t(COLUMN_LABELS[column.id] ?? column.id)}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download /> {t('Exporteren')}
          </Button>
          <CustomerDialog onSaved={(id) => router.push(`/admin/klanten/${id}`)} />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-0">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={termsFilter} onValueChange={(value) => setColumnSelectFilter('terms', value)}>
              <SelectTrigger size="sm">
                <span className="text-muted-foreground">{t('Termijn')}:</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                <SelectGroup>
                  {termsOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option === ALL ? t(ALL) : `${option} ${t('dagen')}`}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(value) => setColumnSelectFilter('status', value)}>
              <SelectTrigger size="sm">
                <span className="text-muted-foreground">{t('Status')}:</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                <SelectGroup>
                  {[ALL, ...statusOptions].map((option) => (
                    <SelectItem key={option} value={option}>
                      {t(option)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <Select value={countryFilter} onValueChange={(value) => setColumnSelectFilter('country', value)}>
            <SelectTrigger size="sm">
              <span className="text-muted-foreground">{t('Land')}:</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align="end">
              <SelectGroup>
                {countryOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option === ALL ? t(ALL) : option}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between gap-3 px-4">
          <div className="text-muted-foreground text-sm tabular-nums">{selectedCount} {t('geselecteerd')}</div>

          <Tabs defaultValue="list">
            <TabsList>
              <TabsTrigger value="list" aria-label={t('Lijstweergave')}>
                <Rows3 />
              </TabsTrigger>
              <TabsTrigger value="grid" aria-label={t('Rasterweergave')} disabled>
                <Grid />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <CustomersTable table={table} t={t} />
      </CardContent>
    </Card>
    </div>
  );
}
