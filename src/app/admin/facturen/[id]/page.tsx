import { notFound } from 'next/navigation';
import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import PrintButton from './PrintButton';
import styles from './invoice.module.css';

export const dynamic = 'force-dynamic';

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const DATE = new Intl.DateTimeFormat('nl-NL', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'Europe/Amsterdam',
});

interface InvoiceLine {
  id: string;
  description: string;
  quantity: number | string;
  unit_price: number | string;
  discount: number | string;
  vat_rate: number | string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  issue_date: string;
  biller_name: string;
  biller_street: string | null;
  biller_postcode: string | null;
  biller_city: string | null;
  biller_country: string;
  biller_email: string | null;
  biller_phone: string | null;
  biller_kvk: string | null;
  biller_btw: string | null;
  biller_iban: string | null;
  client_name: string;
  client_street: string | null;
  client_postcode: string | null;
  client_city: string | null;
  client_country: string;
  client_email: string | null;
  client_phone: string | null;
  client_btw: string | null;
  credit_applied: number | string;
  notes: string | null;
  subtotal: number | string;
  vat_total: number | string;
  total: number | string;
  status: 'concept' | 'verzonden' | 'betaald';
  paid_at: string | null;
}

/**
 * The invoice itself — a page meant to be printed or saved as a PDF, not
 * just read on screen. Deliberately white regardless of the CRM's dark theme
 * (an admin-nav frame is fine on screen and absent from every print stylesheet
 * anyway): this is the one page in the CRM a customer might actually see.
 */
export default async function FactuurPage({ params }: { params: Promise<{ id: string }> }) {
  await requireCrmUser('/admin/facturen');
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const [{ data: invoice, error }, { data: lines }] = await Promise.all([
    supabase.from('sales_invoices').select('*').eq('id', id).maybeSingle(),
    supabase
      .from('sales_invoice_lines')
      .select('id, description, quantity, unit_price, discount, vat_rate')
      .eq('invoice_id', id)
      .order('line_no'),
  ]);

  if (error || !invoice) notFound();

  const inv = invoice as unknown as Invoice;
  const rows = (lines ?? []) as unknown as InvoiceLine[];
  const credit = Number(inv.credit_applied) || 0;

  return (
    <div className={styles.page}>
      <PrintButton invoiceId={inv.id} status={inv.status} />

      <div className={styles.sheet} id="invoice-sheet">
        <div className={styles.top}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt={inv.biller_name} className={styles.logo} />
          <div className={styles.topRight}>
            <h1 className={styles.h1}>Factuur {inv.invoice_number}</h1>
            <p className={styles.issueDate}>
              Datum van uitgifte: <strong>{DATE.format(new Date(inv.issue_date))}</strong>
            </p>
          </div>
        </div>

        <div className={styles.parties}>
          <Party
            name={inv.biller_name}
            street={inv.biller_street}
            postcode={inv.biller_postcode}
            city={inv.biller_city}
            country={inv.biller_country}
            email={inv.biller_email}
            phone={inv.biller_phone}
            kvk={inv.biller_kvk}
            btw={inv.biller_btw}
            iban={inv.biller_iban}
            align="left"
          />
          <Party
            name={inv.client_name}
            street={inv.client_street}
            postcode={inv.client_postcode}
            city={inv.client_city}
            country={inv.client_country}
            email={inv.client_email}
            phone={inv.client_phone}
            btw={inv.client_btw}
            align="right"
          />
        </div>

        <table className={styles.lines}>
          <thead>
            <tr>
              <th className={styles.left}>Beschrijving</th>
              <th>Aantal</th>
              <th className={styles.right}>Prijs</th>
              <th className={styles.right}>Korting</th>
              <th className={styles.right}>Btw</th>
              <th className={styles.right}>Totaal</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((line) => {
              const base = Number(line.quantity) * Number(line.unit_price) - Number(line.discount);
              return (
                <tr key={line.id}>
                  <td className={styles.left}>{line.description}</td>
                  <td>{line.quantity}</td>
                  <td className={styles.right}>{MONEY.format(Number(line.unit_price))}</td>
                  <td className={styles.right}>
                    {Number(line.discount) > 0 ? MONEY.format(Number(line.discount)) : '—'}
                  </td>
                  <td className={styles.right}>{Number(line.vat_rate)}%</td>
                  <td className={styles.right}>{MONEY.format(base)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className={styles.totalsRow}>
          <div className={styles.notes}>{inv.notes && <p>{inv.notes}</p>}</div>
          <div className={styles.totals}>
            <TotalLine label="Subtotaal" value={MONEY.format(Number(inv.subtotal))} />
            <TotalLine
              label={`Totaal btw`}
              value={MONEY.format(Number(inv.vat_total))}
            />
            <TotalLine
              label="Totaal (EUR)"
              value={MONEY.format(Number(inv.subtotal) + Number(inv.vat_total))}
              rule
            />
            {credit > 0 && (
              <TotalLine label={`Credit toegepast op ${DATE.format(new Date(inv.issue_date))}`} value={MONEY.format(credit)} />
            )}
            <TotalLine label="Totaal verschuldigd (EUR)" value={MONEY.format(Number(inv.total))} final />
            {inv.status === 'betaald' && inv.paid_at && (
              <p className={styles.paidNote}>Betaald op {DATE.format(new Date(inv.paid_at))}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Party({
  name,
  street,
  postcode,
  city,
  country,
  email,
  phone,
  kvk,
  btw,
  iban,
  align,
}: {
  name: string;
  street: string | null;
  postcode: string | null;
  city: string | null;
  country: string;
  email: string | null;
  phone: string | null;
  kvk?: string | null;
  btw: string | null;
  iban?: string | null;
  align: 'left' | 'right';
}) {
  return (
    <div className={align === 'right' ? styles.partyRight : styles.party}>
      <p className={styles.partyName}>{name}</p>
      {street && <p>{street}</p>}
      {(postcode || city) && (
        <p>
          {city} {postcode}
        </p>
      )}
      <p>{country}</p>
      {(email || phone) && (
        <p className={styles.partyGap}>
          {email}
          {email && phone && <br />}
          {phone}
        </p>
      )}
      {(kvk || btw || iban) && (
        <p className={styles.partyGap}>
          {kvk && (
            <>
              KVK: <span className={styles.dim}>{kvk}</span>
              <br />
            </>
          )}
          {btw && (
            <>
              BTW: <span className={styles.dim}>{btw}</span>
              {iban && <br />}
            </>
          )}
          {iban && (
            <>
              IBAN: <span className={styles.dim}>{iban}</span>
            </>
          )}
        </p>
      )}
    </div>
  );
}

function TotalLine({
  label,
  value,
  rule,
  final,
}: {
  label: string;
  value: string;
  rule?: boolean;
  final?: boolean;
}) {
  return (
    <div className={final ? styles.totalFinal : rule ? styles.totalRuled : styles.total}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
