import Link from 'next/link';
import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PageHead, Card, Table, Badge, Empty, Notice, ui } from '../_ui';
import styles from './facturen.module.css';

export const dynamic = 'force-dynamic';

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const DATE = new Intl.DateTimeFormat('nl-NL', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'Europe/Amsterdam',
});

interface InvoiceRow {
  id: string;
  invoice_number: string;
  issue_date: string;
  client_name: string;
  client_city: string | null;
  total: number | string;
  status: 'concept' | 'verzonden' | 'betaald';
}

const STATUS_LABEL: Record<InvoiceRow['status'], string> = {
  concept: 'Concept',
  verzonden: 'Verzonden',
  betaald: 'Betaald',
};

const STATUS_TONE: Record<InvoiceRow['status'], 'ok' | 'warn' | 'info'> = {
  concept: 'info',
  verzonden: 'warn',
  betaald: 'ok',
};

/**
 * Every sales invoice, newest first.
 *
 * A monteur only ever sees their own here (RLS on sales_invoices, not a filter
 * added on this page) — the office sees everyone's, same split as klanten and
 * mijn-klussen use everywhere else in this CRM.
 */
export default async function FacturenPage() {
  const user = await requireCrmUser('/admin/facturen');
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('sales_invoices')
    .select('id, invoice_number, issue_date, client_name, client_city, total, status')
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <>
      <PageHead
        title="Facturen"
        sub="Facturen die u zelf opstelt voor een klant — niet de inkoopfacturen van leveranciers."
        actions={
          <Link href="/admin/facturen/nieuw" className={`${ui.btn} ${ui.btnPrimary}`}>
            + Nieuwe factuur
          </Link>
        }
      />

      {error ? (
        <Notice tone="bad">
          Facturen konden niet worden geladen: {error.message}
          {/does not exist|relation/i.test(error.message) && (
            <>
              {' '}
              Voer <code>supabase/migrations/0032_sales_invoices.sql</code> uit.
            </>
          )}
        </Notice>
      ) : !data?.length ? (
        <Card padded>
          <Empty>
            Nog geen facturen.{' '}
            <Link href="/admin/facturen/nieuw">Maak de eerste aan</Link>.
          </Empty>
        </Card>
      ) : (
        <Card>
          <Table
            head={
              <>
                <th>Nummer</th>
                <th>Klant</th>
                <th>Datum</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Totaal</th>
              </>
            }
          >
            {(data as unknown as InvoiceRow[]).map((row) => (
              <tr key={row.id}>
                <td>
                  <Link href={`/admin/facturen/${row.id}`}>{row.invoice_number}</Link>
                </td>
                <td>
                  {row.client_name}
                  {row.client_city && <span className={styles.sub}>{row.client_city}</span>}
                </td>
                <td>{DATE.format(new Date(row.issue_date))}</td>
                <td>
                  <Badge tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</Badge>
                </td>
                <td className={styles.moneyCell}>{MONEY.format(Number(row.total))}</td>
              </tr>
            ))}
          </Table>
        </Card>
      )}
      {user.role === 'monteur' && (
        <Notice tone="info">U ziet hier alleen de facturen die u zelf heeft opgesteld.</Notice>
      )}
    </>
  );
}
