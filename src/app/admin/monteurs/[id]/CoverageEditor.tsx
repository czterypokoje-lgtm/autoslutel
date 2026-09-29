'use client';

import { useMemo, useState } from 'react';
import { CITIES } from '@/config/cities';

/**
 * Where a monteur works, and who they are on the public site.
 *
 * Built around picking cities rather than typing postcode ranges. The ranges
 * are what dispatch matches on (technicians.werkgebied, four digits), but
 * nobody knows that Maastricht is 6211 — so the office ticks towns and the
 * ranges are derived from City.postcode. That single translation is why this
 * screen exists: 66 technicians carry an empty werkgebied, not because the
 * field is unimportant but because filling it meant looking up postcodes.
 *
 * The same pick sets the base: choosing a home town writes base_city and the
 * coordinates behind it, which is what the drive-time estimate on a city page
 * and the per-job fuel cost both measure from.
 */

interface Props {
  technicianId: string;
  initial: {
    werkgebied: string[] | null;
    base_city: string | null;
    base_lat: number | string | null;
    base_lng: number | string | null;
    certifications: string[] | null;
    gbp_url: string | null;
  };
}

const REGION_ORDER = ['Utrecht', 'Noord-Holland', 'Zuid-Holland', 'Gelderland', 'Noord-Brabant', 'Limburg', 'Flevoland'];

export default function CoverageEditor({ technicianId, initial }: Props) {
  /* Seeded by matching each city's postcode against the ranges already
     stored, so an existing werkgebied shows as ticked towns rather than
     being silently replaced on the first save. */
  const [picked, setPicked] = useState<Set<string>>(() => {
    const ranges = initial.werkgebied ?? [];
    const covers = (pc: string) => ranges.some((r) => {
      const [a, b] = r.split('-').map((n) => Number(n.trim()));
      const v = Number(pc);
      return Number.isFinite(a) ? (Number.isFinite(b) ? v >= a && v <= b : v === a) : false;
    });
    return new Set(CITIES.filter((c) => covers(c.postcode)).map((c) => c.slug));
  });

  const [baseSlug, setBaseSlug] = useState(
    () => CITIES.find((c) => c.city === initial.base_city)?.slug ?? ''
  );
  const [certs, setCerts] = useState((initial.certifications ?? []).join(', '));
  const [gbp, setGbp] = useState(initial.gbp_url ?? '');
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const byRegion = useMemo(() => {
    const out = new Map<string, typeof CITIES>();
    for (const c of CITIES) {
      const list = out.get(c.region) ?? [];
      list.push(c);
      out.set(c.region, list);
    }
    return [...out.entries()].sort(
      (a, b) => (REGION_ORDER.indexOf(a[0]) + 99) % 99 - (REGION_ORDER.indexOf(b[0]) + 99) % 99
    );
  }, []);

  /* One range per picked town. Deliberately not merged into spans: 3511 and
     3512 are neighbours, but 3511 and 3599 are not, and a merge would quietly
     hand someone a region they never agreed to cover. */
  const ranges = useMemo(
    () => [...new Set(CITIES.filter((c) => picked.has(c.slug)).map((c) => c.postcode))].sort(),
    [picked]
  );

  const toggle = (slug: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (!next.delete(slug)) next.add(slug);
      return next;
    });

  const pickRegion = (region: string, on: boolean) =>
    setPicked((prev) => {
      const next = new Set(prev);
      for (const c of CITIES) if (c.region === region) on ? next.add(c.slug) : next.delete(c.slug);
      return next;
    });

  async function save() {
    setSaving(true);
    setNote(null);
    const base = CITIES.find((c) => c.slug === baseSlug);
    try {
      const res = await fetch(`/api/admin/technicians/${technicianId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          werkgebied: ranges.join(', '),
          base_city: base?.city ?? null,
          base_lat: base ? Number(base.geo.lat) : null,
          base_lng: base ? Number(base.geo.lng) : null,
          certifications: certs,
          gbp_url: gbp.trim() || null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? 'Opslaan mislukt');
      setNote(`Opgeslagen — ${ranges.length} postcodegebied(en).`);
    } catch (err) {
      setNote(err instanceof Error ? err.message : 'Opslaan mislukt');
    } finally {
      setSaving(false);
    }
  }

  const label: React.CSSProperties = { display: 'block', fontWeight: 600, marginBottom: '0.35rem' };
  const input: React.CSSProperties = {
    width: '100%', padding: '0.55rem 0.7rem', borderRadius: 6,
    border: '1px solid var(--color-border)', fontSize: '0.95rem',
  };

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <div>
        <label style={label} htmlFor="basis">Standplaats</label>
        <select id="basis" style={input} value={baseSlug} onChange={(e) => setBaseSlug(e.target.value)}>
          <option value="">— geen standplaats —</option>
          {CITIES.map((c) => (
            <option key={c.slug} value={c.slug}>{c.city} ({c.region})</option>
          ))}
        </select>
        <p style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginTop: '0.4rem' }}>
          Bepaalt de reistijd die op de stadspagina staat en de brandstofkosten per klus.
        </p>
      </div>

      <div>
        <span style={label}>Werkgebied — vink de steden aan</span>
        <div style={{ display: 'grid', gap: '1rem', maxHeight: 340, overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 8, padding: '0.9rem' }}>
          {byRegion.map(([region, list]) => (
            <div key={region}>
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.35rem' }}>
                <strong style={{ fontSize: '0.9rem' }}>{region}</strong>
                <button type="button" onClick={() => pickRegion(region, true)} style={{ fontSize: '0.75rem', border: 'none', background: 'none', color: 'var(--color-primary)', cursor: 'pointer' }}>alles</button>
                <button type="button" onClick={() => pickRegion(region, false)} style={{ fontSize: '0.75rem', border: 'none', background: 'none', color: 'var(--gray-600)', cursor: 'pointer' }}>geen</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem 0.9rem' }}>
                {list.map((c) => (
                  <label key={c.slug} style={{ fontSize: '0.87rem', display: 'inline-flex', gap: '0.3rem', alignItems: 'center' }}>
                    <input type="checkbox" checked={picked.has(c.slug)} onChange={() => toggle(c.slug)} />
                    {c.city}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginTop: '0.45rem' }}>
          Wordt opgeslagen als postcodegebied: <code>{ranges.join(', ') || '— nog niets gekozen —'}</code>
        </p>
      </div>

      <div>
        <label style={label} htmlFor="certs">Certificeringen</label>
        <input id="certs" style={input} value={certs} onChange={(e) => setCerts(e.target.value)}
               placeholder="Autel IM608 Pro II, AVDI Abrites" />
        <p style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginTop: '0.4rem' }}>
          Komma‑gescheiden. Staat letterlijk op de stadspagina, dus alleen wat klopt.
        </p>
      </div>

      <div>
        <label style={label} htmlFor="gbp">Google-bedrijfsprofiel</label>
        <input id="gbp" style={input} value={gbp} onChange={(e) => setGbp(e.target.value)}
               placeholder="https://maps.app.goo.gl/..." />
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button onClick={save} disabled={saving}
          style={{ padding: '0.7rem 1.5rem', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Opslaan…' : 'Opslaan'}
        </button>
        {note && <span style={{ fontSize: '0.9rem', color: 'var(--gray-700)' }}>{note}</span>}
      </div>
    </div>
  );
}
