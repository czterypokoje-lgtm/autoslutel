const fs = require('fs');
const path = require('path');

// 1. Create API
const apiDir = path.join(process.cwd(), 'src/app/api/admin/expenses/[id]');
if (!fs.existsSync(apiDir)) fs.mkdirSync(apiDir, { recursive: true });

const apiTsx = `import { NextRequest, NextResponse } from 'next/server';
import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireCrmUser();
  if (user.role === 'monteur') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const body = await req.json();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from('expenses')
    .update({ 
      status: body.status, 
      approved_by: user.id 
    })
    .eq('id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}`;
fs.writeFileSync(path.join(apiDir, 'route.ts'), apiTsx);

// Add POST api
const apiRoot = path.join(process.cwd(), 'src/app/api/admin/expenses');
if (!fs.existsSync(apiRoot)) fs.mkdirSync(apiRoot, { recursive: true });
const postTsx = `import { NextRequest, NextResponse } from 'next/server';
import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const user = await requireCrmUser();
  const body = await req.json();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from('expenses')
    .insert({
      category: body.category,
      description: body.description,
      amount: body.amount,
      date_incurred: body.date_incurred,
      technician_id: body.technician_id || null,
      is_reimbursable: body.is_reimbursable || false,
      created_by: user.id,
      status: 'pending'
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}`;
fs.writeFileSync(path.join(apiRoot, 'route.ts'), postTsx);


// 2. Create Nieuw Form
const nieuwDir = path.join(process.cwd(), 'src/app/admin/uitgaven/nieuw');
if (!fs.existsSync(nieuwDir)) fs.mkdirSync(nieuwDir, { recursive: true });

const nieuwPageTsx = `import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PageHead } from '../../_ui';
import ExpenseForm from './ExpenseForm';

export const dynamic = 'force-dynamic';

export default async function NieuweUitgavePage() {
  const user = await requireCrmUser('/admin/uitgaven/nieuw');
  const supabase = await createSupabaseServerClient();
  const isOffice = user.role !== 'monteur';

  let myTechId = null;
  if (!isOffice) {
    const me = await supabase.from('technicians').select('id').eq('email', user.email).single();
    if (me.data) myTechId = me.data.id;
  }

  const { data: technicians } = await supabase.from('technicians').select('id, name').eq('active', true);

  return (
    <>
      <PageHead
        title="Nieuwe Uitgave"
        sub="Registreer een bedrijfskost of dien een bonnetje in voor declaratie."
      />
      <ExpenseForm 
        technicians={technicians || []} 
        isOffice={isOffice} 
        myTechId={myTechId} 
      />
    </>
  );
}`;
fs.writeFileSync(path.join(nieuwDir, 'page.tsx'), nieuwPageTsx);


const formTsx = `'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ui } from '../../_ui';

const CATEGORIES = [
  { id: 'fuel', label: 'Brandstof' },
  { id: 'parking', label: 'Parkeren' },
  { id: 'toll', label: 'Tol' },
  { id: 'meals', label: 'Eten & Drinken' },
  { id: 'vehicle_maintenance', label: 'Voertuig Onderhoud' },
  { id: 'tool_subscription', label: 'Gereedschap Abonnement' },
  { id: 'phone', label: 'Telefonie' },
  { id: 'advertising', label: 'Advertenties' },
  { id: 'supplier', label: 'Leverancier' },
  { id: 'office', label: 'Kantoor' },
  { id: 'insurance', label: 'Verzekeringen' },
  { id: 'rent', label: 'Huur' },
  { id: 'training', label: 'Training' },
  { id: 'other', label: 'Overig' }
];

export default function ExpenseForm({ technicians, isOffice, myTechId }: { technicians: any[], isOffice: boolean, myTechId: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [category, setCategory] = useState('fuel');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dateIncurred, setDateIncurred] = useState(new Date().toISOString().split('T')[0]);
  const [technicianId, setTechnicianId] = useState(isOffice ? '' : myTechId || '');
  const [isReimbursable, setIsReimbursable] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');

    const numAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Voer een geldig bedrag in.');
      setBusy(false);
      return;
    }

    const res = await fetch('/api/admin/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category,
        description,
        amount: numAmount,
        date_incurred: dateIncurred,
        technician_id: technicianId || null,
        is_reimbursable: isReimbursable
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setError(err.error || 'Opslaan mislukt');
      setBusy(false);
      return;
    }

    router.push('/admin/uitgaven');
    router.refresh();
  }

  return (
    <form onSubmit={save} style={{ maxWidth: 600, background: '#fff', padding: '2rem', borderRadius: 8, border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'grid', gap: '1.5rem' }}>
        
        <label>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Categorie</div>
          <select value={category} onChange={e => setCategory(e.target.value)} className={ui.input} required>
            {CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </label>

        <label>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Bedrag (€)</div>
          <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className={ui.input} required placeholder="0.00" />
        </label>

        <label>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Datum</div>
          <input type="date" value={dateIncurred} onChange={e => setDateIncurred(e.target.value)} className={ui.input} required />
        </label>

        <label>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Omschrijving</div>
          <input type="text" value={description} onChange={e => setDescription(e.target.value)} className={ui.input} required placeholder="bijv. Tanken BP, Google Ads factuur..." />
        </label>

        {isOffice && (
          <label>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Gekoppelde Monteur (optioneel)</div>
            <select value={technicianId} onChange={e => setTechnicianId(e.target.value)} className={ui.input}>
              <option value="">-- Algemeen / Kantoor --</option>
              {technicians.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </label>
        )}

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={isReimbursable} onChange={e => setIsReimbursable(e.target.checked)} />
          <span style={{ fontSize: 14, color: '#334155' }}>
            Dit is een declaratie (ik heb dit privé voorgeschoten en wil het terug).
          </span>
        </label>

        {error && <div style={{ color: '#dc2626', fontSize: 14 }}>{error}</div>}

        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
          <button type="button" onClick={() => router.back()} className={ui.btn} disabled={busy}>Annuleren</button>
          <button type="submit" className={\`\${ui.btn} \${ui.btnPrimary}\`} disabled={busy}>
            {busy ? 'Opslaan...' : 'Opslaan'}
          </button>
        </div>

      </div>
    </form>
  );
}`;
fs.writeFileSync(path.join(nieuwDir, 'ExpenseForm.tsx'), formTsx);

