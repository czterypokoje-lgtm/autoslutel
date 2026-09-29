import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PageHead, Card, Badge, Empty } from '../_ui';
import Link from 'next/link';
import { Plus, Building2, Wrench, Receipt } from 'lucide-react';
import styles from '../admin.module.css';
import ExpenseActions from './ExpenseActions';
import { EXPENSE_CATEGORIES } from '@/lib/expenseCaption';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Uitgaven | Autosleutel24',
};

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

export default async function UitgavenPage() {
  const user = await requireCrmUser('/admin/uitgaven');
  const supabase = await createSupabaseServerClient();
  const isOffice = user.role !== 'monteur';

  let query = supabase
    .from('expenses')
    .select('*, technician:technician_id(name), job:job_id(customer_name)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (!isOffice) {
    const me = await supabase.from('technicians').select('id').eq('user_id', user.id).single();
    if (me.data) query = query.eq('technician_id', me.data.id);
  }

  const { data: expenses } = await query;

  /*
   * The `facturen` bucket is private on purpose — a bon carries a supplier, a
   * place and what somebody paid. One signed link per receipt, made here and
   * valid for the hour this page is likely to stay open, rather than a public
   * URL that would outlive the page in a browser history.
   */
  const paths = (expenses ?? []).map(e => e.receipt_url).filter(Boolean) as string[];
  const receipts = new Map<string, string>();
  if (paths.length) {
    const { data: signed } = await supabase.storage.from('facturen').createSignedUrls(paths, 3600);
    for (const entry of signed ?? []) {
      if (entry.path && entry.signedUrl) receipts.set(entry.path, entry.signedUrl);
    }
  }

  return (
    <>
      <PageHead
        title={isOffice ? "Alle Uitgaven" : "Mijn Uitgaven"}
        sub={isOffice ? "Beheer en keur bedrijfskosten, abonnementen en declaraties goed." : "Dien bonnetjes in en volg de status van je declaraties."}
        actions={
          <Link href="/admin/uitgaven/nieuw" className="btn btn-primary">
            <Plus size={16} />
            Nieuwe uitgave
          </Link>
        }
      />

      <div className={styles.cards}>
        {!expenses?.length && <Empty>Nog geen uitgaven geregistreerd.</Empty>}

        {expenses?.map(exp => (
          <Card key={exp.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{EXPENSE_CATEGORIES[exp.category] || exp.category}</span>
                  <Badge tone={exp.status === 'approved' || exp.status === 'paid' ? 'ok' : exp.status === 'rejected' ? 'stop' : 'warn'}>
                    {exp.status}
                  </Badge>
                  {exp.is_reimbursable && <Badge>Declaratie</Badge>}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>
                  {exp.date_incurred} • {exp.description}
                </div>
                {exp.receipt_url && receipts.has(exp.receipt_url) && (
                  <a
                    href={receipts.get(exp.receipt_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', color: '#2563eb', marginBottom: '0.5rem' }}
                  >
                    <Receipt size={14} /> Bon bekijken
                  </a>
                )}
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#475569' }}>
                  {exp.technician && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Wrench size={14} /> {exp.technician.name}
                    </span>
                  )}
                  {!exp.technician && isOffice && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Building2 size={14} /> Kantoor
                    </span>
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: '1.25rem', color: '#0f172a' }}>
                  {MONEY.format(exp.amount)}
                </div>
                
                {/* Whatever the status. An approved expense with a wrong
                    amount was previously untouchable — the row showed the
                    mistake and offered nothing to do about it. */}
                {isOffice && (
                  <ExpenseActions
                    expense={{
                      id: exp.id,
                      category: exp.category,
                      description: exp.description,
                      amount: exp.amount,
                      date_incurred: exp.date_incurred,
                      supplier_name: exp.supplier_name ?? null,
                      is_reimbursable: exp.is_reimbursable === true,
                      status: exp.status,
                    }}
                  />
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}