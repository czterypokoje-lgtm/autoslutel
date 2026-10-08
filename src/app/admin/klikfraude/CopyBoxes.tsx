'use client';

import { useState } from 'react';
import { Card, CardHead, Notice, ui } from '../_ui';
import { Copy, Check } from 'lucide-react';

/**
 * The two things that actually leave this screen.
 *
 * Neither is pushed anywhere automatically, and that is deliberate: this
 * account has no Google Ads API client, and an IP exclusion applied by a
 * machine that nobody checked is how a real customer's office gets silently
 * cut off from the ads they were about to click. So it works like
 * /offline-conversions already does — the machine prepares, a person pastes.
 */

function Box({
  title,
  help,
  value,
  empty,
  rows,
}: {
  title: string;
  help: string;
  value: string;
  empty: string;
  rows: number;
}) {
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
    <Card padded>
      <CardHead>{title}</CardHead>
      <p className={ui.sub}>{help}</p>
      {value ? (
        <>
          <textarea className={ui.input} rows={rows} readOnly value={value} />
          <button type="button" className={ui.btn} onClick={copy}>
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? 'Gekopieerd' : 'Kopiëren'}
          </button>
        </>
      ) : (
        <Notice tone="ok">{empty}</Notice>
      )}
    </Card>
  );
}

export default function CopyBoxes({
  exclusions,
  evidence,
}: {
  exclusions: string;
  evidence: string;
}) {
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
