import { QRCodeSVG } from 'qrcode.react';
import type { ShopOrder } from '@/lib/kfcOrders';

/* Print CSS for the own label: 100 × 150 mm per page, pakbon on the page after each label. */
export const LABEL_PRINT_CSS = `@page { size: 100mm 150mm; margin: 4mm } @media print { [data-slot=sidebar-wrapper] > :not([data-slot=sidebar-inset]), header, .no-print { display: none !important } main { padding: 0 !important } }`;

/** The CRM's own shipping label plus a packing slip for one order. */
export function LabelSheet({ order }: { order: ShopOrder }) {
  const ref = `${order.shop} #${order.number}`;
  return (
    <>
      <section className="flex flex-col gap-3 rounded border border-black p-4 print:rounded-none print:border-0" style={{ width: '92mm', minHeight: '140mm', pageBreakBefore: 'always' }}>
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
    </>
  );
}
