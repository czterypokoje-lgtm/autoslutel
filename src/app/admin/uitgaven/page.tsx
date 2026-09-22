import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PageHead, Card, Badge, Empty } from '../_ui';
import Link from 'next/link';
import { Plus, Check, X, Building2, Wrench } from 'lucide-react';
import styles from '../admin.module.css';
import ExpenseActions from './ExpenseActions';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Uitgaven | Autosleutel24',
};

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

const CATEGORIES: Record<string, string> = {
  fuel: 'Brandstof',
  parking: 'Parkeren',
  toll: 'Tol',
  meals: 'Eten & Drinken',
  vehicle_maintenance: 'Voertuig Onderhoud',
  tool_subscription: 'Gereedschap Abonnement',
  phone: 'Telefonie',
  advertising: 'Advertenties',
  supplier: 'Leverancier',
  office: 'Kantoor',
  insurance: 'Verzekeringen',
  rent: 'Huur',
  training: 'Training',
  other: 'Overig'
};

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
    const me = await supabase.from('technicians').select('id').eq('email', user.email).single();
    if (me.data) query = query.eq('technician_id', me.data.id);
  }

  const { data: expenses } = await query;

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
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{CATEGORIES[exp.category] || exp.category}</span>
                  <Badge tone={exp.status === 'approved' || exp.status === 'paid' ? 'ok' : exp.status === 'rejected' ? 'stop' : 'warn'}>
                    {exp.status}
                  </Badge>
                  {exp.is_reimbursable && <Badge>Declaratie</Badge>}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>
                  {exp.date_incurred} • {exp.description}
                </div>
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
                
                {isOffice && exp.status === 'pending' && (
                  <ExpenseActions id={exp.id} />
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}