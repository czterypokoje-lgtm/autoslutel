import Link from 'next/link';
import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { STUDIO_UI } from '@/config/install';
import styles from '../klanten/klanten.module.css';
import { PageHead, HelpSteps } from '../_ui';
import k from './kas.module.css';
import PayoutActions from './PayoutActions';
import StudioPayoutActions from './StudioPayoutActions';
import { PreviewText } from '../PreviewLanguage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const dynamic = 'force-dynamic';

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

export default async function KasPage() {
  await requireOfficeUser('/admin/kas');

  const supabase = await createSupabaseServerClient();
  const [{ data, error }, { data: pendingPayouts }] = await Promise.all([
    supabase.from('crm_technician_balance').select('*').order('saldo', { ascending: false }),
    supabase
      .from('payout_requests')
      .select('id, amount, created_at, technician_id')
      .eq('status', 'pending')
      .order('created_at', { ascending: true }),
  ]);

  if (error) {
    const missing = /does not exist|relation|permission denied/i.test(error.message);
    return (
      <div className={styles.warning}>
        De saldi konden niet worden geladen: {error.message}
        {missing && (
          <>
            <br />
            Voer <code>supabase/migrations/0007_payments_ledger.sql</code> uit.
          </>
        )}
      </div>
    );
  }

  const rows = data ?? [];
  const nameOf = new Map(rows.map((r) => [r.technician_id as string, r.name as string]));
  const owedToUs = rows
    .filter((r) => Number(r.saldo) > 0)
    .reduce((sum, r) => sum + Number(r.saldo), 0);
  const owedByUs = rows
    .filter((r) => Number(r.saldo) < 0)
    .reduce((sum, r) => sum - Number(r.saldo), 0);

  const pending = pendingPayouts ?? [];
  const pendingSum = pending.reduce((t, p) => t + Number(p.amount), 0);

  if (STUDIO_UI) {
    return (
      <div className="kfc-neutral flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl leading-none font-medium tracking-tight"><PreviewText>Kas &amp; uitbetalingen</PreviewText></h1>
          <p className="text-muted-foreground text-sm">
            <PreviewText>Wie heeft nog geld van klanten, en wie moet er nog betaald worden. Klik een monteur voor het logboek.</PreviewText>
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className={owedToUs > 0 ? 'border-amber-300 dark:border-amber-500/40' : undefined}>
            <CardContent className="flex flex-col gap-1 pt-6">
              <span className="text-muted-foreground text-sm"><PreviewText>Nog bij monteurs</PreviewText></span>
              <span className="text-2xl font-semibold">{MONEY.format(owedToUs)}</span>
              <span className="text-muted-foreground text-xs"><PreviewText>contant of pin geïnd, nog niet afgedragen</PreviewText></span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col gap-1 pt-6">
              <span className="text-muted-foreground text-sm"><PreviewText>Nog uit te betalen</PreviewText></span>
              <span className="text-2xl font-semibold">{MONEY.format(owedByUs)}</span>
              <span className="text-muted-foreground text-xs"><PreviewText>verdiend door monteurs</PreviewText></span>
            </CardContent>
          </Card>
          <Card className={pending.length ? 'border-primary/40' : undefined}>
            <CardContent className="flex flex-col gap-1 pt-6">
              <span className="text-muted-foreground text-sm"><PreviewText>Uitbetalingsverzoeken</PreviewText></span>
              <span className="text-2xl font-semibold">{pending.length}</span>
              <span className="text-muted-foreground text-xs">
                {pending.length ? <PreviewText>{`${MONEY.format(pendingSum)} aangevraagd`}</PreviewText> : <PreviewText>geen open verzoeken</PreviewText>}
              </span>
            </CardContent>
          </Card>
        </div>

        {pending.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle><PreviewText>Uitbetalingsverzoeken</PreviewText></CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {pending.map((payout) => (
                <div key={payout.id} className="flex flex-wrap items-center justify-between gap-3 border-t pt-3 first:border-t-0 first:pt-0">
                  <div className="flex flex-col">
                    <span className="font-medium">{nameOf.get(payout.technician_id) ?? <PreviewText>Onbekend</PreviewText>}</span>
                    <span className="text-muted-foreground text-xs">
                      <PreviewText>{`aangevraagd ${new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', timeZone: 'Europe/Amsterdam' }).format(new Date(payout.created_at))}`}</PreviewText>
                    </span>
                  </div>
                  <span className="font-semibold">{MONEY.format(Number(payout.amount))}</span>
                  <StudioPayoutActions id={payout.id} />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="overflow-x-auto pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><PreviewText>Monteur</PreviewText></TableHead>
                  <TableHead className="text-right"><PreviewText>Geïnd</PreviewText></TableHead>
                  <TableHead className="text-right"><PreviewText>Afgedragen</PreviewText></TableHead>
                  <TableHead className="text-right"><PreviewText>Verdiend</PreviewText></TableHead>
                  <TableHead className="text-right"><PreviewText>Uitbetaald</PreviewText></TableHead>
                  <TableHead className="text-right"><PreviewText>Saldo</PreviewText></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-muted-foreground"><PreviewText>Nog geen monteurs.</PreviewText></TableCell>
                  </TableRow>
                )}
                {rows.map((r) => {
                  const saldo = Number(r.saldo ?? 0);
                  return (
                    <TableRow key={r.technician_id as string} className="relative">
                      <TableCell>
                        <Link
                          href={`/admin/kas/${r.technician_id as string}`}
                          className="flex flex-col after:absolute after:inset-0"
                        >
                          <span className="font-medium">{r.name as string}</span>
                          <span className="text-muted-foreground text-xs">
                            {r.employment_type === 'zzp' ? 'ZZP' : <PreviewText>Loondienst</PreviewText>} · {(r.iban as string) ?? <PreviewText>geen IBAN</PreviewText>}
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell className="text-right">{MONEY.format(Number(r.totaal_geind ?? 0))}</TableCell>
                      <TableCell className="text-right">{MONEY.format(Number(r.totaal_afgedragen ?? 0))}</TableCell>
                      <TableCell className="text-right">{MONEY.format(Number(r.totaal_verdiend ?? 0))}</TableCell>
                      <TableCell className="text-right">{MONEY.format(Number(r.totaal_uitbetaald ?? 0))}</TableCell>
                      <TableCell className="text-right">
                        {saldo > 0 ? (
                          <span className="text-amber-700 dark:text-amber-400"><PreviewText>{`moet ${MONEY.format(saldo)} afdragen`}</PreviewText></span>
                        ) : saldo < 0 ? (
                          <span className="text-emerald-700 dark:text-emerald-400"><PreviewText>{`krijgt ${MONEY.format(-saldo)}`}</PreviewText></span>
                        ) : (
                          <span className="text-muted-foreground"><PreviewText>niets open</PreviewText></span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <p className="text-muted-foreground text-sm">
          <PreviewText>
            Moet afdragen: de monteur heeft contant of pin van klanten geïnd dat nog bij hem is. Krijgt: het bedrijf moet de
            monteur nog betalen voor zijn klussen. Tikkie, iDEAL, bank en factuur gaan rechtstreeks naar het bedrijf en raken
            het saldo niet.
          </PreviewText>
        </p>
      </div>
    );
  }

  return (
    <>
      <PageHead
        title="Kas & uitbetalingen"
        sub="Wie heeft nog geld van klanten, en wie moet er nog betaald worden. Klik een monteur voor het logboek."
      />

      <div className={k.stats}>
        <div className={owedToUs > 0 ? k.statWarn : undefined}>
          <span>Nog bij monteurs</span>
          <b>{MONEY.format(owedToUs)}</b>
          <small>contant of pin geïnd, nog niet afgedragen</small>
        </div>
        <div>
          <span>Nog uit te betalen</span>
          <b>{MONEY.format(owedByUs)}</b>
          <small>verdiend door monteurs</small>
        </div>
        <div className={pending.length ? k.statAccent : undefined}>
          <span>Uitbetalingsverzoeken</span>
          <b>{pending.length}</b>
          <small>{pending.length ? `${MONEY.format(pendingSum)} aangevraagd` : 'geen open verzoeken'}</small>
        </div>
      </div>

      {pending.length > 0 && (
        <section className={k.requests}>
          <h2>Uitbetalingsverzoeken</h2>
          <ul>
            {pending.map((payout) => (
              <li key={payout.id}>
                <span className={k.reqWho}>
                  <b>{nameOf.get(payout.technician_id) ?? 'Onbekend'}</b>
                  <small>aangevraagd {new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', timeZone: 'Europe/Amsterdam' }).format(new Date(payout.created_at))}</small>
                </span>
                <span className={k.reqAmount}>{MONEY.format(Number(payout.amount))}</span>
                <PayoutActions id={payout.id} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={k.table}>
        <div className={`${k.row} ${k.head}`}>
          <span>Monteur</span>
          <span className={k.num}>Geïnd</span>
          <span className={k.num}>Afgedragen</span>
          <span className={k.num}>Verdiend</span>
          <span className={k.num}>Uitbetaald</span>
          <span className={k.num}>Saldo</span>
        </div>
        {rows.length === 0 && <p className={k.empty}>Nog geen monteurs.</p>}
        {rows.map((r) => {
          const saldo = Number(r.saldo ?? 0);
          return (
            <Link key={r.technician_id as string} href={`/admin/kas/${r.technician_id as string}`} className={k.row}>
              <span className={k.who}>
                <b>{r.name as string}</b>
                <small>
                  {r.employment_type === 'zzp' ? 'ZZP' : 'Loondienst'} · {(r.iban as string) ?? 'geen IBAN'}
                </small>
              </span>
              <span className={k.num}>{MONEY.format(Number(r.totaal_geind ?? 0))}</span>
              <span className={k.num}>{MONEY.format(Number(r.totaal_afgedragen ?? 0))}</span>
              <span className={k.num}>{MONEY.format(Number(r.totaal_verdiend ?? 0))}</span>
              <span className={k.num}>{MONEY.format(Number(r.totaal_uitbetaald ?? 0))}</span>
              <span className={`${k.num} ${k.saldo}`}>
                {saldo > 0 ? (
                  <span className={k.owes}>moet {MONEY.format(saldo)} afdragen</span>
                ) : saldo < 0 ? (
                  <span className={k.gets}>krijgt {MONEY.format(-saldo)}</span>
                ) : (
                  <span className={k.even}>niets open</span>
                )}
              </span>
            </Link>
          );
        })}
      </section>

      <HelpSteps
        steps={[
          <>
            <b>Moet afdragen</b>: de monteur heeft contant of pin van klanten geïnd dat nog bij hem is.
          </>,
          <>
            <b>Krijgt</b>: het bedrijf moet de monteur nog betalen voor zijn klussen.
          </>,
          'Tikkie, iDEAL, bank en factuur gaan rechtstreeks naar het bedrijf en raken het saldo niet.',
        ]}
      />
    </>
  );
}
