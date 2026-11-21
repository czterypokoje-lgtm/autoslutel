import Link from 'next/link';
import { Building2, Plus, Receipt, Wrench } from 'lucide-react';
import { cn } from 'cn';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PreviewShortDate, PreviewText } from '@/app/admin/PreviewLanguage';
import { EXPENSE_CATEGORIES } from '@/lib/expenseCaption';

import type { ExpenseRow } from '../ExpenseActions';
import { StudioExpenseActions } from './expense-actions';

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

/** The list row: the stored expense plus the two joins and the signed bon link. */
export interface StudioExpense extends ExpenseRow {
  purchase_order_id: string | null;
  technician_name: string | null;
  receipt_href: string | null;
}

const STATUS: Record<string, { label: string; className: string; dotClass: string }> = {
  pending: { label: 'Te keuren', className: 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400', dotClass: 'bg-amber-500' },
  approved: { label: 'Goedgekeurd', className: 'border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400', dotClass: 'bg-sky-500' },
  paid: { label: 'Betaald', className: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', dotClass: 'bg-emerald-500' },
  rejected: { label: 'Afgewezen', className: 'border-destructive/20 bg-destructive/10 text-destructive', dotClass: 'bg-destructive' },
};

/**
 * Studio look of the uitgaven list. Server component: the rows, the signed bon
 * links and the office/monteur split are all decided on the page, exactly as
 * before — only the markup is new.
 */
export function Expenses({ rows, isOffice }: { rows: StudioExpense[]; isOffice: boolean }) {
  const sumOf = (status: string) => rows.filter((e) => e.status === status).reduce((total, e) => total + Number(e.amount || 0), 0);
  const countOf = (status: string) => rows.filter((e) => e.status === status).length;

  return (
    <div className="kfc-neutral flex flex-col gap-4 md:gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl leading-none font-medium tracking-tight">
            <PreviewText>{isOffice ? 'Uitgaven' : 'Mijn uitgaven'}</PreviewText>
          </h1>
          <p className="text-muted-foreground text-sm">
            <PreviewText>
              {isOffice
                ? 'Bonnetjes, abonnementen en declaraties. Keur goed of wijs af; bonnetjes van monteurs komen ook via Telegram binnen.'
                : 'Stuur je bonnetjes in en zie of ze zijn goedgekeurd en betaald. Een foto via Telegram werkt ook.'}
            </PreviewText>
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/uitgaven/nieuw"><Plus data-icon="inline-start" /><PreviewText>Nieuwe uitgave</PreviewText></Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="Te keuren"
          value={MONEY.format(sumOf('pending'))}
          note={countOf('pending')}
          highlight={countOf('pending') > 0}
        />
        <Stat label="Goedgekeurd, nog te betalen" value={MONEY.format(sumOf('approved'))} note={countOf('approved')} />
        <Stat label="Betaald" value={MONEY.format(sumOf('paid'))} note={countOf('paid')} />
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-xl leading-none"><PreviewText>Uitgaven</PreviewText></CardTitle>
          <CardDescription className="max-w-sm leading-snug">
            <PreviewText>Alle bonnetjes en kosten, nieuwste eerst.</PreviewText>
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {/* Its own scroller: the page body must never scroll sideways on a phone. */}
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader className="[&_tr]:border-t">
                <TableRow>
                  <TableHead className="py-4 font-normal"><PreviewText>Categorie</PreviewText></TableHead>
                  <TableHead className="py-4 font-normal"><PreviewText>Datum</PreviewText></TableHead>
                  <TableHead className="py-4 font-normal"><PreviewText>Omschrijving</PreviewText></TableHead>
                  <TableHead className="py-4 font-normal"><PreviewText>Wie</PreviewText></TableHead>
                  <TableHead className="py-4 text-right font-normal">Bedrag</TableHead>
                  <TableHead className="py-4 font-normal">Status</TableHead>
                  {isOffice && <TableHead className="py-4 text-right font-normal"><PreviewText>Acties</PreviewText></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isOffice ? 7 : 6} className="h-24 text-center">
                      <PreviewText>Nog geen uitgaven geregistreerd.</PreviewText>
                    </TableCell>
                  </TableRow>
                ) : rows.map((expense) => {
                  const status = STATUS[expense.status] ?? { label: expense.status, className: 'border-border bg-muted/40 text-muted-foreground', dotClass: 'bg-muted-foreground' };
                  return (
                    <TableRow key={expense.id} className="border-border/60">
                      <TableCell className="py-4 align-middle">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium whitespace-nowrap">
                            <PreviewText>{EXPENSE_CATEGORIES[expense.category] || expense.category}</PreviewText>
                          </span>
                          {expense.is_reimbursable && <Badge variant="outline"><PreviewText>Declaratie</PreviewText></Badge>}
                        </div>
                        {expense.supplier_name && <div className="text-muted-foreground text-xs">{expense.supplier_name}</div>}
                      </TableCell>
                      <TableCell className="text-muted-foreground py-4 align-middle text-sm whitespace-nowrap">
                        <PreviewShortDate iso={expense.date_incurred} />
                      </TableCell>
                      <TableCell className="py-4 align-middle">
                        <div className="max-w-[48vw] truncate text-sm md:max-w-xs">
                          <PreviewText>{expense.description}</PreviewText>
                          {expense.purchase_order_id && <Link className="block underline" href={'/admin/inkoop#purchase-'+expense.purchase_order_id}><PreviewText>Inkooporder</PreviewText></Link>}
                        </div>
                        {expense.receipt_href && (
                          <a
                            href={expense.receipt_href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground inline-flex items-center gap-1 text-xs underline-offset-4 hover:underline"
                          >
                            <Receipt className="size-3.5" /> Bon bekijken
                          </a>
                        )}
                      </TableCell>
                      <TableCell className="py-4 align-middle text-sm whitespace-nowrap">
                        {expense.technician_name ? (
                          <span className="inline-flex items-center gap-1.5"><Wrench className="size-3.5" /> {expense.technician_name}</span>
                        ) : isOffice ? (
                          <span className="inline-flex items-center gap-1.5"><Building2 className="size-3.5" /> <PreviewText>Kantoor</PreviewText></span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-4 text-right align-middle text-sm tabular-nums">{MONEY.format(Number(expense.amount))}</TableCell>
                      <TableCell className="py-4 align-middle">
                        <Badge className={cn('gap-1.5 border px-2 py-1 font-medium', status.className)} variant="outline">
                          <span className={cn('size-1.5 rounded-full', status.dotClass)} />
                          <PreviewText>{status.label}</PreviewText>
                        </Badge>
                      </TableCell>
                      {/* Whatever the status: an approved expense with a wrong amount must still be correctable. */}
                      {isOffice && (
                        <TableCell className="py-4 text-right align-middle">
                          <StudioExpenseActions expense={expense} />
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value, note, highlight }: { label: string; value: string; note: number; highlight?: boolean }) {
  return (
    <Card className="gap-1 py-4">
      <CardContent className="flex flex-col gap-1 px-4">
        <span className="text-muted-foreground text-sm"><PreviewText>{label}</PreviewText></span>
        <b className={cn('text-2xl leading-none font-medium tabular-nums', highlight && 'text-amber-600 dark:text-amber-400')}>{value}</b>
        <span className="text-muted-foreground text-xs">{note} <PreviewText>bonnetjes</PreviewText></span>
      </CardContent>
    </Card>
  );
}
