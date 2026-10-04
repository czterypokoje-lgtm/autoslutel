import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PageHead, StatGrid, Stat, Card, CardHead, Table, Badge, Empty, Notice } from '../_ui';
import { Boxes, Euro, TriangleAlert, CircleHelp } from 'lucide-react';
import { stockStatus } from '@/lib/stockStatus';
import StockForm from './StockForm';
import PartOrders, { type PartOrderRow } from './PartOrders';
import v from './voorraad.module.css';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Voorraad | Autosleutel24',
};

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

/** Dutch for the six reasons stock_moves is allowed to record (0039). */
const REASON: Record<string, string> = {
  verbruik: 'Verbruikt op een klus',
  ontvangst: 'Ontvangen',
  overdracht: 'Overgedragen',
  correctie: 'Handmatig gecorrigeerd',
  nieuw: 'Nieuw aangemaakt',
  verwijderd: 'Verwijderd',
};

interface StockRow {
  id: string;
  technician_id: string | null;
  description: string;
  quantity: number;
  min_quantity: number;
  unit_cost: number | null;
}

/**
 * The office's view of what the business owns and what it is worth.
 *
 * This page replaces a placeholder that promised multi-location warehousing.
 * It does not deliver that, on purpose: there is one store and two vans, and
 * `technician_id is null` has always meant "central". What was actually
 * missing is far more basic — until now the office had no way to create a
 * stock line at all. The only route in was scanning a supplier invoice, so a
 * part bought over a counter, or a purchase price that came out wrong, had
 * nowhere to go. Without a price on the stock row every material booked to a
 * job lands with a null cost, and the whole job-costing chain reads zero.
 */
export default async function VoorraadPage() {
  await requireOfficeUser('/admin/voorraad');
  const supabase = await createSupabaseServerClient();

  const [stockResult, techResult, movesResult, orderResult] = await Promise.all([
    supabase
      .from('stock_items')
      .select('id, technician_id, description, quantity, min_quantity, unit_cost')
      .order('description'),
    supabase.from('technicians').select('id, name').eq('active', true).order('name'),
    supabase
      .from('stock_moves')
      .select('id, description, delta, quantity_after, reason, changed_at')
      .order('changed_at', { ascending: false })
      .limit(40),
    /* What the monteurs asked for. Open ones first; the handled ones stay
       visible for a while so a delivery can be checked against the van. */
    supabase
      .from('part_orders')
      .select('id, description, article_code, quantity, unit_cost, status, created_at, note, technicians (name)')
      .order('created_at', { ascending: false })
      .limit(30),
  ]);

  if (stockResult.error) {
    return (
      <>
        <PageHead title="Voorraad" sub="Wat er in het magazijn en in de bussen ligt." />
        <Notice tone="bad">
          Voorraad kon niet geladen worden: {stockResult.error.message}
        </Notice>
      </>
    );
  }

  const stock = (stockResult.data ?? []) as StockRow[];
  const technicians = techResult.data ?? [];
  const moves = movesResult.data ?? [];

  const value = stock.reduce((total, row) => total + Number(row.quantity) * Number(row.unit_cost ?? 0), 0);
  const shortCount = stock.filter((row) => stockStatus(row) !== 'ok').length;
  const noPrice = stock.filter((row) => row.unit_cost === null).length;

  /*
   * Grouped by who holds it. Central first — it is where deliveries land and
   * where a van gets restocked from, so it is the row an office user is
   * usually looking for.
   */
  const SEVERITY = { out: 0, low: 1, ok: 2 } as const;
  const byUrgency = (a: StockRow, b: StockRow) =>
    SEVERITY[stockStatus(a)] - SEVERITY[stockStatus(b)] || a.description.localeCompare(b.description, 'nl');
  const allHolders: { id: string | null; name: string; rows: StockRow[] }[] = [
    { id: null, name: 'Magazijn', rows: stock.filter((row) => row.technician_id === null) },
    ...technicians.map((tech) => ({
      id: tech.id,
      name: `Bus — ${tech.name}`,
      rows: stock.filter((row) => row.technician_id === tech.id),
    })),
  ].map((h) => ({ ...h, rows: [...h.rows].sort(byUrgency) }));
  /* The warehouse always shows; a van with nothing registered is one line, not an empty card. */
  const holders = allHolders.filter((h) => h.id === null || h.rows.length > 0);
  const emptyVans = allHolders.filter((h) => h.id !== null && h.rows.length === 0).map((h) => h.name.replace('Bus — ', ''));
  const WHEN = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' });

  return (
    <>
      <PageHead
        title="Voorraad"
        sub="Wat er in het magazijn en in de bussen ligt, wat het waard is, en wat eruit ging."
      />

      <StatGrid>
        <Stat label="Artikelen" value={stock.length} icon={<Boxes size={18} />} />
        <Stat
          label="Voorraadwaarde"
          value={MONEY.format(value)}
          foot="op basis van wat ervoor betaald is"
          icon={<Euro size={18} />}
          tone="info"
        />
        <Stat
          label="Op of bijna op"
          value={shortCount}
          icon={<TriangleAlert size={18} />}
          tone={shortCount ? 'warn' : 'ok'}
        />
        <Stat
          label="Zonder kostprijs"
          value={noPrice}
          foot={noPrice ? 'tellen als € 0 in de klusmarge' : 'alles heeft een prijs'}
          icon={<CircleHelp size={18} />}
          tone={noPrice ? 'warn' : 'ok'}
        />
      </StatGrid>

      {noPrice > 0 && (
        <Notice tone="bad">
          {noPrice} artikel(en) hebben geen kostprijs. Wat daarvan op een klus gaat telt voor
          € 0 mee in de brutowinst — die klus lijkt dan winstgevender dan hij was. Vul de
          kostprijs hieronder aan, of laat hem vanzelf komen door de leveranciersfactuur in
          Mijn bus te scannen.
        </Notice>
      )}

      <details className={v.addFold}>
        <summary className={v.addSummary}>+ Artikel toevoegen of bijboeken</summary>
        <StockForm technicians={technicians} />

      <PartOrders
        orders={((orderResult.data ?? []) as unknown as Array<{
          id: string; description: string; article_code: string | null; quantity: number;
          unit_cost: number | null; status: string; created_at: string; note: string | null;
          technicians: { name: string } | null;
        }>)
          .map<PartOrderRow>((order) => ({
            id: order.id,
            technician: order.technicians?.name ?? 'Onbekend',
            description: order.description,
            articleCode: order.article_code,
            quantity: Number(order.quantity),
            unitCost: order.unit_cost === null ? null : Number(order.unit_cost),
            status: order.status,
            createdAt: order.created_at,
            note: order.note,
          }))
          /* Open first: the handled ones are history, not a to-do. */
          .sort((a, b) => {
            const open = (row: PartOrderRow) => (row.status === 'geleverd' || row.status === 'afgewezen' ? 1 : 0);
            return open(a) - open(b);
          })}
      />
      </details>

      {holders.map((holder) => (
        <Card key={holder.id ?? 'magazijn'}>
          <CardHead>
            {holder.name} · {holder.rows.length} artikel(en) ·{' '}
            {MONEY.format(
              holder.rows.reduce((t, r) => t + Number(r.quantity) * Number(r.unit_cost ?? 0), 0)
            )}
          </CardHead>
          {!holder.rows.length ? (
            <Empty>Niets geregistreerd.</Empty>
          ) : (
            <Table
              head={
                <>
                  <th>Omschrijving</th>
                  <th>Aantal</th>
                  <th>Minimum</th>
                  <th>Kostprijs</th>
                  <th>Waarde</th>
                </>
              }
            >
              {holder.rows.map((row) => {
                const status = stockStatus(row);
                return (
                  <tr key={row.id}>
                    <td>{row.description}</td>
                    <td>
                      {row.quantity}{' '}
                      {status !== 'ok' && (
                        <Badge tone={status === 'out' ? 'stop' : 'warn'}>
                          {status === 'out' ? 'op' : 'bijna op'}
                        </Badge>
                      )}
                    </td>
                    <td>{row.min_quantity || '—'}</td>
                    {/* An em dash, not € 0,00: we do not know, and a zero would claim we do. */}
                    <td>{row.unit_cost === null ? '—' : MONEY.format(Number(row.unit_cost))}</td>
                    <td>
                      {row.unit_cost === null
                        ? '—'
                        : MONEY.format(Number(row.quantity) * Number(row.unit_cost))}
                    </td>
                  </tr>
                );
              })}
            </Table>
          )}
        </Card>
      ))}

      {emptyVans.length > 0 && (
        <p className={v.emptyVans}>Nog niets geregistreerd in de bus van: {emptyVans.join(', ')}.</p>
      )}

      <Card>
        <CardHead>Laatste mutaties</CardHead>
        {!moves.length ? (
          <Empty>Nog geen mutaties vastgelegd.</Empty>
        ) : (
          <Table
            head={
              <>
                <th>Wanneer</th>
                <th>Artikel</th>
                <th>Verandering</th>
                <th>Daarna</th>
                <th>Reden</th>
              </>
            }
          >
            {moves.map((move) => (
              <tr key={move.id}>
                <td>{WHEN.format(new Date(move.changed_at as string))}</td>
                <td>{move.description}</td>
                <td className={Number(move.delta) < 0 ? v.minus : v.plus}>
                  {Number(move.delta) > 0 ? '+' : ''}
                  {move.delta}
                </td>
                <td>{move.quantity_after}</td>
                <td>{REASON[move.reason] ?? move.reason}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
