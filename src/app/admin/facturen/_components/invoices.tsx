'use client';
import * as React from 'react';
import Link from 'next/link';

import {
  type ColumnFiltersState, type ColumnVisibilityState, type PaginationState, type SortingState, useTable,
} from '@tanstack/react-table';
import { CheckCircle, Clock, FileText, Plus, Search, SlidersHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from 'cn';
import { IS_KEYFORCARS } from '@/config/install';
import { useIsMobile } from '@/hooks/use-mobile';
import { dataTableFeatures } from '@/lib/data-table-features';
import { PreviewText, usePreviewLanguage } from '../../PreviewLanguage';

import {
  ALL, dueSoonCount, type InvoiceFilter, invoiceFilters, type InvoiceRow, invoiceMetrics, MONEY, PAYMENT_REMINDER_DAYS,
} from './data';
import { invoicesColumns } from './invoices-columns';
import { InvoicesTable } from './invoices-table';

const COLUMN_LABELS: Record<string, string> = {
  invoice_number: 'Nummer', client_name: 'Klant', car: 'Auto / klus', technician: 'Monteur',
  total: 'Bedrag', due: 'Vervalt', status: 'Status',
};

export function Invoices({ rows, showTechnician, isMonteur }: {
  rows: InvoiceRow[];
  showTechnician: boolean;
  isMonteur: boolean;
}) {
  const { english, t } = usePreviewLanguage();
  const columns = React.useMemo(() => invoicesColumns({ t, english, showTechnician }), [t, english, showTechnician]);

  const [sorting, setSorting] = React.useState<SortingState>([{ id: 'due', desc: true }]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<ColumnVisibilityState>({ search: false });
  // Phones: number, customer, amount and status; the rest is one tap away under "Kolommen".
  const isMobile = useIsMobile();
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time narrowing once the viewport is known
    if (isMobile) setColumnVisibility((visibility) => ({ ...visibility, car: false, technician: false, due: false }));
  }, [isMobile]);
  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize: 20 });

  const table = useTable({
    features: dataTableFeatures,
    data: rows,
    columns,
    state: { sorting, columnFilters, columnVisibility, pagination },
    getRowId: (row) => row.id,
    autoResetPageIndex: false,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
  });

  const metrics = React.useMemo(() => invoiceMetrics(rows), [rows]);
  // Only the office on KeyForCars sees this nudge, exactly as the old list did.
  const dueSoon = IS_KEYFORCARS && showTechnician ? dueSoonCount(rows) : 0;

  const searchQuery = (table.getColumn('search')?.getFilterValue() as string | undefined) ?? '';
  const filter = ((table.getColumn('status')?.getFilterValue() as InvoiceFilter | undefined) ?? ALL);

  function setFilter(next: InvoiceFilter) {
    table.getColumn('status')?.setFilterValue(next === ALL ? undefined : next);
    table.setPageIndex(0);
  }

  return (
    <div className="kfc-neutral flex flex-col gap-4 md:gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl leading-none font-medium tracking-tight"><PreviewText>Facturen</PreviewText></h1>
          <p className="text-muted-foreground text-sm">
            <PreviewText>Facturen aan klanten: concept, verzonden, betaald. Klik een factuur voor details, verzenden of de PDF.</PreviewText>
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/facturen/nieuw"><Plus data-icon="inline-start" /><PreviewText>Nieuwe factuur</PreviewText></Link>
        </Button>
      </div>

      {dueSoon > 0 && (
        <Link href="/admin/bank/verwacht" className="text-sm underline-offset-4 hover:underline">
          {english
            ? `${dueSoon} due within ${PAYMENT_REMINDER_DAYS} days · View Expected Payments`
            : `${dueSoon} binnen ${PAYMENT_REMINDER_DAYS} dagen · Bekijk Verwachte Betalingen`}
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          active={filter === 'open'}
          icon={<FileText className="size-4" />}
          label={t('Openstaand')}
          value={MONEY.format(metrics.open.sum)}
          note={`${metrics.open.n} ${t('facturen')}`}
          onClick={() => setFilter('open')}
        />
        <MetricCard
          active={filter === 'laat'}
          icon={<Clock className="size-4" />}
          label={t('Te laat')}
          value={MONEY.format(metrics.late.sum)}
          valueClass={metrics.late.n ? 'text-destructive' : undefined}
          note={metrics.late.n ? `${metrics.late.n} ${t('facturen')} · ${t('bel of stuur een herinnering')}` : t('niets te laat')}
          onClick={() => setFilter('laat')}
        />
        <MetricCard
          active={filter === 'betaald'}
          icon={<CheckCircle className="size-4" />}
          label={t('Betaald deze maand')}
          value={MONEY.format(metrics.paidThis)}
          note={metrics.change === null
            ? t('geen vergelijking met vorige maand')
            : `${metrics.change >= 0 ? '↑' : '↓'} ${Math.abs(metrics.change)}% ${t('vs vorige maand')}`}
          onClick={() => setFilter('betaald')}
        />
      </div>

      <Card>
        <CardHeader className="border-b has-data-[slot=card-action]:grid-cols-1 md:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
          <CardTitle className="text-xl leading-none">{t('Facturen')}</CardTitle>
          <CardDescription className="max-w-sm leading-snug">
            {t('Zoek op factuurnummer, klant of plaats en filter op status.')}
          </CardDescription>
          <CardAction className="col-start-1 row-start-auto flex w-full flex-wrap justify-start gap-2 justify-self-stretch md:col-start-2 md:row-span-2 md:row-start-1 md:w-auto md:flex-nowrap md:justify-end md:justify-self-end">
            <InputGroup className="h-7 w-full md:w-64">
              <InputGroupAddon align="inline-start">
                <Search className="size-3.5" />
              </InputGroupAddon>
              <InputGroupInput
                className="h-7"
                placeholder={t('Factuurnummer, klant of plaats')}
                aria-label={t('Zoek factuur')}
                value={searchQuery}
                onChange={(event) => {
                  table.getColumn('search')?.setFilterValue(event.target.value || undefined);
                  table.setPageIndex(0);
                }}
              />
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
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 px-0">
          <div className="w-full overflow-x-auto px-4">
            <Tabs value={filter} onValueChange={(value) => setFilter(value as InvoiceFilter)}>
              <TabsList aria-label={t('Filter')}>
                {invoiceFilters.map((option) => (
                  <TabsTrigger key={option.id} value={option.id}>
                    {t(option.label)}
                    {option.id === 'concept' && metrics.concept > 0 && (
                      <span className="text-muted-foreground ms-1.5 tabular-nums">{metrics.concept}</span>
                    )}
                    {option.id === 'laat' && metrics.late.n > 0 && (
                      <span className="text-destructive ms-1.5 tabular-nums">{metrics.late.n}</span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <InvoicesTable table={table} t={t} />
        </CardContent>
      </Card>

      {isMonteur && (
        <p className="text-muted-foreground text-sm">
          <PreviewText>U ziet de facturen die u zelf heeft opgesteld en de facturen die het kantoor aan u heeft gericht.</PreviewText>
        </p>
      )}
    </div>
  );
}

function MetricCard({ active, icon, label, value, valueClass, note, onClick }: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
  note: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'bg-card text-card-foreground ring-foreground/10 hover:bg-muted/40 flex cursor-pointer flex-col gap-1 rounded-xl px-4 py-4 text-left ring-1 transition-colors',
        active && 'ring-primary/60 bg-muted/30',
      )}
    >
      <span className="text-muted-foreground flex items-center gap-2 text-sm">{icon} {label}</span>
      <b className={cn('text-2xl leading-none font-medium tabular-nums', valueClass)}>{value}</b>
      <span className="text-muted-foreground text-xs">{note}</span>
    </button>
  );
}
