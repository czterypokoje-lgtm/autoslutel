'use client';
import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import { cn } from 'cn';
import { MessageCircle, Phone } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { DataTableFeatures } from '@/lib/data-table-features';
import { getInitials } from '@/lib/utils';
import { waLink } from '@/lib/whatsapp';

import { buyerOf, consentOf, type CustomerRow, DATE, MONEY } from './data';

type T = (dutch: string) => string;

const UNKNOWN = 'Naam onbekend';
const displayName = (row: CustomerRow) => row.name ?? UNKNOWN;

/** The old list's greeting, unchanged: first name only, Autosleutel24 by name. */
const greet = (row: CustomerRow) => `Goedendag${row.name ? ` ${row.name.split(' ')[0]}` : ''}, hier Autosleutel24. `;

export function klantenColumns(t: T): ColumnDef<DataTableFeatures, CustomerRow>[] {
  return [
    {
      id: 'search',
      accessorFn: (row) => [row.name, row.phone_e164, row.email, row.postcode].filter(Boolean).join(' '),
      filterFn: 'includesString',
      enableHiding: true,
    },
    {
      id: 'name',
      accessorFn: (row) => displayName(row),
      header: t('Klant'),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar size="lg" className="font-medium">
            <AvatarFallback>{getInitials(displayName(row.original)).slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="max-w-[46vw] min-w-0 md:max-w-none">
            <Link
              href={`/admin/klanten/${encodeURIComponent(row.original.phone_e164)}`}
              className="text-foreground block truncate text-sm font-medium hover:underline"
            >
              {row.original.name ?? t(UNKNOWN)}
            </Link>
            <div className="text-muted-foreground truncate text-sm">
              {row.original.phone_e164}
              {row.original.postcode ? ` · ${row.original.postcode}` : ''}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'aanvragen',
      accessorFn: (row) => row.lead_count,
      header: () => <div className="text-right">{t('Aanvragen')}</div>,
      cell: ({ row }) => <div className="text-right tabular-nums">{row.original.lead_count}</div>,
    },
    {
      id: 'verkocht',
      accessorFn: (row) => buyerOf(row),
      header: () => <div className="text-right">{t('Verkocht')}</div>,
      filterFn: 'equalsString',
      cell: ({ row }) =>
        row.original.sold_count > 0 ? (
          <div className="text-right">
            <Badge className="border-emerald-500/20 bg-emerald-500/10 px-2 py-1 font-medium text-emerald-600 dark:text-emerald-400" variant="outline">
              {row.original.sold_count}
            </Badge>
          </div>
        ) : (
          <div className="text-muted-foreground text-right">—</div>
        ),
    },
    {
      id: 'omzet',
      accessorFn: (row) => Number(row.total_value ?? 0),
      header: () => <div className="text-right">{t('Omzet')}</div>,
      cell: ({ row }) => <div className="text-right tabular-nums">{MONEY.format(Number(row.original.total_value ?? 0))}</div>,
    },
    {
      id: 'consent',
      accessorFn: (row) => consentOf(row),
      header: t('Marketing'),
      filterFn: 'equalsString',
      cell: ({ row }) => {
        const yes = Boolean(row.original.consent_marketing);
        return (
          <Badge
            className={cn(
              'gap-1.5 border px-2 py-1 font-medium',
              yes
                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'border-border bg-muted text-muted-foreground',
            )}
            variant="outline"
          >
            <span className={cn('size-1.5 rounded-full', yes ? 'bg-emerald-500' : 'bg-muted-foreground')} />
            {t(yes ? 'Mag gemaild worden' : 'Geen toestemming')}
          </Badge>
        );
      },
    },
    {
      id: 'lastSeen',
      accessorFn: (row) => new Date(row.last_seen).getTime(),
      header: t('Laatst gezien'),
      cell: ({ row }) => <div className="text-foreground text-sm">{DATE.format(new Date(row.original.last_seen))}</div>,
    },
    {
      id: 'actions',
      header: () => <div className="text-right">{t('Acties')}</div>,
      // The old list offered exactly two: call, WhatsApp. No new destinations here.
      cell: ({ row }) => {
        const c = row.original;
        const wa = waLink(c.phone_e164, greet(c));
        const label = c.name ?? c.phone_e164;
        return (
          <div className="flex items-center justify-end gap-1">
            <Button asChild size="icon-sm" variant="ghost" className="text-muted-foreground hover:bg-muted/50 size-8 rounded-md">
              <a href={`tel:${c.phone_e164}`} aria-label={`${t('Bel')} ${label}`}><Phone className="size-4" /></a>
            </Button>
            {wa && (
              <Button asChild size="icon-sm" variant="ghost" className="text-muted-foreground hover:bg-muted/50 size-8 rounded-md">
                <a href={wa} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${label}`}><MessageCircle className="size-4" /></a>
              </Button>
            )}
          </div>
        );
      },
      enableHiding: false,
      enableSorting: false,
    },
  ];
}
