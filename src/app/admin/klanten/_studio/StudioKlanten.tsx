'use client';
import * as React from 'react';
import Link from 'next/link';

import {
  type ColumnFiltersState, type ColumnVisibilityState, type PaginationState, type SortingState, useTable,
} from '@tanstack/react-table';
import { Search, SlidersHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { dataTableFeatures } from '@/lib/data-table-features';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePreviewLanguage } from '../../PreviewLanguage';

import { ALL, buyerOptions, consentOptions, type CustomerRow, MONEY } from './data';
import { klantenColumns } from './klanten-columns';
import { KlantenTable } from './klanten-table';

/**
 * The Autosleutel24 klanten list in the Studio look: the same 200 rows
 * crm_customers already returned, the same ?q= search (it still posts to
 * /admin/klanten, so the server query and every old link keep working), the
 * same four totals and the same per-row actions — as a TanStack table.
 */

const COLUMN_LABELS: Record<string, string> = {
  name: 'Klant', aanvragen: 'Aanvragen', verkocht: 'Verkocht', omzet: 'Omzet', consent: 'Marketing', lastSeen: 'Laatst gezien',
};

export default function StudioKlanten({ rows, search }: { rows: CustomerRow[]; search: string }) {
  const { t } = usePreviewLanguage();
  const columns = React.useMemo(() => klantenColumns(t), [t]);

  const [query, setQuery] = React.useState(search);
  const [sorting, setSorting] = React.useState<SortingState>([{ id: 'lastSeen', desc: true }]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<ColumnVisibilityState>({ search: false });
  // Phones: name, omzet and the actions; the rest stays one tap away under "Kolommen".
  const isMobile = useIsMobile();
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time narrowing once the viewport is known
    if (isMobile) setColumnVisibility((v) => ({ ...v, aanvragen: false, verkocht: false, consent: false, lastSeen: false }));
  }, [isMobile]);
  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize: 20 });

  const table = useTable({
    features: dataTableFeatures,
    data: rows,
    columns,
    state: { sorting, columnFilters, columnVisibility, pagination },
    getRowId: (row) => row.phone_e164,
    autoResetPageIndex: false,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
  });

  const buyerFilter = (table.getColumn('verkocht')?.getFilterValue() as string | undefined) ?? ALL;
  const consentFilter = (table.getColumn('consent')?.getFilterValue() as string | undefined) ?? ALL;

  function setSelectFilter(columnId: string, value: string) {
    table.getColumn(columnId)?.setFilterValue(value === ALL ? undefined : value);
    table.setPageIndex(0);
  }

  const buyers = rows.filter((c) => c.sold_count > 0).length;
  const turnover = rows.reduce((total, c) => total + Number(c.total_value ?? 0), 0);
  const consent = rows.filter((c) => c.consent_marketing).length;
  const stats: [string, string | number][] = [
    [search ? 'Gevonden' : 'Klanten', rows.length],
    ['Kochten iets', buyers],
    ['Omzet', MONEY.format(turnover)],
    ['Mag gemaild worden', consent],
  ];

  return (
    <div className="kfc-neutral flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl leading-none font-medium tracking-tight">{t('Klanten')}</h1>
        <p className="text-muted-foreground text-sm">
          {t('Iedere klant één keer, herkend aan het telefoonnummer. Klik een naam voor alle aanvragen, klussen en auto’s.')}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([label, value]) => (
          <Card key={label} className="gap-1 py-4">
            <CardHeader className="px-4">
              <CardDescription>{t(label)}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums">{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card className="min-w-0">
        <CardHeader className="border-b has-data-[slot=card-action]:grid-cols-1 md:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
          <CardTitle className="text-xl leading-none">{t('Alle klanten')}</CardTitle>
          <CardDescription className="max-w-sm leading-snug">
            {t('De 200 klanten die het laatst van zich lieten horen. Zoek om er buiten die lijst een te vinden.')}
          </CardDescription>
          <CardAction className="col-start-1 row-start-auto flex w-full flex-wrap justify-start gap-2 justify-self-stretch md:col-start-2 md:row-span-2 md:row-start-1 md:w-auto md:flex-nowrap md:justify-end md:justify-self-end">
            {/*
             * One field, two jobs: typing narrows the rows already loaded,
             * submitting is the old plain GET to /admin/klanten, so ?q= keeps
             * running the same Supabase query and old links keep working.
             */}
            <form method="get" action="/admin/klanten" role="search" className="flex w-full gap-2 md:w-auto">
              <InputGroup className="h-8 w-full md:w-72">
                <InputGroupAddon align="inline-start">
                  <Search className="size-3.5" />
                </InputGroupAddon>
                <InputGroupInput
                  className="h-8"
                  type="search"
                  name="q"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    table.getColumn('search')?.setFilterValue(event.target.value || undefined);
                    table.setPageIndex(0);
                  }}
                  aria-label={t('Zoek klant')}
                  placeholder={t('Zoek op naam, telefoon, e-mail of postcode')}
                />
              </InputGroup>
              <Button type="submit" size="sm" variant="outline">{t('Zoeken')}</Button>
              {search && (
                <Button asChild size="sm" variant="ghost">
                  <Link href="/admin/klanten">{t('Wis')}</Link>
                </Button>
              )}
            </form>
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
          <div className="flex flex-wrap items-center gap-3 px-4">
            <Select value={buyerFilter} onValueChange={(value) => setSelectFilter('verkocht', value)}>
              <SelectTrigger size="sm">
                <span className="text-muted-foreground">{t('Verkocht')}:</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                <SelectGroup>
                  {[ALL, ...buyerOptions].map((option) => (
                    <SelectItem key={option} value={option}>{t(option)}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select value={consentFilter} onValueChange={(value) => setSelectFilter('consent', value)}>
              <SelectTrigger size="sm">
                <span className="text-muted-foreground">{t('Marketing')}:</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                <SelectGroup>
                  {[ALL, ...consentOptions].map((option) => (
                    <SelectItem key={option} value={option}>{t(option)}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <KlantenTable
            table={table}
            t={t}
            empty={t(search ? 'Geen klant gevonden met deze zoekterm.' : 'Nog geen klanten met een telefoonnummer.')}
          />
        </CardContent>
      </Card>
    </div>
  );
}
