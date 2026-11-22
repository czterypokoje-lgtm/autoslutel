import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { BRAND, WAREHOUSE } from '@/config/install';
import { CRM_PREVIEW } from '@/lib/supabase/env';
import { requireCrmUser } from '@/lib/crmSession';
import { canUsePos, listClosedSessions, type ClosedSession } from '@/lib/kfcPos';

export const dynamic = 'force-dynamic';
export const metadata = { title: `Z-rapporten | ${BRAND.name}` };

const euro = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const diff = (cents: number | null) => (cents === null ? '—' : `${cents > 0 ? '+' : ''}${euro.format(cents / 100)}`);
const tone = (cents: number | null) => (cents ? 'text-destructive font-medium' : '');
const day = (iso: string) => new Date(iso).toLocaleString('nl-NL', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Amsterdam' });

/** Closed till sessions, newest first: Z-number, cashier and the differences per method. */
export default async function KassaSessiesPage({ searchParams }: { searchParams: Promise<{ pagina?: string }> }) {
  if (!WAREHOUSE || CRM_PREVIEW) notFound();
  const user = await requireCrmUser('/admin/kassa/sessies');
  if (!canUsePos(user)) redirect('/admin/geen-toegang');
  const page = Math.max(1, Number.parseInt((await searchParams).pagina ?? '1', 10) || 1);

  let sessions: ClosedSession[] = [];
  let more = false;
  let error = '';
  try {
    ({ sessions, more } = await listClosedSessions(page));
  } catch (cause) {
    error = cause instanceof Error ? cause.message : 'De Z-rapporten konden niet geladen worden.';
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Z-rapporten</h1>
          <p className="text-muted-foreground text-sm">Elke gesloten kassadag met zijn Z-nummer. Open een rapport om het opnieuw te bekijken of te printen.</p>
        </div>
        <Link href="/admin/kassa" className="text-sm underline underline-offset-4">Terug naar de kassa</Link>
      </div>
      {error && <p className="text-destructive text-sm" role="alert">{error}</p>}
      {!error && sessions.length === 0 && <p className="text-muted-foreground text-sm">Nog geen gesloten kassa.</p>}
      {sessions.length > 0 && (
        <>
          {/* phone: cards */}
          <ul className="grid gap-2 md:hidden">
            {sessions.map((s) => (
              <li key={s.id}>
                <Link href={`/admin/kassa/sessies/${s.id}`} className="hover:bg-muted grid min-h-11 gap-1 rounded-lg border p-3 text-sm">
                  <div className="flex justify-between font-medium"><span>Z {s.zNumber ?? '—'}</span><span>{day(s.closedAt)}</span></div>
                  <div className="text-muted-foreground">{s.cashier}</div>
                  <div className="flex justify-between">
                    <span>Contant <span className={tone(s.cashDifferenceCents)}>{diff(s.cashDifferenceCents)}</span></span>
                    <span>PIN <span className={tone(s.pinDifferenceCents)}>{diff(s.pinDifferenceCents)}</span></span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          {/* desktop: table */}
          <div className="hidden overflow-x-auto rounded-lg border md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">Z-nr.</th>
                  <th className="px-3 py-2 font-medium">Geopend</th>
                  <th className="px-3 py-2 font-medium">Gesloten</th>
                  <th className="px-3 py-2 font-medium">Kassier</th>
                  <th className="px-3 py-2 text-right font-medium">Netto omzet</th>
                  <th className="px-3 py-2 text-right font-medium">Verschil contant</th>
                  <th className="px-3 py-2 text-right font-medium">Verschil PIN</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="px-3 py-2 font-medium">{s.zNumber ?? '—'}</td>
                    <td className="px-3 py-2">{day(s.openedAt)}</td>
                    <td className="px-3 py-2">{day(s.closedAt)}</td>
                    <td className="px-3 py-2">{s.cashier}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{s.netTotalCents === null ? '—' : euro.format(s.netTotalCents / 100)}</td>
                    <td className={`px-3 py-2 text-right tabular-nums ${tone(s.cashDifferenceCents)}`}>{diff(s.cashDifferenceCents)}</td>
                    <td className={`px-3 py-2 text-right tabular-nums ${tone(s.pinDifferenceCents)}`}>{diff(s.pinDifferenceCents)}</td>
                    <td className="px-3 py-2 text-right"><Link href={`/admin/kassa/sessies/${s.id}`} className="underline underline-offset-4">Bekijken</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between text-sm">
            {page > 1 ? <Link href={`/admin/kassa/sessies?pagina=${page - 1}`} className="underline underline-offset-4">Nieuwere</Link> : <span />}
            {more && <Link href={`/admin/kassa/sessies?pagina=${page + 1}`} className="underline underline-offset-4">Oudere</Link>}
          </div>
        </>
      )}
    </>
  );
}
