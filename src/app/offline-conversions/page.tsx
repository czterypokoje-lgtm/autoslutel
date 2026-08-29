'use client';

import React, { useEffect, useState } from 'react';

// Map services to Google Ads Conversion Names
const mapServiceToConversion = (service: string) => {
  const s = service.toLowerCase();
  if (s.includes('kwijt') || s.includes('akl')) return 'Job Completed - AKL';
  if (s.includes('open') || s.includes('dichtgevallen')) return 'Job Completed - Open Door';
  if (s.includes('contact') || s.includes('ignition')) return 'Job Completed - Ignition';
  return 'Job Completed - Extra Key';
};

// Map services to generic average values if they haven't typed one
const getSuggestedValue = (conversionName: string) => {
  if (conversionName === 'Job Completed - AKL') return 310;
  if (conversionName === 'Job Completed - Open Door') return 182;
  if (conversionName === 'Job Completed - Ignition') return 320;
  return 206; // Extra Key
};

export default function OfflineConversionsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobValues, setJobValues] = useState<Record<string, number>>({});
  const [conversionNames, setConversionNames] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/export-conversions')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setLeads(data.data);
          // Initialize states
          const vals: Record<string, number> = {};
          const names: Record<string, string> = {};
          
          data.data.forEach((lead: any) => {
            const cName = mapServiceToConversion(lead.service || '');
            names[lead.id] = cName;
            vals[lead.id] = getSuggestedValue(cName);
          });
          
          setJobValues(vals);
          setConversionNames(names);
        }
        setLoading(false);
      });
  }, []);

  const handleDownloadCSV = () => {
    let csv = `Parameters:TimeZone=Europe/Amsterdam\n`;
    csv += `Google Click ID,Conversion Name,Conversion Time,Conversion Value,Conversion Currency\n`;

    leads.forEach(lead => {
      const gclid = lead.gclid || lead.wbraid || lead.gbraid;
      if (!gclid) return;

      const cName = conversionNames[lead.id] || 'Job Completed - Extra Key';
      const cValue = jobValues[lead.id] || 0;
      
      // Format time to yyyy-mm-dd HH:mm:ss for Google Ads
      const date = new Date(lead.created_at);
      const formattedDate = date.toISOString().replace('T', ' ').substring(0, 19);

      csv += `${gclid},${cName},${formattedDate},${cValue},EUR\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `google-ads-offline-conversions-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading leads from Supabase...</div>;

  return (
    <div style={{ padding: '3rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        Google Ads Offline Conversions Generator
      </h1>
      <p style={{ marginBottom: '2rem', color: '#475569' }}>
        Dit systeem haalt automatisch de leads op die via Google Ads zijn binnengekomen (met een GCLID). 
        Pas de definitieve omzet per klus aan en download direct de CSV om in Google Ads te importeren!
      </p>

      {leads.length === 0 ? (
        <div style={{ padding: '2rem', background: '#f8fafc', borderRadius: '8px' }}>
          Geen leads gevonden met een GCLID. Wacht tot er nieuwe leads binnenkomen via Google Ads.
        </div>
      ) : (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '1rem' }}>Datum</th>
                <th style={{ padding: '1rem' }}>Auto & Dienst (Supabase)</th>
                <th style={{ padding: '1rem' }}>Google Ads Conversion Name</th>
                <th style={{ padding: '1rem' }}>Definitieve Omzet (€)</th>
              </tr>
            </thead>
            <tbody>
              {leads.map(lead => (
                <tr key={lead.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '1rem' }}>
                    {new Date(lead.created_at).toLocaleDateString('nl-NL')} <br/>
                    <small style={{ color: '#64748b' }}>{new Date(lead.created_at).toLocaleTimeString('nl-NL')}</small>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <strong>{lead.brand} {lead.model}</strong><br/>
                    <small style={{ color: '#475569' }}>{lead.service}</small>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <select 
                      value={conversionNames[lead.id]}
                      onChange={(e) => setConversionNames({...conversionNames, [lead.id]: e.target.value})}
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
                      onChange={(e) => setJobValues({...jobValues, [lead.id]: parseFloat(e.target.value)})}
                      style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', width: '100px' }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button 
            onClick={handleDownloadCSV}
            style={{ padding: '1rem 2rem', background: '#2563eb', color: '#fff', fontWeight: 'bold', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}
          >
            Download CSV voor Google Ads
          </button>
        </>
      )}
    </div>
  );
}
