'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

/** Studio restyle of CopyBoxes: same clipboard copy, nothing sent anywhere automatically. */
function Box({ title, help, value, empty, rows }: { title: string; help: string; value: string; empty: string; rows: number }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard refused (no permission, or an insecure origin). The text is
      // in the box regardless, so selecting it by hand still works.
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-muted-foreground text-sm">{help}</p>
        {value ? (
          <>
            <Textarea rows={rows} readOnly value={value} className="font-mono text-xs" />
            <Button type="button" variant="outline" className="w-fit" onClick={copy}>
              {copied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}
              {copied ? 'Gekopieerd' : 'Kopiëren'}
            </Button>
          </>
        ) : (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
            {empty}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function StudioCopyBoxes({ exclusions, evidence }: { exclusions: string; evidence: string }) {
  return (
    <>
      <Box
        title="IP-uitsluitingen voor Google Ads"
        help="Alleen de adressen met het oordeel 'fraude'. Plak ze in Google Ads: zoekcampagne → Instellingen → Aanvullende instellingen → IP-uitsluitingen. Let op: maximaal 500 reeksen per campagne, en Performance Max heeft helemaal geen IP-uitsluitingen."
        value={exclusions}
        empty="Geen adres haalt de drempel voor uitsluiten. Dat is goed nieuws: niets uitsluiten is beter dan een klant uitsluiten."
        rows={6}
      />
      <Box
        title="Bewijs voor een claim op ongeldige klikken"
        help="Eén regel per betaalde landing, met puntkomma's zodat Excel het meteen in kolommen zet. Dit is wat Google-support vraagt wanneer je om een creditering verzoekt — kijk eerst in Google Ads bij de kolom 'Ongeldige klikken': wat daar al afgeschreven staat, heeft Google zelf al teruggegeven en hoef je niet te claimen."
        value={evidence}
        empty="Nog geen landingen om te onderbouwen."
        rows={10}
      />
    </>
  );
}
