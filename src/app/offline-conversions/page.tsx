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
  /** Revenue from finished jobs on this lead. Null when there is none yet. */
  job_value?: number | null;
  job_count?: number;
  /** When the work was finished — the moment the conversion actually happened. */
  conversion_time?: string | null;
}

/**
 * The Google Ads account has exactly one offline-conversion action, named
 * literally "Job Completed" (id 7780523985, type UPLOAD_CLICKS) — Google
 * matches an import by exact name, so this is the only string that may ever
 * go in the CSV's Conversion Name column. It used to be suffixed per service
 * ("Job Completed - AKL" etc.), which meant every row failed to import.
 */
const GOOGLE_ADS_CONVERSION_NAME = 'Job Completed';

/** Internal-only categorisation, used purely to suggest a starting job value below. */
const categorizeService = (service: string) => {
  const s = service.toLowerCase();
  if (s.includes('kwijt') || s.includes('akl')) return 'AKL';
  if (s.includes('open') || s.includes('dichtgevallen')) return 'Open Door';
  if (s.includes('contact') || s.includes('ignition')) return 'Ignition';
  return 'Extra Key';
};

const getSuggestedValue = (category: string) => {
  if (category === 'AKL') return 310;
  if (category === 'Open Door') return 182;
  if (category === 'Ignition') return 320;
  return 206; // Extra Key
};

/**
 * The timestamp format Google Ads accepts, in the timezone the file declares.
 *
 * Both halves of that matter and both were wrong. The CSV header says
 * `Parameters:TimeZone=Europe/Amsterdam`, but this returned UTC — so every
 * conversion was reported two hours earlier than it happened (an hour in
 * winter). And an ISO string with a `T` or a `+00:00` offset is rejected
 * outright: "The value '2026-09-19 17:22:21+00:00' in column 'Conversion Time'
 * is invalid."
 *
 * 'sv-SE' is the shortest way to get `YYYY-MM-DD HH:mm:ss` out of
 * toLocaleString, and it honours the timeZone option, so the value matches the
 * header instead of contradicting it.
 */
function formatDate(iso: string) {
  return new Date(iso).toLocaleString('sv-SE', { timeZone: 'Europe/Amsterdam' });
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
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    fetch('/api/export-conversions')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setPositive(data.positive || []);
          setNegative(data.negative || []);

          const vals: Record<string, number> = {};
          /*
           * Prefill the value from what the job actually earned.
           *
           * It used to start empty and fall back to 0 on download, so an
           * export done quickly told Google every one of these clicks was
           * worth nothing — worse than sending no value, because it teaches
           * Smart Bidding this traffic has no worth. Still editable: the
           * figure is a starting point, not a lock.
           */
          /*
           * One pass, and the real figure wins.
           *
           * This used to be two passes: the first wrote the actual invoice
           * value from the linked job, the second wrote a per-service average
           * and called setJobValues again — throwing the real number away one
           * line after fetching it. Nobody noticed because no lead is linked
           * to a job yet, so both passes produced the same averages. The
           * moment jobs.lead_id is populated it would have silently reported
           * estimates as revenue.
           */
          (data.positive || []).forEach((lead: ExportLead) => {
            const category = categorizeService(lead.service || '');
            vals[lead.id] =
              lead.job_value != null && lead.job_value > 0
                ? lead.job_value
                : getSuggestedValue(category);
          });
          setJobValues(vals);
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

  // Marks rows exported_at so a re-run of the export never reports the same
  // click to Google Ads twice. `kind` tells the route which table the ids
  // belong to — positive ids are jobs, negative ids are leads.
  const markExported = async (ids: string[], kind: 'positive' | 'negative') => {
    if (!ids.length) return;
    setMarking(true);
    try {
      await fetch('/api/export-conversions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, kind }),
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
      /*
       * An unknown value is left blank, not written as 0. Google treats an
       * empty Conversion Value as "no value supplied" and a 0 as "this was
       * worth nothing" — and the second is a lie that Smart Bidding acts on.
       */
      const known = jobValues[lead.id];
      const cValue = Number.isFinite(known) && known > 0 ? String(known) : '';
      /* The conversion happened when the work finished, not when the form came in. */
      const when = formatDate(lead.conversion_time || lead.created_at);
      csv += `${gclid},${GOOGLE_ADS_CONVERSION_NAME},${when},${cValue},EUR\n`;
      exportedIds.push(lead.id);
    });

    downloadCsv(`google-ads-conversions-${new Date().toISOString().split('T')[0]}.csv`, csv);
    await markExported(exportedIds, 'positive');
    setPositive((prev) => prev.filter((l) => !exportedIds.includes(l.id)));
  };

  const handleDownloadNegative = async () => {
    let csv = `Parameters:TimeZone=Europe/Amsterdam\n`;
    csv += `Google Click ID,Conversion Name,Conversion Time,Adjustment Type,Adjustment Time\n`;

    const exportedIds: string[] = [];
    negative.forEach((lead) => {
      const gclid = clickId(lead);
      if (!gclid) return;
      const now = formatDate(new Date().toISOString());
      /*
       * RETRACT, not RETRACTION. Google's adjustment types are RETRACT,
       * RESTATE and ENHANCEMENT; the longer word was rejected on every row
       * — "The value 'RETRACTION' in column 'Adjustment Type' is invalid."
       * It went unnoticed because no adjustments file had ever been uploaded.
       */
      csv += `${gclid},${GOOGLE_ADS_CONVERSION_NAME},${formatDate(lead.created_at)},RETRACT,${now}\n`;
      exportedIds.push(lead.id);
    });

    downloadCsv(`google-ads-adjustments-${new Date().toISOString().split('T')[0]}.csv`, csv);
    await markExported(exportedIds, 'negative');
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
