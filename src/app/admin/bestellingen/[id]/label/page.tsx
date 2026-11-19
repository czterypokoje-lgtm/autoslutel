import { notFound } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { IS_KEYFORCARS } from '@/config/install';
import { requireWarehouseUser } from '@/lib/crmSession';
import { getShopOrder } from '@/lib/kfcOrders';

export const dynamic = 'force-dynamic';

/** The CRM's own shipping label (100 × 150 mm) plus a packing slip, printed from the browser. */
export default async function LabelPage({ params }: { params: Promise<{ id: string }> }) {
  if (!IS_KEYFORCARS) notFound();
  await requireWarehouseUser('/admin/bestellingen');
  const { id } = await params;
  if (!/^[a-f0-9-]{36}$/i.test(id)) notFound();
  const order = await getShopOrder(id);
  if (!order) notFound();
  const ref = `${order.shop} #${order.number}`;
  return (
    <div className="mx-auto max-w-md bg-white p-6 text-black print:max-w-none print:p-0">
      <style>{`@page { size: 100mm 150mm; margin: 4mm } @media print { [data-slot=sidebar-wrapper] > :not([data-slot=sidebar-inset]), header, .no-print { display: none !important } main { padding: 0 !important } }`}</style>
      <section className="flex flex-col gap-3 rounded border border-black p-4 print:rounded-none print:border-0" style={{ width: '92mm', minHeight: '140mm' }}>
        <div className="flex items-start justify-between text-xs">
          <div><div className="font-semibold">Afzender</div><div>KeyForCars</div><div>Nederland</div></div>
          <QRCodeSVG value={ref} size={72} />
        </div>
        <div className="mt-2 text-xs font-semibold uppercase tracking-wide">Ontvanger</div>
        <div className="text-lg leading-tight font-semibold">
          <div>{order.ship_company}</div><div>{order.ship_name}</div><div>{order.ship_street}</div><div>{order.ship_postcode} {order.ship_city}</div><div className="text-2xl">{order.country}</div>
        </div>
        <div className="mt-auto border-t border-black pt-2 text-xs"><div className="text-base font-bold tabular-nums">{ref}</div><div>{order.lines.reduce((s, l) => s + l.quantity, 0)} artikel(en) · {order.ship_phone}</div></div>
      </section>
      <section className="mt-6 text-sm" style={{ pageBreakBefore: 'always' }}>
        <h2 className="mb-2 text-base font-semibold">Pakbon · {ref}</h2>
        <table className="w-full border-collapse text-xs"><thead><tr className="border-b text-left"><th className="py-1">Aantal</th><th>SKU</th><th>Artikel</th></tr></thead>
          <tbody>{order.lines.filter((l) => l.state !== 'cancelled').map((l) => <tr key={l.id} className="border-b border-gray-200"><td className="py-1">{l.quantity}</td><td>{l.sku}</td><td>{l.name}</td></tr>)}</tbody></table>
      </section>
      <p className="no-print mt-4 text-xs text-gray-500">Afdrukken: Ctrl+P of ⌘P. Labelprinter 100 × 150 mm, of A4 met de pakbon op pagina 2.</p>
    </div>
  );
}
