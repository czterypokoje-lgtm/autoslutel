'use client';

import { PreviewText } from '@/app/admin/PreviewLanguage';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CampaignSeen } from './CampaignNames';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

/**
 * Studio restyle of CampaignNames: same toggle-open behaviour and the same
 * /api/admin/ad-campaigns POST — only the markup changes, onto shadcn
 * Card/Table/Input/Button.
 */
export default function StudioCampaignNames({ campaigns }: { campaigns: CampaignSeen[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>(
    Object.fromEntries(campaigns.map((c) => [c.id, c.name ?? '']))
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  const unnamed = campaigns.filter((c) => !c.name).length;

  async function save(id: string) {
    setBusy(id);
    setError('');
    const response = await fetch('/api/admin/ad-campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaign_id: id, name: draft[id] ?? '' }),
    }).catch(() => null);

    if (!response?.ok) {
      setError((await response?.json().catch(() => null))?.error ?? 'Opslaan mislukt.');
      setBusy(null);
      return;
    }
    setBusy(null);
    router.refresh();
  }

  if (!campaigns.length) return null;

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        <PreviewText>Campagnes benoemen</PreviewText>
        {unnamed > 0 && ` — ${unnamed} zonder naam`}
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle><PreviewText>Campagnes benoemen — Google stuurt alleen een nummer</PreviewText></CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-muted-foreground text-sm">
          <PreviewText>
            Vul in hoe de campagne in Google Ads heet. U vindt de nummers daar via Campagnes → kolom &ldquo;Campagne-ID&rdquo;.
            Leeg laten zet het nummer terug.
          </PreviewText>
        </p>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><PreviewText>Nummer</PreviewText></TableHead>
                <TableHead><PreviewText>Belklikken</PreviewText></TableHead>
                <TableHead><PreviewText>Meeste landingen op</PreviewText></TableHead>
                <TableHead><PreviewText>Naam</PreviewText></TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-mono text-xs">{campaign.id}</TableCell>
                  <TableCell>{campaign.clicks}</TableCell>
                  <TableCell className="text-muted-foreground max-w-48 truncate" title={campaign.topPage ?? ''}>
                    {campaign.topPage ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Input
                      value={draft[campaign.id] ?? ''}
                      placeholder="bijv. Sleutel bijmaken — NL"
                      onChange={(e) => setDraft((prev) => ({ ...prev, [campaign.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') save(campaign.id);
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => save(campaign.id)}
                      disabled={busy === campaign.id || (draft[campaign.id] ?? '') === (campaign.name ?? '')}
                    >
                      {busy === campaign.id ? '…' : <PreviewText>Bewaar</PreviewText>}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Button variant="outline" className="w-fit" onClick={() => setOpen(false)}>
          <PreviewText>Sluiten</PreviewText>
        </Button>
      </CardContent>
    </Card>
  );
}
