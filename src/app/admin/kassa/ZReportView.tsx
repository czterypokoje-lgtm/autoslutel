'use client';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PayMethod, ZReport } from '@/lib/kfcPos';

const euro = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
export const fmt = (cents: number) => euro.format(cents / 100);
const signed = (cents: number) => (cents > 0 ? `+${fmt(cents)}` : fmt(cents));
const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString('nl-NL') : '—');

export const METHOD_LABEL: Record<PayMethod, string> = { cash: 'Contant', pin: 'PIN', other: 'Overig' };

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return <div className={`flex justify-between gap-4 ${strong ? 'font-semibold' : ''}`}><span>{label}</span><span className="tabular-nums">{value}</span></div>;
}

/**
 * The Z-report as stored at closing (kfc_pos_sessions.z_report, migration 0136).
 * Rendered from the stored figures only, so a reprint months later is identical.
 */
export function ZReportView({ report }: { report: ZReport }) {
  return (
    <div className="pos-print grid gap-1 rounded-md border p-3 font-mono text-xs leading-5">
      <div className="text-sm font-bold">Z-rapport {report.zNumber ? `nr. ${report.zNumber}` : '(zonder nummer)'} · kassa {report.register}</div>
      <Row label="Geopend" value={`${when(report.openedAt)} · ${report.openedBy}`} />
      <Row label="Gesloten" value={`${when(report.closedAt)} · ${report.closedBy}`} />
      {!report.stored && (
        <p className="text-muted-foreground">Gesloten voor de nieuwe kassa (migratie 0136): alleen de contante telling is bewaard.</p>
      )}
      {report.stored && (
        <>
          <div className="my-1 border-t border-dashed" />
          <Row label={`Verkopen (${report.salesCount})`} value={fmt(report.salesTotalCents)} />
          <Row label={`Retouren (${report.returnsCount})`} value={fmt(-report.refundsTotalCents)} />
          <Row label="Netto omzet incl. btw" value={fmt(report.netTotalCents)} strong />
          <div className="my-1 border-t border-dashed" />
          <div className="font-semibold">Ontvangen per betaalwijze</div>
          {(['cash', 'pin', 'other'] as PayMethod[]).map((m) => <Row key={m} label={METHOD_LABEL[m]} value={fmt(report.salesByMethod[m])} />)}
          <div className="font-semibold">Terugbetaald</div>
          <Row label="Contant" value={fmt(-report.refundsByMethod.cash)} />
          <Row label="PIN" value={fmt(-report.refundsByMethod.pin)} />
          <div className="font-semibold">Kas in / uit</div>
          <Row label={`Kas in (${report.cashInCount})`} value={fmt(report.cashInCents)} />
          <Row label={`Kas uit (${report.cashOutCount})`} value={fmt(-report.cashOutCents)} />
          {report.vat.length > 0 && (
            <>
              <div className="my-1 border-t border-dashed" />
              <div className="font-semibold">Btw (netto, na retouren)</div>
              {report.vat.map((v) => (
                <Row key={v.rate} label={`${v.rate}% over ${fmt(v.baseCents)}`} value={fmt(v.vatCents)} />
              ))}
            </>
          )}
        </>
      )}
      <div className="my-1 border-t border-dashed" />
      <div className="font-semibold">Contant in de la</div>
      <Row label="Startbedrag" value={fmt(report.openingFloatCents)} />
      <Row label="Verwacht" value={fmt(report.cash.expectedCents)} />
      <Row label="Geteld" value={fmt(report.cash.countedCents)} />
      <Row label="Verschil" value={signed(report.cash.differenceCents)} strong />
      {report.pin && (
        <>
          <div className="font-semibold">PIN-automaat</div>
          <Row label="Verwacht" value={fmt(report.pin.expectedCents)} />
          <Row label="Totaal automaat" value={fmt(report.pin.countedCents)} />
          <Row label="Verschil" value={signed(report.pin.differenceCents)} strong />
        </>
      )}
      {report.note && <div className="mt-1">Opmerking: {report.note}</div>}
    </div>
  );
}

export function PrintButton({ label = 'Printen' }: { label?: string }) {
  return (
    <Button className="h-11 md:h-9" onClick={() => window.print()}>
      <Printer className="size-4" aria-hidden="true" />{label}
    </Button>
  );
}

/** Print only the receipt / Z-report, sized for an 80 mm thermal printer. */
export function PrintStyles() {
  return (
    <style>{`@media print {
      @page { size: 80mm auto; margin: 4mm; }
      body * { visibility: hidden !important; }
      .pos-print, .pos-print * { visibility: visible !important; }
      .pos-print { position: fixed; left: 0; top: 0; width: 72mm; border: 0 !important; padding: 0 !important; color: #000; background: #fff; }
    }`}</style>
  );
}
