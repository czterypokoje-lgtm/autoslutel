import { Card, CardHead, Table, Badge, Empty } from '../../_ui';
import { TIER_TERMS, type Tier } from '@/lib/subscription';

export type OfferRow = {
  id: string;
  rank: number;
  tier_at_offer: string;
  score: number | null;
  reason: string | null;
  offered_at: string;
  expires_at: string;
  responded_at: string | null;
  response: 'accepted' | 'declined' | 'expired' | null;
  decline_note: string | null;
  technician_id: string;
  technician_name: string;
};

const RESPONSE_TONE: Record<string, 'ok' | 'warn' | 'stop'> = {
  accepted: 'ok',
  declined: 'warn',
  expired: 'stop',
};

const RESPONSE_LABEL: Record<string, string> = {
  accepted: 'Geaccepteerd',
  declined: 'Afgewezen',
  expired: 'Verlopen',
};

function time(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Who this job went to, in order, and what happened when it reached them.
 *
 * Offered, never assigned — so the interesting fact per row is not just "did
 * they take it" but at what rank and tier they saw it, and how long it sat
 * with them before they answered. A job that took four technicians to place
 * says something about coverage that an accepted job alone does not.
 */
export default function OfferHistory({ offers }: { offers: OfferRow[] }) {
  if (!offers.length) {
    return (
      <Card padded>
        <CardHead>Aanbod</CardHead>
        <Empty>Deze klus is nog aan niemand aangeboden.</Empty>
      </Card>
    );
  }

  const sorted = [...offers].sort((a, b) => a.rank - b.rank);

  return (
    <Card>
      <CardHead>Aanbod · {sorted.length} monteur{sorted.length === 1 ? '' : 'en'}</CardHead>
      <Table
        head={
          <>
            <th>#</th>
            <th>Monteur</th>
            <th>Tier</th>
            <th>Score</th>
            <th>Aangeboden</th>
            <th>Reactie</th>
            <th>Toelichting</th>
          </>
        }
      >
        {sorted.map((offer) => (
          <tr key={offer.id}>
            <td>{offer.rank}</td>
            <td>{offer.technician_name}</td>
            <td>{TIER_TERMS[offer.tier_at_offer as Tier]?.label ?? offer.tier_at_offer}</td>
            <td>{offer.score === null ? '—' : offer.score.toFixed(1)}</td>
            <td>
              {time(offer.offered_at)}
              {offer.responded_at && offer.responded_at !== offer.offered_at && (
                <> → {time(offer.responded_at)}</>
              )}
            </td>
            <td>
              {offer.response ? (
                <Badge tone={RESPONSE_TONE[offer.response]}>{RESPONSE_LABEL[offer.response]}</Badge>
              ) : (
                <Badge tone="info">Wacht op reactie</Badge>
              )}
            </td>
            <td>{offer.decline_note || offer.reason || '—'}</td>
          </tr>
        ))}
      </Table>
    </Card>
  );
}
