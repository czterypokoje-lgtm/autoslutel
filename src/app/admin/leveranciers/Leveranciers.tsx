'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Download, Search } from 'lucide-react';
import { PreviewText, usePreviewLanguage } from '@/app/admin/PreviewLanguage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Supplier, SupplierBalance } from '@/lib/kfcSuppliers';
import { SupplierDialog, money } from './shared';

type Row = Supplier & SupplierBalance;
const FILTERS: [string, string, (r: Row) => boolean][] = [
  ['active', 'Actief', (r) => r.active],
  ['open', 'Open saldo', (r) => r.open_cents !== 0],
  ['overdue', 'Vervallen', (r) => r.overdue_cents > 0],
  ['orders', 'Open inkooporders', (r) => r.open_pos > 0],
  ['late', 'Te laat geleverd', (r) => r.late_pos > 0],
  ['inactive', 'Inactief', (r) => !r.active],
  ['all', 'Alle', () => true],
];

export default function Leveranciers({ rows, initialQuery, initialFilter }: { rows: Row[]; initialQuery: string; initialFilter: string }) {
  const router = useRouter();
  const { t } = usePreviewLanguage();
  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState(FILTERS.some(([key]) => key === initialFilter) ? initialFilter : 'active');

  const visible = useMemo(() => {
    const test = FILTERS.find(([key]) => key === filter)![2];
    const needle = query.trim().toLowerCase();
    return rows.filter((r) => test(r) && (!needle || [r.name, r.city, r.kvk, r.vat_number, r.contact_name, r.email, r.customer_number]
      .some((value) => value?.toLowerCase().includes(needle))));
  }, [rows, filter, query]);
  const total = (key: 'open_cents' | 'overdue_cents' | 'on_order_cents') => visible.reduce((sum, r) => sum + r[key], 0);

  function exportCsv() {
    const head = ['Leverancier', 'KvK', 'Btw', 'Plaats', 'Land', 'Termijn', 'Open orders', 'Te laat', 'In bestelling (EUR)', 'Saldo (EUR)', 'Vervallen (EUR)', 'Laatste boeking'];
    const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const euro = (cents: number) => (cents / 100).toFixed(2).replace('.', ',');
    const lines = visible.map((r) => [r.name, r.kvk, r.vat_number, r.city, r.country, r.terms_days, r.open_pos, r.late_pos, euro(r.on_order_cents), euro(r.open_cents), euro(r.overdue_cents), r.last_entry].map(cell).join(';'));
    const blob = new Blob(['﻿' + [head.join(';'), ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `leveranciers-${new Date().toISOString().slice(0, 10)}.csv` });
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardHeader className="pb-1"><CardDescription><PreviewText>Te betalen (saldo)</PreviewText></CardDescription><CardTitle className="text-2xl tabular-nums">{money(rows.reduce((s, r) => s + r.open_cents, 0))}</CardTitle></CardHeader></Card>
        <Card className={rows.some((r) => r.overdue_cents > 0) ? 'border-destructive/50' : undefined}><CardHeader className="pb-1"><CardDescription><PreviewText>Vervallen</PreviewText></CardDescription><CardTitle className="text-2xl tabular-nums">{money(rows.reduce((s, r) => s + r.overdue_cents, 0))}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-1"><CardDescription><PreviewText>In bestelling</PreviewText></CardDescription><CardTitle className="text-2xl tabular-nums">{money(rows.reduce((s, r) => s + r.on_order_cents, 0))}</CardTitle></CardHeader>
          <CardContent className="text-muted-foreground text-xs">{rows.reduce((s, r) => s + r.open_pos, 0)} {t('open inkooporders')} · {rows.reduce((s, r) => s + r.late_pos, 0)} {t('te laat')}</CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input className="w-64 pl-8" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('Zoek naam, plaats, KvK, btw…')} aria-label={t('Zoeken')} />
          </div>
          <div className="flex flex-wrap gap-1 rounded-lg border p-1">
            {FILTERS.map(([key, label]) => (
              <Button key={key} size="sm" variant={filter === key ? 'default' : 'ghost'} onClick={() => setFilter(key)}>{t(label)}</Button>
            ))}
          </div>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCsv}><Download className="size-4" /> {t('Exporteren')}</Button>
            <SupplierDialog onSaved={(id) => router.push(`/admin/leveranciers/${id}`)} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><PreviewText>Leverancier</PreviewText></TableHead>
                <TableHead><PreviewText>Termijn</PreviewText></TableHead>
                <TableHead className="text-right"><PreviewText>Open orders</PreviewText></TableHead>
                <TableHead className="text-right"><PreviewText>In bestelling</PreviewText></TableHead>
                <TableHead className="text-right"><PreviewText>Saldo</PreviewText></TableHead>
                <TableHead className="text-right"><PreviewText>Vervallen</PreviewText></TableHead>
                <TableHead><PreviewText>Laatste order</PreviewText></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length === 0 && <TableRow><TableCell colSpan={7} className="text-muted-foreground py-10 text-center"><PreviewText>Geen leveranciers gevonden.</PreviewText></TableCell></TableRow>}
              {visible.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Link className="font-medium underline-offset-4 hover:underline" href={`/admin/leveranciers/${r.id}`}>{r.name}</Link>
                    {r.city && <span className="text-muted-foreground text-xs"> · {r.city}</span>}
                    {!r.active && <Badge variant="outline" className="ml-2">{t('Inactief')}</Badge>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{r.terms_days} {t('dagen')}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.open_pos || '—'}{r.late_pos > 0 && <Badge variant="destructive" className="ml-2">{r.late_pos} {t('te laat')}</Badge>}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.on_order_cents ? money(r.on_order_cents) : '—'}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{money(r.open_cents)}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.overdue_cents > 0 ? <Badge variant="destructive">{money(r.overdue_cents)}</Badge> : <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="text-muted-foreground">{r.last_order_at?.slice(0, 10) ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            {visible.length > 1 && (
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3}>{visible.length} {t('leveranciers')}</TableCell>
                  <TableCell className="text-right tabular-nums">{money(total('on_order_cents'))}</TableCell>
                  <TableCell className="text-right tabular-nums">{money(total('open_cents'))}</TableCell>
                  <TableCell className="text-right tabular-nums">{money(total('overdue_cents'))}</TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
