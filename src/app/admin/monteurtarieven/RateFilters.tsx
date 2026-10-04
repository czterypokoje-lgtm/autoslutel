'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Download, X } from 'lucide-react';
import { ui } from '../_ui';

/**
 * One search box and two selects.
 *
 * The box searches make, model and technician together, because somebody
 * looking at this screen is thinking "golf" or "mukremin" — not choosing
 * which column to search first.
 */
export default function RateFilters({
  technicians,
  scenarios,
  q,
  monteur,
  dienst,
}: {
  technicians: { id: string; name: string }[];
  scenarios: { id: string; label: string }[];
  q: string;
  monteur: string;
  dienst: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(q);

  const go = (next: { q?: string; monteur?: string; dienst?: string }) => {
    const params = new URLSearchParams();
    const values = { q: search, monteur, dienst, ...next };
    if (values.q) params.set('q', values.q);
    if (values.monteur) params.set('monteur', values.monteur);
    if (values.dienst) params.set('dienst', values.dienst);
    router.push(`/admin/monteurtarieven${params.toString() ? `?${params}` : ''}`);
  };

  const exportUrl = (() => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (monteur) params.set('monteur', monteur);
    if (dienst) params.set('dienst', dienst);
    return `/api/admin/monteurtarieven/export${params.toString() ? `?${params}` : ''}`;
  })();

  const filtered = Boolean(q || monteur || dienst);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        go({ q: search });
      }}
      style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '1.25rem' }}
    >
      <label style={{ flex: '1 1 240px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
          Zoek op auto of monteur
        </div>
        <input
          type="search"
          className={ui.input}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="bijv. golf, peugeot 107, mukremin"
        />
      </label>

      <label>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Monteur</div>
        <select className={ui.input} value={monteur} onChange={(e) => go({ monteur: e.target.value })}>
          <option value="">Alle monteurs</option>
          {technicians.map((tech) => (
            <option key={tech.id} value={tech.id}>
              {tech.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Werk</div>
        <select className={ui.input} value={dienst} onChange={(e) => go({ dienst: e.target.value })}>
          <option value="">Alle soorten</option>
          {scenarios.map((scenario) => (
            <option key={scenario.id} value={scenario.id}>
              {scenario.label}
            </option>
          ))}
        </select>
      </label>

      <button type="submit" className={`${ui.btn} ${ui.btnPrimary}`}>
        <Search size={16} /> Zoek
      </button>

      {filtered && (
        <button type="button" className={ui.btn} onClick={() => { setSearch(''); router.push('/admin/monteurtarieven'); }}>
          <X size={16} /> Wis
        </button>
      )}

      {/* Downloads exactly what is on screen, filters and all — an export
          that quietly returns everything is how two people end up comparing
          different spreadsheets. */}
      <a className={ui.btn} href={exportUrl}>
        <Download size={16} /> Excel
      </a>
    </form>
  );
}
