'use client';
import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import { Subscribe } from '@tanstack/react-table';
import { cn } from 'cn';
import { Check, Clock, MoreHorizontal, X } from 'lucide-react';

import { Avatar, AvatarBadge, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { DataTableFeatures } from '@/lib/data-table-features';
import { getInitials } from '@/lib/utils';

import { type CustomerRow, customerStatus, DATE, daysSince, MONEY, statusMeta } from './data';

type T = (dutch: string) => string;

function StatusBadge({ row, t }: { row: CustomerRow; t: T }) {
  const status = customerStatus(row);
  const meta = statusMeta[status];
  return (
    <Badge className={cn('gap-1.5 border px-2 py-1 font-medium', meta.badgeClass)} variant="outline">
      <span className={cn('size-1.5 rounded-full', meta.dotClass)} />
      {t(status)}
    </Badge>
  );
}

function getAvatarTone(name: string) {
  const tones = [
    '[&_[data-slot=avatar-fallback]]:bg-amber-100 [&_[data-slot=avatar-fallback]]:text-amber-700 after:border-amber-200 dark:[&_[data-slot=avatar-fallback]]:bg-amber-500/15 dark:[&_[data-slot=avatar-fallback]]:text-amber-300 dark:after:border-amber-500/20',
    '[&_[data-slot=avatar-fallback]]:bg-orange-100 [&_[data-slot=avatar-fallback]]:text-orange-700 after:border-orange-200 dark:[&_[data-slot=avatar-fallback]]:bg-orange-500/15 dark:[&_[data-slot=avatar-fallback]]:text-orange-300 dark:after:border-orange-500/20',
    '[&_[data-slot=avatar-fallback]]:bg-rose-100 [&_[data-slot=avatar-fallback]]:text-rose-700 after:border-rose-200 dark:[&_[data-slot=avatar-fallback]]:bg-rose-500/15 dark:[&_[data-slot=avatar-fallback]]:text-rose-300 dark:after:border-rose-500/20',
    '[&_[data-slot=avatar-fallback]]:bg-pink-100 [&_[data-slot=avatar-fallback]]:text-pink-700 after:border-pink-200 dark:[&_[data-slot=avatar-fallback]]:bg-pink-500/15 dark:[&_[data-slot=avatar-fallback]]:text-pink-300 dark:after:border-pink-500/20',
    '[&_[data-slot=avatar-fallback]]:bg-fuchsia-100 [&_[data-slot=avatar-fallback]]:text-fuchsia-700 after:border-fuchsia-200 dark:[&_[data-slot=avatar-fallback]]:bg-fuchsia-500/15 dark:[&_[data-slot=avatar-fallback]]:text-fuchsia-300 dark:after:border-fuchsia-500/20',
    '[&_[data-slot=avatar-fallback]]:bg-purple-100 [&_[data-slot=avatar-fallback]]:text-purple-700 after:border-purple-200 dark:[&_[data-slot=avatar-fallback]]:bg-purple-500/15 dark:[&_[data-slot=avatar-fallback]]:text-purple-300 dark:after:border-purple-500/20',
    '[&_[data-slot=avatar-fallback]]:bg-violet-100 [&_[data-slot=avatar-fallback]]:text-violet-700 after:border-violet-200 dark:[&_[data-slot=avatar-fallback]]:bg-violet-500/15 dark:[&_[data-slot=avatar-fallback]]:text-violet-300 dark:after:border-violet-500/20',
    '[&_[data-slot=avatar-fallback]]:bg-indigo-100 [&_[data-slot=avatar-fallback]]:text-indigo-700 after:border-indigo-200 dark:[&_[data-slot=avatar-fallback]]:bg-indigo-500/15 dark:[&_[data-slot=avatar-fallback]]:text-indigo-300 dark:after:border-indigo-500/20',
    '[&_[data-slot=avatar-fallback]]:bg-sky-100 [&_[data-slot=avatar-fallback]]:text-sky-700 after:border-sky-200 dark:[&_[data-slot=avatar-fallback]]:bg-sky-500/15 dark:[&_[data-slot=avatar-fallback]]:text-sky-300 dark:after:border-sky-500/20',
    '[&_[data-slot=avatar-fallback]]:bg-emerald-100 [&_[data-slot=avatar-fallback]]:text-emerald-700 after:border-emerald-200 dark:[&_[data-slot=avatar-fallback]]:bg-emerald-500/15 dark:[&_[data-slot=avatar-fallback]]:text-emerald-300 dark:after:border-emerald-500/20',
  ];
  return tones[name.length % tones.length];
}

/* The dot on the avatar: how recently the account had a booking. */
function getActivityBadge(lastEntry: string | null) {
  const days = daysSince(lastEntry);
  if (days === null) return { className: 'bg-muted-foreground text-muted', icon: X };
  if (days < 7) return { className: 'bg-green-600 text-green-950 [&>svg]:text-white', icon: Check };
  if (days < 30) return { className: 'bg-amber-500 text-amber-950', icon: Clock };
  if (days < 90) return { className: 'bg-destructive', icon: null };
  return { className: 'bg-muted-foreground text-muted', icon: X };
}

function AvatarCell({ name, lastEntry }: { name: string; lastEntry: string | null }) {
  const badge = getActivityBadge(lastEntry);
  const BadgeIcon = badge.icon;
  return (
    <Avatar size="lg" className={cn('font-medium', getAvatarTone(name))}>
      <AvatarFallback>{getInitials(name).slice(0, 2)}</AvatarFallback>
      <AvatarBadge className={badge.className}>{BadgeIcon ? <BadgeIcon /> : null}</AvatarBadge>
    </Avatar>
  );
}

function Money({ cents, muted }: { cents: number; muted?: boolean }) {
  if (muted && cents === 0) return <span className="text-muted-foreground">—</span>;
  return <span className="tabular-nums">{MONEY.format(cents / 100)}</span>;
}

export function customersColumns(t: T): ColumnDef<DataTableFeatures, CustomerRow>[] {
  return [
    {
      id: 'select',
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Subscribe
            source={table.atoms.rowSelection}
            selector={() =>
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected() && 'indeterminate')
            }
          >
            {(checked) => (
              <Checkbox
                aria-label={t('Alle klanten selecteren')}
                checked={checked}
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
              />
            )}
          </Subscribe>
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Subscribe source={row.table.atoms.rowSelection} selector={(selection) => Boolean(selection?.[row.id])}>
            {(checked) => (
              <Checkbox
                aria-label={`${t('Selecteer')} ${row.original.company}`}
                checked={checked}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
              />
            )}
          </Subscribe>
        </div>
      ),
      enableHiding: false,
      enableSorting: false,
    },
    {
      id: 'search',
      accessorFn: (row) => [row.company, row.contact_name, row.email, row.city, row.phone].filter(Boolean).join(' '),
      filterFn: 'includesString',
      enableHiding: true,
    },
    {
      accessorKey: 'company',
      header: t('Klant'),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <AvatarCell name={row.original.company} lastEntry={row.original.last_entry} />
          <div className="max-w-[36vw] min-w-0 md:max-w-none">
            <Link href={`/admin/klanten/${row.original.id}`} className="text-foreground block truncate text-sm font-medium hover:underline">
              {row.original.company}
            </Link>
            <div className="text-muted-foreground truncate text-sm">{row.original.email ?? row.original.contact_name ?? row.original.phone ?? '—'}</div>
          </div>
        </div>
      ),
    },
    {
      id: 'terms',
      accessorFn: (row) => String(row.terms_days),
      header: t('Termijn / Plaats'),
      filterFn: 'equalsString',
      cell: ({ row }) => (
        <div className="grid gap-0.5">
          <span className="whitespace-nowrap">{row.original.terms_days} {t('dagen')}</span>
          <span className="text-muted-foreground text-xs">{[row.original.city, row.original.country !== 'NL' ? row.original.country : null].filter(Boolean).join(' · ') || '—'}</span>
        </div>
      ),
    },
    {
      accessorKey: 'country',
      header: t('Land'),
      filterFn: 'equalsString',
      cell: ({ row }) => <div className="text-sm">{row.original.country}</div>,
    },
    {
      accessorKey: 'open_cents',
      header: () => <div className="text-right">{t('Open')}</div>,
      cell: ({ row }) => <div className="text-right"><Money cents={row.original.open_cents} muted /></div>,
    },
    {
      accessorKey: 'overdue_cents',
      header: () => <div className="text-right">{t('Vervallen')}</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <Money cents={row.original.overdue_cents} muted />
          {row.original.oldest_overdue && <div className="text-muted-foreground text-xs">{t('sinds')} {DATE.format(new Date(row.original.oldest_overdue))}</div>}
        </div>
      ),
    },
    {
      id: 'status',
      accessorFn: (row) => customerStatus(row),
      header: t('Status'),
      filterFn: 'equalsString',
      cell: ({ row }) => <StatusBadge row={row.original} t={t} />,
    },
    {
      id: 'lastEntry',
      accessorFn: (row) => (row.last_entry ? new Date(row.last_entry).getTime() : 0),
      header: t('Laatste boeking'),
      cell: ({ row }) => (
        <div className="text-foreground text-sm">{row.original.last_entry ? DATE.format(new Date(row.original.last_entry)) : <span className="text-muted-foreground">—</span>}</div>
      ),
    },
    {
      id: 'actions',
      header: () => <div className="text-right">{t('Acties')}</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label={`${t('Acties voor')} ${row.original.company}`}
                className="text-muted-foreground hover:bg-muted/50 size-8 rounded-md"
                size="icon-sm"
                variant="ghost"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild><Link href={`/admin/klanten/${row.original.id}`}>{t('Klantkaart openen')}</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href={`/admin/facturen/nieuw?klant=${row.original.id}`}>{t('Nieuwe factuur')}</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href={`/admin/klanten/${row.original.id}/ekstre`}>{t('Rekeningoverzicht')}</Link></DropdownMenuItem>
              {row.original.email && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild><a href={`mailto:${row.original.email}`}>{t('E-mail sturen')}</a></DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
      enableHiding: false,
      enableSorting: false,
    },
  ];
}
