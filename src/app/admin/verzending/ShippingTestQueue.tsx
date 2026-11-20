'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin, Package, Printer, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { carriers, shippingOrigin, isLegacyCityPoint, examplePickupPoint, testLabelUrl, testScenarios, testTracking, type Coordinate, type TestParcel, type TestScenario } from '@/lib/kfcShippingTestModel';
import type { ShopOrder } from '@/lib/kfcOrders';
import { PreviewProductName, usePreviewLanguage } from '../PreviewLanguage';
import { prepareShippingTestParcel } from './actions';
import { ShippingMap } from './ShippingMap';

export type ShippingQueueOrder = Pick<ShopOrder, 'id' | 'shop' | 'number' | 'fulfilment' | 'ship_street' | 'ship_postcode' | 'ship_city' | 'country' | 'carrier'> & {
  lines: Pick<ShopOrder['lines'][number], 'id' | 'name' | 'sku' | 'quantity'>[];
};
const stage = {
  label: ['Label created', 'Etiket aangemaakt'],
  in_transit: ['Accepted by carrier', 'Geaccepteerd door vervoerder'],
  out_for_delivery: ['Out for delivery', 'Onderweg voor bezorging'],
  delivered: ['Delivered', 'Bezorgd'],
  no_estimate: ['No estimated delivery', 'Geen bezorgindicatie'],
  unavailable: ['Carrier unavailable', 'Vervoerder onbereikbaar'],
} as const;

export function ShippingTestQueue({ orders, parcels, selected, requestedParcel, error, showPrint }: {
  orders: ShippingQueueOrder[]; parcels: TestParcel[]; selected?: string; requestedParcel?: string; error: boolean; showPrint: boolean;
}) {
  const { english } = usePreviewLanguage();
  const l = (en: string, nl: string) => english ? en : nl;
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [scenario, setScenario] = useState<TestScenario>('label');
  const [addParcel, setAddParcel] = useState(false);
  const [formatName, setFormatName] = useState<'a6' | 'thermal'>('a6');
  const labelPdf = (id: string) => testLabelUrl(id) + '&format=' + formatName;
  const [lookup, setLookup] = useState<{ key: string; result: (ReturnType<typeof testTracking> & { checkedAt: string }) | null }>();
  const needle = query.trim().toLocaleLowerCase();
  const filtered = orders.filter((item) =>
    (filter === 'all' || item.fulfilment === filter) &&
    (!needle || [item.number, item.shop, item.ship_city, ...item.lines.flatMap((line) => [line.sku, line.name])]
      .some((item) => item?.toLocaleLowerCase().includes(needle))));
  const requestedOrder = selected ?? parcels.find((parcel) => parcel.id === requestedParcel)?.order_id;
  const order = filtered.find((item) => item.id === requestedOrder) ?? filtered[0];
  const ready = orders.filter((item) => item.fulfilment === 'picked').length;
  const labelled = new Set(parcels.map((item) => item.order_id)).size;
  const pageQuery = (orderId: string, parcelId?: string) => '/admin/verzending?' + new URLSearchParams({ order: orderId, ...(parcelId ? { parcel: parcelId } : {}) });
  const linked = parcels.filter((item) => item.order_id === order?.id);
  const selectedParcel = linked.find((item) => item.id === requestedParcel) ?? linked[0];
  const address = [order?.ship_street, order?.ship_postcode, order?.ship_city, order?.country].filter(Boolean).join(', ');
  const exampleOrder = orders.find((item) => item.ship_city === 'Almere');
  const pickup = order && order === exampleOrder ? examplePickupPoint : null;
  const parcelPoint: Coordinate | null = selectedParcel?.latitude != null && selectedParcel.longitude != null
    ? [selectedParcel.latitude, selectedParcel.longitude] : null;
  const point = parcelPoint && !isLegacyCityPoint(order?.ship_city ?? '', parcelPoint) ? parcelPoint : !selectedParcel ? pickup?.point ?? null : null;
  const label = selectedParcel?.destination ?? (pickup ? l('Example Pickup Point', 'Voorbeeldafhaalpunt') + ' · ' + pickup.address : address || l('Destination', 'Bestemming'));
  const trackingUrl = selectedParcel ? '/api/admin/shipping-test/tracking?' + new URLSearchParams({ id: selectedParcel.id, scenario }) : null;
  useEffect(() => {
    if (!trackingUrl) return;
    const abort = new AbortController();
    void fetch(trackingUrl, { signal: abort.signal })
      .then((response) => { if (!response.ok) throw new Error('Tracking unavailable'); return response.json(); })
      .then((result) => { if (!abort.signal.aborted) setLookup({ key: trackingUrl, result }); })
      .catch(() => { if (!abort.signal.aborted) setLookup({ key: trackingUrl, result: null }); });
    return () => abort.abort();
  }, [trackingUrl]);
  const tracking = lookup?.key === trackingUrl ? lookup.result : null;
  const format = new Intl.DateTimeFormat(english ? 'en-GB' : 'nl-NL', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Amsterdam' });
  const nextParcel = (linked.at(-1)?.parcel_no ?? 0) + 1;

  return <div className="grid gap-4">
    <header className="flex flex-wrap justify-between gap-3">
      <div><h1 className="text-2xl font-semibold tracking-tight">{l('Shipping Queue', 'Verzendwachtrij')}</h1>
        <p className="text-muted-foreground text-sm">{l('Preview data', 'Voorbeeldgegevens')}</p></div>
    </header>
    <section className="grid grid-cols-2 gap-2 lg:grid-cols-4" aria-label={l('Queue overview', 'Wachtrijoverzicht')}>
      {[[orders.length, l('Paid Orders Awaiting Dispatch', 'Betaalde bestellingen voor verzending')],
        [orders.length - ready, l('Items To Collect', 'Artikelen te verzamelen')], [ready, l('Items Collected', 'Artikelen verzameld')],
        [parcels.length, l('Parcels With A Label', 'Pakketten met etiket')]].map(([count, title]) =>
        <Card key={title}><CardContent className="grid gap-1"><strong className="text-xl tabular-nums">{count}</strong><span className="text-muted-foreground text-xs">{title}</span></CardContent></Card>)}
    </section>
    <p className="text-muted-foreground text-sm">{l('One order can have several parcels. Items collected means the warehouse has completed picking.', 'Eén bestelling kan meerdere pakketten hebben. Artikelen verzameld betekent dat het magazijn de artikelen heeft verzameld.')} {labelled} {labelled === 1 ? l('order has a parcel label.', 'bestelling heeft een pakketetiket.') : l('orders have a parcel label.', 'bestellingen hebben een pakketetiket.')}</p>
    <div className="grid min-w-0 gap-4 xl:grid-cols-[19rem_minmax(0,1fr)]">
      <Card className="min-w-0">
        <CardHeader><CardTitle>{l('Orders', 'Bestellingen')} · {filtered.length}</CardTitle></CardHeader>
        <CardContent className="grid gap-3">
          <div className="relative"><Search className="text-muted-foreground absolute left-2 top-2.5 size-4" aria-hidden />
            <Input className="pl-8" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={l('Order, item or SKU', 'Bestelling, artikel of SKU')} aria-label={l('Search shipping records', 'Zoek verzendgegevens')} /></div>
          <select className="rounded-md border bg-card p-2 text-sm" aria-label={l('Filter order status', 'Filter op status')} value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option value="all">{l('All eligible orders', 'Alle verzendbare bestellingen')}</option><option value="open">{l('Items To Collect', 'Artikelen te verzamelen')}</option><option value="picked">{l('Items Collected', 'Artikelen verzameld')}</option>
          </select>
          <div className="grid max-h-[31rem] gap-2 overflow-auto">
            {filtered.map((item) => <Link className="grid rounded-md border p-2 text-sm hover:bg-muted aria-[current=page]:border-primary aria-[current=page]:bg-primary/5" key={item.id} href={pageQuery(item.id)} scroll={false}
              aria-current={order?.id === item.id ? 'page' : undefined} onClick={() => { setAddParcel(false); setScenario('label'); }}>
              <strong>#{item.number}</strong><span>{item.shop} · {item.ship_city}</span>
              <span className="text-muted-foreground text-xs">{item.fulfilment === 'picked' ? l('Items Collected', 'Artikelen verzameld') : l('Items To Collect', 'Artikelen te verzamelen')}</span>
            </Link>)}
            {!filtered.length && <p className="text-muted-foreground text-sm">{l('No matching records.', 'Geen passende gegevens.')}</p>}
          </div>
        </CardContent>
      </Card>
      {order && <div className="grid min-w-0 gap-4">
        <Card><CardHeader>
          <CardTitle className="flex gap-2"><MapPin className="size-4" aria-hidden />{selectedParcel ? l('Parcel', 'Pakket') + ' ' + selectedParcel.parcel_no + ' · ' : ''}{l('Dispatch–Delivery Connection', 'Verbinding afzender–bestemming')}</CardTitle>
          <CardDescription>{shippingOrigin.address} → {label}</CardDescription>
        </CardHeader><CardContent>
          <ShippingMap target={point} targetLabel={label} english={english} />
          <p className="text-muted-foreground mt-2 text-xs">{l('The dashed line shows a connection between points. It does not indicate a carrier route or package location.', 'De stippellijn verbindt twee punten. Ze toont geen vervoerdersroute of pakketlocatie.')}</p>
          {!point && <p className="mt-2 text-sm"><a className="underline" href="#shipping-parcel-form" onClick={() => setAddParcel(true)}>{l('Destination coordinates missing. Review the test address.', 'Coördinaten ontbreken. Controleer het testadres.')}</a></p>}
        </CardContent></Card>
        <Card><CardHeader><CardTitle>#{order.number} · {order.shop}</CardTitle><CardDescription>{address}</CardDescription></CardHeader>
          <CardContent className="grid gap-2">
            {order.lines.map((line) => <div key={line.id} className="flex gap-2 text-sm"><Package className="size-4 shrink-0" aria-hidden /><span>{line.quantity} × {line.sku} · <PreviewProductName sku={line.sku}>{line.name}</PreviewProductName></span></div>)}
            <p className="text-muted-foreground text-xs">{order.carrier === 'eigen' ? l('Own label', 'Eigen etiket') : order.carrier || l('Carrier not assigned on order', 'Geen vervoerder toegewezen')}</p>
            <Button asChild variant="outline" size="sm" className="w-fit"><Link href={'/admin/bestellingen/' + order.id}>{l('Open Order', 'Open bestelling')}</Link></Button>
          </CardContent>
        </Card>
        <Card><CardHeader><CardTitle>{l('Parcels and Labels', 'Pakketten en etiketten')}</CardTitle></CardHeader><CardContent className="grid gap-3">
          {linked.map((parcel) => <div key={parcel.id} className="flex flex-wrap items-center gap-2 rounded-lg border p-2 text-sm">
            <Link className="font-medium underline-offset-4 hover:underline" href={pageQuery(order.id, parcel.id)} scroll={false} onClick={() => setScenario('label')}>
              {l('Parcel', 'Pakket')} {parcel.parcel_no} · {carriers.find((item) => item.id === parcel.service)?.label}
            </Link>
            <span className="text-muted-foreground break-all">{testTracking(parcel, 'label').trackingCode}</span>
            <Badge variant="secondary">{stage[parcel.id === selectedParcel?.id ? (scenario === 'no_estimate' || scenario === 'unavailable' ? 'in_transit' : scenario) : 'label'][english ? 0 : 1]}</Badge>
            <Button asChild size="sm" variant="outline" className="ml-auto"><a href={labelPdf(parcel.id)} target="_blank" rel="noreferrer"><Printer />{l('Reprint PDF', 'PDF opnieuw afdrukken')}</a></Button>
          </div>)}
          {nextParcel <= 20 && (!linked.length || addParcel || error ? <form key={order.id} id="shipping-parcel-form" action={prepareShippingTestParcel} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2">
            <input type="hidden" name="order" value={order.id} /><input type="hidden" name="parcel_no" value={nextParcel} />
            <label className="grid gap-1 text-sm">{l('Delivery Service', 'Bezorgdienst')}
              <select className="rounded-md border bg-card p-2" name="service" required>{carriers.map((carrier) => <option key={carrier.id} value={carrier.id}>{carrier.label}</option>)}</select></label>
            <label className="grid gap-1 text-sm">{l('Delivery Address Or Pickup Point', 'Bezorgadres of afhaalpunt')}<Input name="destination" required maxLength={250} defaultValue={pickup?.address ?? address} /></label>
            {([['weight','Weight (g)','Gewicht (g)',70000],['length','Length (cm)','Lengte (cm)',200],['width','Width (cm)','Breedte (cm)',200],['height','Height (cm)','Hoogte (cm)',200]] as const).map(([name,en,nl,max]) =>
              <label key={name} className="grid gap-1 text-sm">{l(en,nl)}<Input type="number" name={name} required min={1} max={max} /></label>)}
            <label className="grid gap-1 text-sm">{l('Latitude', 'Breedtegraad')}<Input type="number" name="latitude" min={-90} max={90} step="any" defaultValue={pickup?.point[0]} /></label>
            <label className="grid gap-1 text-sm">{l('Longitude', 'Lengtegraad')}<Input type="number" name="longitude" min={-180} max={180} step="any" defaultValue={pickup?.point[1]} /></label>
            <p className="text-muted-foreground text-xs sm:col-span-2">{l('If you change the delivery address, update or clear its coordinates.', 'Werk de coördinaten bij of wis ze als je het bezorgadres wijzigt.')}</p>
            {error && <p role="alert" className="text-destructive text-sm sm:col-span-2">{l('Could not create the test label. Check its address, dimensions and order status.', 'Het testetiket kon niet worden gemaakt. Controleer adres, afmetingen en bestelstatus.')}</p>}
            <Button className="w-fit" type="submit"><Printer />{l('Create And Preview Label', 'Etiket maken en bekijken')}</Button>
          </form> : <Button className="w-fit" variant="outline" onClick={() => setAddParcel(true)}>{l('Add Parcel', 'Pakket toevoegen')}</Button>)}
          {selectedParcel && <details key={selectedParcel.id} open={showPrint || undefined} className="grid gap-2">
            <summary className="cursor-pointer font-medium">{l('Label Preview', 'Etiketvoorbeeld')}</summary>
            <label className="grid w-fit gap-1 text-sm">{l('Paper Format', 'Papierformaat')}
              <select className="rounded-md border bg-card p-2" value={formatName} onChange={(event) => setFormatName(event.target.value === 'thermal' ? 'thermal' : 'a6')}>
                <option value="a6">A6 · 105 × 148 mm</option><option value="thermal">{l('Thermal', 'Thermisch')} · 100 × 150 mm</option>
              </select>
            </label>
            <p className="text-muted-foreground text-sm">{l('Portrait · print at actual size (100%).', 'Staand · druk af op ware grootte (100%).')}</p>
            <iframe title={l('Label PDF', 'Etiket-PDF')} className="h-[33rem] w-full rounded-md border" src={labelPdf(selectedParcel.id)} />
          </details>}
        </CardContent></Card>
        {trackingUrl && <Card><CardHeader><CardTitle>{l('Tracking History', 'Volggeschiedenis')}</CardTitle><CardDescription>{l('Preview tracking history', 'Voorbeeld volggeschiedenis')}</CardDescription></CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <select className="w-fit rounded-md border bg-card p-2" aria-label={l('Tracking scenario', 'Volgscenario')} value={scenario} onChange={(event) => setScenario(event.target.value as TestScenario)}>
              {testScenarios.map((item) => <option value={item} key={item}>{stage[item][english ? 0 : 1]}</option>)}
            </select>
            {!tracking && <p role="status">{lookup?.key === trackingUrl ? l('Could not load tracking.', 'Volginformatie kon niet worden geladen.') : l('Loading tracking…', 'Volginformatie laden…')}</p>}
            {tracking && <>
            <p className="text-muted-foreground">{l('Last checked', 'Laatst gecontroleerd')} · {format.format(new Date(tracking.checkedAt))}</p>
            {tracking.unavailable && tracking.lastSuccessfulCheck && <p role="status">{l('Carrier unavailable. Last known update', 'Vervoerder onbereikbaar. Laatste bekende update')} · {format.format(new Date(tracking.lastSuccessfulCheck))}</p>}
            <p>{tracking.estimate ? l('Estimated Delivery', 'Geschatte bezorging') + ' · ' + tracking.estimate :
              l('The carrier has not shared an estimated delivery time.', 'De vervoerder heeft nog geen geschatte bezorgtijd opgegeven.')}</p>
            <ol className="grid gap-1">{tracking.events.map((item) => <li key={item.status}>{stage[item.status][english ? 0 : 1]} · {format.format(new Date(item.time))}</li>)}</ol>
            </>}
          </CardContent>
        </Card>}
      </div>}
    </div>
  </div>;
}
