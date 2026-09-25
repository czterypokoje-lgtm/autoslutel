const fs = require('fs');
const path = require('path');

// 1. Update AdminNav.tsx
let nav = fs.readFileSync('src/app/admin/AdminNav.tsx', 'utf8');

if (!nav.includes('/admin/uitgaven')) {
  // Add to Beheer group for Office
  nav = nav.replace(
    "{ href: '/admin/facturen', label: 'Facturen', icon: Receipt },",
    "{ href: '/admin/facturen', label: 'Facturen', icon: Receipt },\n      { href: '/admin/uitgaven', label: 'Uitgaven', icon: Receipt }," // wait, receipt is used. Let's use Wallet or Banknote. Wait, kas uses Wallet. Let's import Banknote.
  );
  
  // Need to import Banknote if not imported.
  if (!nav.includes('Banknote')) {
    nav = nav.replace(
      "BadgeCheck,",
      "BadgeCheck,\n  Banknote,"
    );
  }
  
  nav = nav.replace(
    "{ href: '/admin/uitgaven', label: 'Uitgaven', icon: Receipt },",
    "{ href: '/admin/uitgaven', label: 'Uitgaven', icon: Banknote },"
  );

  // Add to Mijzelf group for Monteur
  nav = nav.replace(
    "{ href: '/admin/facturen', label: 'Facturen', icon: Receipt },",
    "{ href: '/admin/facturen', label: 'Facturen', icon: Receipt },\n      { href: '/admin/uitgaven', label: 'Mijn uitgaven', icon: Banknote },"
  );

  fs.writeFileSync('src/app/admin/AdminNav.tsx', nav);
}

// 2. Create Uitgaven Page
const uitgavenDir = path.join(process.cwd(), 'src/app/admin/uitgaven');
if (!fs.existsSync(uitgavenDir)) fs.mkdirSync(uitgavenDir, { recursive: true });

const pageTsx = `import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PageHead, Card, Badge, Empty, MONEY } from '../_ui';
import Link from 'next/link';
import { Plus, Check, X, Building2, Wrench } from 'lucide-react';
import styles from '../admin.module.css';
import ExpenseActions from './ExpenseActions';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Uitgaven | Autosleutel24',
};

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
                  <Badge tone={exp.status === 'approved' || exp.status === 'paid' ? 'ok' : exp.status === 'rejected' ? 'bad' : 'warn'}>
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
}`;

fs.writeFileSync(path.join(uitgavenDir, 'page.tsx'), pageTsx);

// 3. Create ExpenseActions (Client Component for approve/reject)
const expenseActionsTsx = `'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X } from 'lucide-react';
import { ui } from '../_ui';

export default function ExpenseActions({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function update(status: 'approved' | 'rejected') {
    setBusy(true);
    await fetch(\`/api/admin/expenses/\${id}\`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    router.refresh();
    setBusy(false);
  }

  return (
    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', justifyContent: 'flex-end' }}>
      <button 
        className={ui.btn} 
        style={{ padding: '0.25rem 0.5rem', color: '#059669', borderColor: '#a7f3d0' }}
        onClick={() => update('approved')}
        disabled={busy}
      >
        <Check size={14} /> Goedkeuren
      </button>
      <button 
        className={ui.btn} 
        style={{ padding: '0.25rem 0.5rem', color: '#dc2626', borderColor: '#fecaca' }}
        onClick={() => update('rejected')}
        disabled={busy}
      >
        <X size={14} /> Afwijzen
      </button>
    </div>
  );
}`;
fs.writeFileSync(path.join(uitgavenDir, 'ExpenseActions.tsx'), expenseActionsTsx);
