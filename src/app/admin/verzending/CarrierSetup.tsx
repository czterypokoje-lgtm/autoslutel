'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { carriers, shippingOrigin } from '@/lib/kfcShippingTestModel';
import { usePreviewLanguage } from '../PreviewLanguage';

const credentials = [
  ['PostNL account number, API key and shipping product code', 'PostNL-klantnummer, API-sleutel en verzendproductcode'],
  ['DHL eCommerce account ID, user ID, API key and shipment options', 'DHL eCommerce-account-ID, gebruikers-ID, API-sleutel en verzendopties'],
  ['MyDHL API username, password, account number and product code', 'MyDHL API-gebruikersnaam, wachtwoord, accountnummer en productcode'],
];

export function CarrierSetup() {
  const { english } = usePreviewLanguage();
  const l = (en: string, nl: string) => english ? en : nl;
  return <section className="grid gap-4">
    <div className="flex flex-wrap justify-between gap-3">
      <div><h1 className="text-2xl font-semibold">{l('Shipping Settings', 'Verzendinstellingen')}</h1>
        <p className="text-muted-foreground text-sm">{l('Test mode · no live services enabled', 'Testmodus · geen live diensten geactiveerd')}</p></div>
      <Button asChild variant="outline"><Link href="/admin/verzending">{l('Shipping Queue', 'Verzendwachtrij')}</Link></Button>
    </div>
    <Card><CardContent className="grid gap-2 pt-3">
      <strong>{l('Dispatch Address', 'Afzendadres')}</strong><span>{shippingOrigin.address}</span>
      <p className="text-muted-foreground text-sm">{l('Connect account → verify dispatch address → map shipping service → test → enable', 'Account koppelen → afzendadres verifiëren → dienst koppelen → testen → activeren')}</p>
    </CardContent></Card>
    <div className="grid gap-3 md:grid-cols-3">{carriers.map((carrier, index) => <Card key={carrier.id}>
      <CardHeader><CardTitle>{carrier.label}</CardTitle><CardDescription>{l('Account connection pending', 'Accountkoppeling in afwachting')}</CardDescription></CardHeader>
      <CardContent className="grid gap-3"><p className="text-sm">{credentials[index][english ? 0 : 1]}</p>
        <Button asChild variant="outline" size="sm"><a href={carrier.portal} target="_blank" rel="noreferrer">{l('Developer Portal', 'Ontwikkelaarsportaal')}</a></Button>
      </CardContent>
    </Card>)}</div>
  </section>;
}
