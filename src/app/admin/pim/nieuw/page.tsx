import { requireOfficeUser } from '@/lib/crmSession';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Nieuw Product | Autosleutel24',
};

export default async function NieuwProductPage() {
  await requireOfficeUser('/admin/pim');

  return (
    <main style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '24px' }}>
        <Link href="/admin/pim" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#64748b', textDecoration: 'none', marginBottom: '16px', fontSize: '14px' }}>
          <ArrowLeft size={16} /> Terug naar Master Products
        </Link>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px 0' }}>Nieuw Product Toevoegen</h1>
        <p style={{ margin: 0, color: '#64748b' }}>
          Vul de gegevens in om een nieuw artikel aan de PIM catalogus toe te voegen.
        </p>
      </header>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px' }}>
        {/* Placeholder for Client Component Form */}
        <form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#334155' }}>Internal SKU *</label>
              <input type="text" placeholder="Bv. KEY-VW-GOLF7" style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#334155' }}>Product Type *</label>
              <select style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#fff' }}>
                <option value="smart_key">Smart Key (Keyless)</option>
                <option value="remote">Remote Key (Afstandsbediening)</option>
                <option value="transponder_chip">Transponder Chip</option>
                <option value="shell">Behuizing (Shell)</option>
                <option value="blade">Sleutelblad (Blade)</option>
              </select>
            </div>
          </div>
          
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#334155' }}>Automerk</label>
              <input type="text" placeholder="Bv. Volkswagen" style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#334155' }}>Model</label>
              <input type="text" placeholder="Bv. Golf" style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
            </div>
          </div>

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#334155' }}>FCC ID</label>
              <input type="text" placeholder="Bv. NBG010180T" style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#334155' }}>Transponder Chip</label>
              <input type="text" placeholder="Bv. ID48 Megamos" style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
            </div>
          </div>

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#334155' }}>Inkoopprijs (€)</label>
              <input type="number" step="0.01" placeholder="0.00" style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#334155' }}>Standaard Verkoopprijs (€)</label>
              <input type="number" step="0.01" placeholder="0.00" style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
            </div>
          </div>

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Link href="/admin/pim" style={{ padding: '10px 16px', background: '#f1f5f9', color: '#334155', borderRadius: '6px', textDecoration: 'none', fontWeight: 500 }}>Annuleren</Link>
            <button type="button" style={{ padding: '10px 16px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 500, cursor: 'pointer' }}>Product Opslaan</button>
          </div>
        </form>
      </div>
    </main>
  );
}
