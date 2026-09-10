import { Boxes, PackageCheck, TriangleAlert, Warehouse } from 'lucide-react';
import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PageHead, StatGrid, Stat, Notice } from '../_ui';
import BusDashboard from './BusDashboard';
import InvoicePanel, { type InvoiceRow } from './InvoicePanel';

export const dynamic = 'force-dynamic';

export default async function MijnBusPage() {
  const user = await requireCrmUser('/admin/mijn-bus');
  const supabase = await createSupabaseServerClient();

  if (user.role !== 'monteur') {
    return (
      <>
        <PageHead title="Mijn bus" sub="Alleen monteurs hebben een bus." />
        <Notice>
          Gebruik de kantoorschermen voor de centrale voorraad.
        </Notice>
      </>
    );
  }

  const { data: tech } = await supabase
    .from('technicians')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!tech) {
    return (
      <>
        <PageHead title="Mijn bus" />
        <Notice tone="bad">Uw login is nog niet aan een monteur gekoppeld.</Notice>
      </>
    );
  }

  const [{ data: myStock }, { data: centralStock }, { data: otherTechs }, { data: invoices }] =
    await Promise.all([
      supabase.from('stock_items').select('*').eq('technician_id', tech.id).order('description'),
      supabase.from('stock_items').select('*').is('technician_id', null).order('description'),
      supabase.from('technicians').select('id, name').neq('id', tech.id).order('name'),
      supabase
        .from('purchase_invoices')
        .select(
          'id, supplier, invoice_number, invoice_date, file_url, status, created_at, purchase_invoice_lines (id, description, article_code, quantity, unit_price, matched_slug, confirmed)'
        )
        .eq('technician_id', tech.id)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

  const stock = myStock ?? [];
  const inVan = stock.reduce((total, item) => total + Number(item.quantity ?? 0), 0);
  /*
   * "Bijna op" is what min_quantity is for: a part sitting at or under the
   * level the technician set is the one that will not be there next week.
   */
  const low = stock.filter(
    (item) => Number(item.min_quantity ?? 0) > 0 && Number(item.quantity ?? 0) <= Number(item.min_quantity)
  ).length;
  const value = stock.reduce(
    (total, item) => total + Number(item.quantity ?? 0) * Number(item.unit_cost ?? 0),
    0
  );

  const rows: InvoiceRow[] = (invoices ?? []).map((invoice) => ({
    id: invoice.id,
    supplier: invoice.supplier,
    invoice_number: invoice.invoice_number,
    invoice_date: invoice.invoice_date,
    file_url: invoice.file_url,
    status: invoice.status,
    created_at: invoice.created_at,
    lines: ((invoice.purchase_invoice_lines ?? []) as InvoiceRow['lines']).sort((a, b) =>
      a.description.localeCompare(b.description)
    ),
  }));

  return (
    <>
      <PageHead
        title="Mijn bus"
        sub="Wat er nu in uw bus ligt. Haal uit het magazijn, geef door aan een collega, of upload een inkoopfactuur om alles in één keer bij te schrijven."
      />

      <StatGrid>
        <Stat
          label="Artikelen"
          value={stock.length}
          foot={`${inVan} stuks in totaal`}
          icon={<Boxes size={15} strokeWidth={2} />}
        />
        <Stat
          label="Bijna op"
          value={low}
          foot={low ? 'onder uw eigen minimum' : 'niets onder het minimum'}
          icon={<TriangleAlert size={15} strokeWidth={2} />}
          tone={low ? 'warn' : undefined}
        />
        <Stat
          label="Inkoopwaarde"
          value={`€ ${value.toFixed(2).replace('.', ',')}`}
          foot="op basis van wat u betaalde"
          icon={<PackageCheck size={15} strokeWidth={2} />}
        />
        <Stat
          label="In het magazijn"
          value={(centralStock ?? []).length}
          foot="soorten om uit te halen"
          icon={<Warehouse size={15} strokeWidth={2} />}
        />
      </StatGrid>

      <InvoicePanel invoices={rows} />

      <BusDashboard
        myStock={stock}
        centralStock={centralStock ?? []}
        otherTechs={otherTechs ?? []}
      />
    </>
  );
}
