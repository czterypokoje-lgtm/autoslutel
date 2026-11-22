import Link from 'next/link';
import { notFound } from 'next/navigation';
import { WAREHOUSE } from '@/config/install';
import { CRM_PREVIEW } from '@/lib/supabase/env';
import { requireWarehouseUser, seesPrices } from '@/lib/crmSession';
import { openReturns, recentReturns } from '@/lib/kfcReturns';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const dynamic = 'force-dynamic';

const WHEN = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' });
const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const CONDITION = { new: 'Nieuw', opened: 'Geopend', defect: 'Defect, afgeschreven' } as const;

/** Refunds whose goods have not come back yet, and the returns booked lately. */
export default async function ReturnsPage() {
  if (!WAREHOUSE || CRM_PREVIEW) notFound();
  const user = await requireWarehouseUser('/admin/retouren');
  const [open, recent] = await Promise.all([openReturns(), recentReturns()]);
  const prices = seesPrices(user);
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Retouren</h1>
        <p className="text-muted-foreground text-sm">Terugbetaald in de webshop, nog niet terug op voorraad. Open de bestelling en kies &quot;Retour ontvangen&quot; zodra het pakket binnen is.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Retour verwacht</CardTitle>
          <CardDescription>{open.length ? `${open.length} bestelling(en), laatste 120 dagen` : 'Niets openstaand.'}</CardDescription>
        </CardHeader>
        {open.length > 0 && <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Bestelling</TableHead><TableHead>Terugbetaald</TableHead><TableHead>Regels</TableHead>{prices && <TableHead className="text-right">Bedrag</TableHead>}
            </TableRow></TableHeader>
            <TableBody>
              {open.map((row) => (
                <TableRow key={row.order_id}>
                  <TableCell><Link className="font-medium underline-offset-2 hover:underline" href={`/admin/bestellingen/${row.order_id}`}>#{row.number}</Link><span className="text-muted-foreground block text-xs">{row.shop}</span></TableCell>
                  <TableCell className="whitespace-nowrap text-sm">{row.refunded_at ? WHEN.format(new Date(row.refunded_at)) : '—'}</TableCell>
                  <TableCell className="text-sm">
                    {row.amount_only ? <Badge variant="outline">Alleen bedrag, geen regels</Badge> : row.lines.map((line) => (
                      <div key={line.sku + line.name}>{line.returned}/{line.refunded} × {line.sku || line.name}</div>
                    ))}
                  </TableCell>
                  {prices && <TableCell className="text-right tabular-nums">{MONEY.format(row.amount_cents / 100)}</TableCell>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>}
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Recent ontvangen</CardTitle></CardHeader>
        <CardContent className={recent.length ? 'p-0' : undefined}>
          {recent.length ? <Table>
            <TableHeader><TableRow><TableHead>Wanneer</TableHead><TableHead>Bestelling</TableHead><TableHead>Artikel</TableHead><TableHead className="text-right">Aantal</TableHead><TableHead>Staat</TableHead></TableRow></TableHeader>
            <TableBody>
              {recent.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap text-sm">{WHEN.format(new Date(row.created_at))}</TableCell>
                  <TableCell><Link className="underline-offset-2 hover:underline" href={`/admin/bestellingen/${row.order_id}`}>#{row.number}</Link> <span className="text-muted-foreground text-xs">{row.shop}</span></TableCell>
                  <TableCell className="text-sm">{row.sku || row.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.quantity}</TableCell>
                  <TableCell><Badge variant={row.condition === 'defect' ? 'destructive' : row.condition === 'opened' ? 'outline' : 'secondary'}>{CONDITION[row.condition]}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table> : <p className="text-muted-foreground text-sm">Nog geen retouren geboekt.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
