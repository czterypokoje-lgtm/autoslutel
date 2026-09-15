import { Boxes, PackageCheck, PackageX, TriangleAlert, Warehouse } from 'lucide-react';
import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { stockStatus } from '@/lib/stockStatus';
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
  const outCount = stock.filter((item) => stockStatus(item) === 'out').length;
  const lowCount = stock.filter((item) => stockStatus(item) === 'low').length;
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

      {(outCount > 0 || lowCount > 0) && (
        <Notice tone={outCount > 0 ? 'bad' : 'info'}>
          {[
            outCount > 0 && `${outCount} artikel${outCount === 1 ? ' is' : 'en zijn'} op`,
            lowCount > 0 && `${lowCount} artikel${lowCount === 1 ? '' : 'en'} bijna op`,
          ]
            .filter(Boolean)
            .join(' · ')}
          .
        </Notice>
      )}

      <StatGrid>
        <Stat
          label="Artikelen"
          value={stock.length}
          foot={`${inVan} stuks in totaal`}
          icon={<Boxes size={15} strokeWidth={2} />}
        />
        <Stat
          label="Op"
          value={outCount}
          foot={outCount ? 'geen stuks meer over' : 'niets helemaal op'}
          icon={<PackageX size={15} strokeWidth={2} />}
          tone={outCount ? 'stop' : undefined}
        />
        <Stat
          label="Bijna op"
          value={lowCount}
          foot={lowCount ? 'onder uw eigen minimum' : 'niets onder het minimum'}
          icon={<TriangleAlert size={15} strokeWidth={2} />}
          tone={lowCount ? 'warn' : undefined}
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
