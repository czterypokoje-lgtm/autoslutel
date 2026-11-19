'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHead, ui } from '../_ui';
import styles from './attributie.module.css';

export interface CampaignSeen {
  id: string;
  name: string | null;
  clicks: number;
  /** The page most of this campaign's visitors landed on — the best hint at
      what it is, for someone naming it without the Ads tab open. */
  topPage: string | null;
}

/**
 * Putting a name to a campaign number.
 *
 * Google only ever sends `24286719575`. The name lives in the Ads account and
 * nothing here talks to that API, so the office types it once and every
 * screen reads it afterwards. Listed newest-busiest first, with the page most
 * of its clicks landed on, because that is usually enough to recognise a
 * campaign without going and looking it up.
 */
export default function CampaignNames({ campaigns }: { campaigns: CampaignSeen[] }) {
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
      <div style={{ marginBottom: '1rem' }}>
        <button className={ui.btn} onClick={() => setOpen(true)}>
          Campagnes benoemen
          {unnamed > 0 && ` — ${unnamed} zonder naam`}
        </button>
      </div>
    );
  }

  return (
    <Card>
      <CardHead>
        Campagnes benoemen — Google stuurt alleen een nummer
      </CardHead>
      <div style={{ padding: '0 16px 16px' }}>
        <p className={styles.muted} style={{ marginTop: 12 }}>
          Vul in hoe de campagne in Google Ads heet. U vindt de nummers daar via Campagnes → kolom
          &ldquo;Campagne-ID&rdquo;. Leeg laten zet het nummer terug.
        </p>

        {error && <p style={{ color: 'var(--crm-stop)', fontSize: 14 }}>{error}</p>}

        <div className={styles.scroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nummer</th>
                <th>Belklikken</th>
                <th>Meeste landingen op</th>
                <th>Naam</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr key={campaign.id}>
                  <td className={styles.mono}>{campaign.id}</td>
                  <td>{campaign.clicks}</td>
                  <td className={styles.page} title={campaign.topPage ?? ''}>
                    {campaign.topPage ?? '—'}
                  </td>
                  <td>
                    <input
                      type="text"
                      className={ui.input}
                      value={draft[campaign.id] ?? ''}
                      placeholder="bijv. Sleutel bijmaken — NL"
                      onChange={(e) =>
                        setDraft((prev) => ({ ...prev, [campaign.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') save(campaign.id);
                      }}
                    />
                  </td>
                  <td>
                    <button
                      className={ui.btn}
                      onClick={() => save(campaign.id)}
                      disabled={busy === campaign.id || (draft[campaign.id] ?? '') === (campaign.name ?? '')}
                    >
                      {busy === campaign.id ? '…' : 'Bewaar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button className={ui.btn} style={{ marginTop: 12 }} onClick={() => setOpen(false)}>
          Sluiten
        </button>
      </div>
    </Card>
  );
}
