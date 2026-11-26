'use client';
import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import { cn } from 'cn';
import { CheckCircle, Mail, MoreHorizontal, Send } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { DataTableFeatures } from '@/lib/data-table-features';

import {
  bucketLabel, bucketMeta, carOf, dateFormatter, type InvoiceRow, invoiceBucket, invoiceDueDate, isOverdue, MONEY,
} from './data';

type T = (dutch: string) => string;

function StatusBadge({ row, t }: { row: InvoiceRow; t: T }) {
  const bucket = invoiceBucket(row);
  const meta = bucketMeta[bucket];
  return (
    <Badge className={cn('gap-1.5 border px-2 py-1 font-medium', meta.badgeClass)} variant="outline">
      <span className={cn('size-1.5 rounded-full', meta.dotClass)} />
      {t(bucketLabel[bucket])}
    </Badge>
  );
}

/**
 * Status changes and the delete-free actions for one row.
 *
 * The same two PATCH calls the old drawer made — `{ status }` to
 * /api/admin/invoices/<id> — followed by a refresh, because the list is
 * server-rendered (force-dynamic) and the row's own copy of the status is not
 * the source of truth.
 */
function RowActions({ row, t }: { row: InvoiceRow; t: T }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const [note, setNote] = React.useState('');

  /* Sends the PDF from the CRM (POST .../send), not the user's mail program. */
  async function sendByMail() {
    setBusy(true); setFailed(false); setNote('');
    try {
      const response = await fetch(`/api/admin/invoices/${row.id}/send`, { method: 'POST' });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error ?? String(response.status));
      setNote(`${t('Verstuurd naar')} ${body?.to ?? row.client_email}`);
      router.refresh();
    } catch (e) {
      setFailed(true); setNote(e instanceof Error ? e.message : '');
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(next: InvoiceRow['status']) {
    setBusy(true);
    setFailed(false);
    try {
      const response = await fetch(`/api/admin/invoices/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      if (!response.ok) throw new Error(String(response.status));
      router.refresh();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {note ? <span className={failed ? 'text-destructive text-xs' : 'text-muted-foreground text-xs'}>{note}</span> : failed && <span className="text-destructive text-xs">{t('Opslaan mislukt')}</span>}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label={`${t('Acties voor')} ${row.invoice_number}`}
            className="text-muted-foreground hover:bg-muted/50 size-8 rounded-md"
            disabled={busy}
            size="icon-sm"
            variant="ghost"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild><Link href={`/admin/facturen/${row.id}`}>{t('Factuur openen')}</Link></DropdownMenuItem>
          <DropdownMenuItem asChild><Link href={`/admin/facturen/${row.id}/bewerken`}>{t('Bewerken')}</Link></DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={row.status !== 'concept'} onSelect={() => void setStatus('verzonden')}>
            <Send /> {t('Verzonden')}
          </DropdownMenuItem>
          <DropdownMenuItem disabled={row.status === 'betaald'} onSelect={() => void setStatus('betaald')}>
            <CheckCircle /> {t('Betaald')}
          </DropdownMenuItem>
          {row.client_email && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled={busy} onSelect={() => void sendByMail()}><Mail /> {t('E-mail sturen')}</DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function invoicesColumns({ t, english, showTechnician }: { t: T; english: boolean; showTechnician: boolean }): ColumnDef<DataTableFeatures, InvoiceRow>[] {
  const DATE = dateFormatter(english);

  return [
    {
      id: 'search',
      accessorFn: (row) => [row.invoice_number, row.client_name, row.client_city].filter(Boolean).join(' '),
      filterFn: 'includesString',
      enableHiding: true,
    },
    {
      accessorKey: 'invoice_number',
      header: t('Nummer'),
      cell: ({ row }) => (
        <Link href={`/admin/facturen/${row.original.id}`} className="text-foreground text-sm font-medium tabular-nums hover:underline">
          {row.original.invoice_number}
        </Link>
      ),
    },
    {
      accessorKey: 'client_name',
      header: t('Klant'),
      cell: ({ row }) => (
        <div className="max-w-[40vw] min-w-0 md:max-w-none">
          <div className="truncate text-sm font-medium">{row.original.client_name}</div>
          <div className="text-muted-foreground truncate text-sm">{row.original.client_city || '—'}</div>
        </div>
      ),
    },
    {
      id: 'car',
      accessorFn: (row) => carOf(row) ?? '',
      header: t('Auto / klus'),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.original.logo} alt="" className="size-6 shrink-0 object-contain" />
          ) : null}
          <div className="min-w-0">
            <div className="truncate text-sm">{carOf(row.original) ?? t('Dienst')}</div>
            <div className="text-muted-foreground truncate text-xs">{row.original.job?.service_type || '—'}</div>
          </div>
        </div>
      ),
    },
    ...(showTechnician
      ? [{
        id: 'technician',
        accessorFn: (row: InvoiceRow) => row.technician_name ?? '',
        header: t('Monteur'),
        cell: ({ row }: { row: { original: InvoiceRow } }) => (
          <div className="text-sm">{row.original.technician_name ?? <span className="text-muted-foreground">—</span>}</div>
        ),
      } satisfies ColumnDef<DataTableFeatures, InvoiceRow>]
      : []),
    {
      id: 'total',
      accessorFn: (row) => Number(row.total) || 0,
      header: () => <div className="text-right">{t('Bedrag')}</div>,
      cell: ({ row }) => <div className="text-right text-sm tabular-nums">{MONEY.format(Number(row.original.total))}</div>,
    },
    {
      id: 'due',
      accessorFn: (row) => invoiceDueDate(row.issue_date).getTime(),
      header: t('Vervalt'),
      cell: ({ row }) => (
        <div className={cn('text-sm whitespace-nowrap', isOverdue(row.original) ? 'text-destructive' : 'text-muted-foreground')}>
          {DATE.format(invoiceDueDate(row.original.issue_date))}
        </div>
      ),
    },
    {
      id: 'status',
      accessorFn: (row) => invoiceBucket(row),
      header: 'Status',
      filterFn: 'equalsString',
      cell: ({ row }) => <StatusBadge row={row.original} t={t} />,
    },
    {
      id: 'actions',
      header: () => <div className="text-right">{t('Acties')}</div>,
      cell: ({ row }) => <RowActions row={row.original} t={t} />,
      enableHiding: false,
      enableSorting: false,
    },
  ];
}
