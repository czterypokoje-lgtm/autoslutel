import Link from 'next/link';
import { PreviewText } from '@/app/admin/PreviewLanguage';
import { BRAND } from '@/config/install';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  gtinStatus, hasIssue, ISSUES, loadArticles, loadDuplicateBarcodes, type Issue, type MasterArticle,
} from '@/lib/kfcProductMaster';
import { requireMasterDataUser } from '../access';

export const dynamic = 'force-dynamic';
export const metadata = { title: `Datakwaliteit | ${BRAND.name}` };

const INFO: Record<Issue, { title: string; why: string }> = {
  no_barcode: { title: 'Zonder barcode', why: 'Niet te scannen bij ontvangst, telling of kassa.' },
  duplicate_barcode: { title: 'Dubbele barcode', why: 'Eén barcode op meerdere artikelen: een scan kiest willekeurig. Niets wordt automatisch verwijderd.' },
  invalid_barcode: { title: 'Ongeldige barcode', why: 'Een EAN/GTIN met een fout controlecijfer: waarschijnlijk een typefout.' },
  no_category: { title: 'Zonder categorie', why: 'Valt buiten rapporten per categorie en krijgt geen standaardmarge of btw.' },
  no_price: { title: 'Zonder verkoopprijs', why: 'Kan niet verkocht of gewaardeerd worden.' },
  no_purchase_price: { title: 'Zonder inkoopprijs', why: 'Marge en voorraadwaarde kloppen niet.' },
  negative_stock: { title: 'Negatieve voorraad', why: 'Meer verkocht dan geteld: tellen of ontvangst ontbreekt.' },
};
const LIMIT = 200;
const money = (cents: number | null) => (cents === null ? '—' : new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100));

export default async function KwaliteitPage({ searchParams }: { searchParams: Promise<{ issue?: string }> }) {
  await requireMasterDataUser('/admin/artikelbeheer/kwaliteit');
  const params = await searchParams;
  const issue = (ISSUES as readonly string[]).includes(params.issue ?? '') ? (params.issue as Issue) : null;
  let articles: MasterArticle[] = [];
  let duplicates: Awaited<ReturnType<typeof loadDuplicateBarcodes>> = [];
  let error = '';
  try {
    [articles, duplicates] = await Promise.all([loadArticles(), loadDuplicateBarcodes()]);
  } catch (cause) {
    error = cause instanceof Error ? cause.message : 'Laden mislukt.';
  }
  const counts = Object.fromEntries(ISSUES.map((key) => [key, articles.filter((a) => hasIssue(a, key)).length])) as Record<Issue, number>;
  const clean = articles.filter((a) => ISSUES.every((key) => !hasIssue(a, key))).length;
  const list = issue ? articles.filter((a) => hasIssue(a, issue)) : [];
  const nameOf = new Map(articles.map((a) => [a.code, a.name]));

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight"><PreviewText>Datakwaliteit</PreviewText></h1>
        <p className="text-muted-foreground text-sm">
          <PreviewText>Artikelen die aandacht nodig hebben voordat voorraad, inkoop en kassa erop draaien. Uitlopende artikelen tellen niet mee voor barcode en prijzen.</PreviewText>
        </p>
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader><CardDescription><PreviewText>Artikelen</PreviewText></CardDescription><CardTitle className="text-3xl tabular-nums">{articles.length}</CardTitle></CardHeader>
          <CardContent className="text-muted-foreground text-sm">{clean} <PreviewText>zonder opmerkingen</PreviewText></CardContent>
        </Card>
        {ISSUES.map((key) => (
          <Link key={key} href={`/admin/artikelbeheer/kwaliteit?issue=${key}`} className="block">
            <Card className={issue === key ? 'ring-primary ring-2' : 'hover:bg-muted/40'}>
              <CardHeader>
                <CardDescription><PreviewText>{INFO[key].title}</PreviewText></CardDescription>
                <CardTitle className={`text-3xl tabular-nums ${counts[key] ? '' : 'text-emerald-700'}`}>{counts[key]}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm"><PreviewText>{INFO[key].why}</PreviewText></CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {issue && (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle><PreviewText>{INFO[issue].title}</PreviewText> <span className="text-muted-foreground text-sm font-normal">({list.length})</span></CardTitle>
              {list.length > LIMIT && <CardDescription>{`${LIMIT} / ${list.length}`}</CardDescription>}
            </div>
            <Button asChild size="sm"><Link href={`/admin/artikelbeheer/bulk?issue=${issue}`}><PreviewText>Oplossen in bulk bewerken</PreviewText></Link></Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><PreviewText>Code</PreviewText></TableHead>
                  <TableHead><PreviewText>Naam</PreviewText></TableHead>
                  <TableHead><PreviewText>SKU</PreviewText></TableHead>
                  <TableHead><PreviewText>Barcodes</PreviewText></TableHead>
                  <TableHead className="text-right"><PreviewText>Verkoop</PreviewText></TableHead>
                  <TableHead className="text-right"><PreviewText>Inkoop</PreviewText></TableHead>
                  <TableHead className="text-right"><PreviewText>Voorraad</PreviewText></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.slice(0, LIMIT).map((a) => (
                  <TableRow key={a.code}>
                    <TableCell className="font-mono text-xs">{a.code}</TableCell>
                    <TableCell className="max-w-80 truncate">{a.name}</TableCell>
                    <TableCell>{a.sku || '—'}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {a.ean.length ? a.ean.map((e) => <span key={e} className={gtinStatus(e) === 'invalid' ? 'text-destructive mr-2' : 'mr-2'}>{e}</span>) : '—'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{money(a.sale_price_cents)}</TableCell>
                    <TableCell className="text-right tabular-nums">{money(a.purchase_price_cents)}</TableCell>
                    <TableCell className={`text-right tabular-nums ${a.physical < 0 ? 'text-destructive font-medium' : ''}`}>{a.physical}</TableCell>
                  </TableRow>
                ))}
                {list.length === 0 && <TableRow><TableCell colSpan={7} className="text-muted-foreground py-6 text-center"><PreviewText>Niets te doen.</PreviewText></TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {(issue === 'duplicate_barcode' || (!issue && duplicates.length > 0)) && (
        <Card>
          <CardHeader>
            <CardTitle><PreviewText>Dubbele barcodes</PreviewText> <span className="text-muted-foreground text-sm font-normal">({duplicates.length})</span></CardTitle>
            <CardDescription><PreviewText>Haal de barcode weg bij het artikel waar hij niet hoort (bulk bewerken). Gebruikte onderdelen met serienummer mogen de barcode van het nieuwe product delen en staan hier niet.</PreviewText></CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><PreviewText>Barcode</PreviewText></TableHead>
                  <TableHead><PreviewText>Artikelen</PreviewText></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {duplicates.slice(0, LIMIT).map((d) => (
                  <TableRow key={d.barcode}>
                    <TableCell className="font-mono text-xs">{d.barcode}</TableCell>
                    <TableCell className="grid gap-1">
                      {d.codes.map((code) => <span key={code}><Badge variant="outline" className="font-mono">{code}</Badge> {nameOf.get(code) ?? ''}</span>)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
}
