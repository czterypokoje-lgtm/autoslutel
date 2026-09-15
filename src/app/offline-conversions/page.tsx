'use client';

import React, { useEffect, useState } from 'react';

interface ExportLead {
  id: string;
  created_at: string;
  service: string | null;
  status: string;
  gclid: string | null;
  wbraid: string | null;
  gbraid: string | null;
}

const mapServiceToConversion = (service: string) => {
  const s = service.toLowerCase();
  if (s.includes('kwijt') || s.includes('akl')) return 'Job Completed - AKL';
  if (s.includes('open') || s.includes('dichtgevallen')) return 'Job Completed - Open Door';
  if (s.includes('contact') || s.includes('ignition')) return 'Job Completed - Ignition';
  return 'Job Completed - Extra Key';
};

const getSuggestedValue = (conversionName: string) => {
  if (conversionName === 'Job Completed - AKL') return 310;
  if (conversionName === 'Job Completed - Open Door') return 182;
  if (conversionName === 'Job Completed - Ignition') return 320;
  return 206; // Extra Key
};

function formatDate(iso: string) {
  return new Date(iso).toISOString().replace('T', ' ').substring(0, 19);
}

function clickId(lead: ExportLead) {
  return lead.gclid || lead.wbraid || lead.gbraid || '';
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

export default function OfflineConversionsPage() {
  const [positive, setPositive] = useState<ExportLead[]>([]);
  const [negative, setNegative] = useState<ExportLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobValues, setJobValues] = useState<Record<string, number>>({});
  const [conversionNames, setConversionNames] = useState<Record<string, string>>({});
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    fetch('/api/export-conversions')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setPositive(data.positive || []);
          setNegative(data.negative || []);

          const vals: Record<string, number> = {};
          const names: Record<string, string> = {};
          (data.positive || []).forEach((lead: ExportLead) => {
            const cName = mapServiceToConversion(lead.service || '');
            names[lead.id] = cName;
            vals[lead.id] = getSuggestedValue(cName);
          });
          setJobValues(vals);
          setConversionNames(names);
        } else {
          setError(data.error || 'Onbekende fout');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Kon export niet laden');
        setLoading(false);
      });
  }, []);

  // Marks leads exported_at so a re-run of the export never reports the same
  // click to Google Ads twice, for either the positive or negative CSV.
  const markExported = async (ids: string[]) => {
    if (!ids.length) return;
    setMarking(true);
    try {
      await fetch('/api/export-conversions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
    } finally {
      setMarking(false);
    }
  };

  const handleDownloadPositive = async () => {
    let csv = `Parameters:TimeZone=Europe/Amsterdam\n`;
    csv += `Google Click ID,Conversion Name,Conversion Time,Conversion Value,Conversion Currency\n`;

    const exportedIds: string[] = [];
    positive.forEach((lead) => {
      const gclid = clickId(lead);
      if (!gclid) return;
      const cName = conversionNames[lead.id] || 'Job Completed - Extra Key';
      const cValue = jobValues[lead.id] || 0;
      csv += `${gclid},${cName},${formatDate(lead.created_at)},${cValue},EUR\n`;
      exportedIds.push(lead.id);
    });

    downloadCsv(`google-ads-conversions-${new Date().toISOString().split('T')[0]}.csv`, csv);
    await markExported(exportedIds);
    setPositive((prev) => prev.filter((l) => !exportedIds.includes(l.id)));
  };

  const handleDownloadNegative = async () => {
    let csv = `Parameters:TimeZone=Europe/Amsterdam\n`;
    csv += `Google Click ID,Conversion Name,Conversion Time,Adjustment Type,Adjustment Time\n`;

    const exportedIds: string[] = [];
    negative.forEach((lead) => {
      const gclid = clickId(lead);
      if (!gclid) return;
      const cName = mapServiceToConversion(lead.service || '');
      const now = formatDate(new Date().toISOString());
      csv += `${gclid},${cName},${formatDate(lead.created_at)},RETRACTION,${now}\n`;
      exportedIds.push(lead.id);
    });

    downloadCsv(`google-ads-adjustments-${new Date().toISOString().split('T')[0]}.csv`, csv);
    await markExported(exportedIds);
    setNegative((prev) => prev.filter((l) => !exportedIds.includes(l.id)));
  };

  if (loading) return <div style={{ padding: '2rem' }}>Leads laden...</div>;
  if (error) return <div style={{ padding: '2rem', color: '#b91c1c' }}>{error}</div>;

  return (
    <div style={{ padding: '3rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
        Google Ads Offline Conversions
      </h1>
      <p style={{ marginBottom: '2rem', color: '#475569' }}>
        Alleen leads die het CRM al als <strong>gekwalificeerd</strong> of <strong>verkocht</strong> heeft
        gemarkeerd worden als conversie geëxporteerd. Leads gemarkeerd als <strong>spam</strong> of{' '}
        <strong>dubbel</strong> staan hieronder apart — die klik was nooit een echte conversie, en Google Ads moet
        dat ook weten zodat Smart Bidding niet blijft zoeken naar meer klikken zoals die.
      </p>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.75rem' }}>
          Positieve conversies ({positive.length})
        </h2>

        {positive.length === 0 ? (
          <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '8px', color: '#64748b' }}>
            Geen nieuwe gekwalificeerde/verkochte leads met een GCLID om te exporteren.
          </div>
        ) : (
          <>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginBottom: '1rem',
                background: '#fff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '1rem' }}>Datum</th>
                  <th style={{ padding: '1rem' }}>Dienst</th>
                  <th style={{ padding: '1rem' }}>Status</th>
                  <th style={{ padding: '1rem' }}>Google Ads Conversion Name</th>
                  <th style={{ padding: '1rem' }}>Omzet (€)</th>
                </tr>
              </thead>
              <tbody>
                {positive.map((lead) => (
                  <tr key={lead.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '1rem' }}>
                      {new Date(lead.created_at).toLocaleDateString('nl-NL')} <br />
                      <small style={{ color: '#64748b' }}>{new Date(lead.created_at).toLocaleTimeString('nl-NL')}</small>
                    </td>
                    <td style={{ padding: '1rem' }}>{lead.service}</td>
                    <td style={{ padding: '1rem', textTransform: 'capitalize' }}>{lead.status}</td>
                    <td style={{ padding: '1rem' }}>
                      <select
                        value={conversionNames[lead.id]}
                        onChange={(e) => setConversionNames({ ...conversionNames, [lead.id]: e.target.value })}
                        style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', width: '100%' }}
                      >
                        <option value="Job Completed - AKL">Job Completed - AKL</option>
                        <option value="Job Completed - Open Door">Job Completed - Open Door</option>
                        <option value="Job Completed - Extra Key">Job Completed - Extra Key</option>
                        <option value="Job Completed - Ignition">Job Completed - Ignition</option>
                      </select>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <input
                        type="number"
                        value={jobValues[lead.id]}
                        onChange={(e) => setJobValues({ ...jobValues, [lead.id]: parseFloat(e.target.value) })}
                        style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', width: '100px' }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button
              onClick={handleDownloadPositive}
              disabled={marking}
              style={{
                padding: '1rem 2rem',
                background: '#2563eb',
                color: '#fff',
                fontWeight: 'bold',
                borderRadius: '8px',
                border: 'none',
                cursor: marking ? 'default' : 'pointer',
                fontSize: '1.1rem',
                opacity: marking ? 0.6 : 1,
              }}
            >
              Download conversie-CSV
            </button>
          </>
        )}
      </section>

      <section>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.75rem' }}>
          Terugtrekken als spam/dubbel ({negative.length})
        </h2>
        <p style={{ marginBottom: '1rem', color: '#475569', fontSize: '0.95rem' }}>
          Dit importeer je in Google Ads onder <strong>Conversies → Aanpassingen</strong> (adjustments), niet bij de
          gewone conversie-import. Zo vertel je Google Ads dat deze klik geen echte conversie was.
        </p>

        {negative.length === 0 ? (
          <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '8px', color: '#64748b' }}>
            Geen nieuwe spam/dubbele leads met een GCLID om terug te trekken.
          </div>
        ) : (
          <>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginBottom: '1rem',
                background: '#fff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              <thead>
                <tr style={{ background: '#fef2f2', borderBottom: '2px solid #fecaca', textAlign: 'left' }}>
                  <th style={{ padding: '1rem' }}>Datum</th>
                  <th style={{ padding: '1rem' }}>Dienst</th>
                  <th style={{ padding: '1rem' }}>Status</th>
                  <th style={{ padding: '1rem' }}>Click ID</th>
                </tr>
              </thead>
              <tbody>
                {negative.map((lead) => (
                  <tr key={lead.id} style={{ borderBottom: '1px solid #fecaca' }}>
                    <td style={{ padding: '1rem' }}>{new Date(lead.created_at).toLocaleDateString('nl-NL')}</td>
                    <td style={{ padding: '1rem' }}>{lead.service}</td>
                    <td style={{ padding: '1rem', textTransform: 'capitalize', color: '#b91c1c', fontWeight: 600 }}>
                      {lead.status}
                    </td>
                    <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                      {clickId(lead).slice(0, 24)}…
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button
              onClick={handleDownloadNegative}
              disabled={marking}
              style={{
                padding: '1rem 2rem',
                background: '#b91c1c',
                color: '#fff',
                fontWeight: 'bold',
                borderRadius: '8px',
                border: 'none',
                cursor: marking ? 'default' : 'pointer',
                fontSize: '1.1rem',
                opacity: marking ? 0.6 : 1,
              }}
            >
              Download adjustment-CSV
            </button>
          </>
        )}
      </section>
    </div>
  );
}
