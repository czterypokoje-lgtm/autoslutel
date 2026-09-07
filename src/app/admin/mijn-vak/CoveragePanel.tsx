'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Wrench, Car } from 'lucide-react';
import styles from '../admin.module.css';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { SCENARIOS, SCENARIO_INFO, type Scenario } from '@/lib/scenarios';

export interface CoverageEntry {
  id: string;
  make: string;
  model: string | null;
  scenario: Scenario;
  from_year: number | null;
  to_year: number | null;
  excluded: boolean;
}

export interface ToolEntry {
  id: string;
  brand: string;
  model: string | null;
  note: string | null;
}

/** The tool brands worth listing, which are the ones we sell. */
const TOOL_BRANDS = ['Xhorse', 'OBDSTAR', 'Autel', 'Zed-FULL', 'Lonsdor', 'KeyDIY', 'Keyline', 'Silca', 'Anders'];

/**
 * Declaring what you can do.
 *
 * Written straight to Supabase from the browser rather than through an API
 * route: RLS on technician_coverage already scopes every row to the caller's
 * own technician id, so a route would add a hop and re-implement the same
 * check less carefully.
 *
 * A make with no model means the whole make. "Uitgesloten" inverts one row, so
 * "alle Volkswagens behalve de Touareg" is two rows instead of a list of every
 * Volkswagen that is not a Touareg.
 */
export default function CoveragePanel({
  technicianId,
  makes,
  coverage,
  tools,
}: {
  technicianId: string;
  makes: string[];
  coverage: CoverageEntry[];
  tools: ToolEntry[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [make, setMake] = useState(makes[0] ?? '');
  const [model, setModel] = useState('');
  const [scenario, setScenario] = useState<Scenario>('bijmaken');
  const [fromYear, setFromYear] = useState('');
  const [excluded, setExcluded] = useState(false);

  const [toolBrand, setToolBrand] = useState(TOOL_BRANDS[0]);
  const [toolModel, setToolModel] = useState('');

  const supabase = createSupabaseBrowserClient();

  async function run(work: () => Promise<{ error: { message: string } | null }>) {
    setBusy(true);
    setError(null);
    const { error: failed } = await work();
    setBusy(false);
    if (failed) {
      setError(
        /does not exist|relation/i.test(failed.message)
          ? 'De tabellen bestaan nog niet — voer supabase/migrations/0013_technician_platform.sql uit.'
          : failed.message
      );
      return;
    }
    router.refresh();
  }

  const addCoverage = () =>
    run(async () =>
      supabase.from('technician_coverage').upsert(
        {
          technician_id: technicianId,
          make,
          model: model.trim() || null,
          scenario,
          from_year: fromYear ? Number(fromYear) : null,
          excluded,
        },
        { onConflict: 'technician_id,make,model,scenario' }
      )
    );

  const removeCoverage = (id: string) =>
    run(async () => supabase.from('technician_coverage').delete().eq('id', id));

  const addTool = () =>
    run(async () =>
      supabase
        .from('technician_tools')
        .insert({ technician_id: technicianId, brand: toolBrand, model: toolModel.trim() || null })
    );

  const removeTool = (id: string) =>
    run(async () => supabase.from('technician_tools').delete().eq('id', id));

  /* Group by make so a technician with forty rows can still read them. */
  const byMake = new Map<string, CoverageEntry[]>();
  for (const row of coverage) {
    const list = byMake.get(row.make) ?? [];
    list.push(row);
    byMake.set(row.make, list);
  }

  return (
    <>
      {error && <p className={`${styles.note} ${styles.noteBad}`}>{error}</p>}

      {/* ── tools ── */}
      <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--crm-ink)', margin: '26px 0 10px' }}>
        <Wrench size={15} strokeWidth={2} style={{ verticalAlign: -2, marginRight: 7 }} />
        Gereedschap in de bus
      </h2>

      <div className={styles.listCard}>
        {tools.length === 0 && (
          <div className={styles.empty}>Nog geen gereedschap opgegeven.</div>
        )}
        {tools.map((tool) => (
          <div className={styles.row} key={tool.id}>
            <div className={styles.rowMain}>
              <div className={styles.rowTitleLine}>
                <span className={styles.rowTitle}>{tool.brand}</span>
                {tool.model && <span className={styles.rowSlug}>{tool.model}</span>}
              </div>
            </div>
            <div className={styles.rowActions}>
              <button
                className={styles.iconBtn}
                style={{ borderRadius: 'var(--crm-r)', border: '1px solid var(--crm-rule2)' }}
                onClick={() => removeTool(tool.id)}
                disabled={busy}
                title="Verwijderen"
              >
                <Trash2 size={15} strokeWidth={1.9} />
              </button>
            </div>
          </div>
        ))}

        <div className={styles.row} style={{ gap: 8, flexWrap: 'wrap' }}>
          <select className={styles.input} style={{ width: 150 }} value={toolBrand} onChange={(e) => setToolBrand(e.target.value)}>
            {TOOL_BRANDS.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
          <input
            className={styles.input}
            style={{ width: 200 }}
            placeholder="Model, bijv. IM608 Pro"
            value={toolModel}
            onChange={(e) => setToolModel(e.target.value)}
          />
          <button className={styles.primaryBtn} onClick={addTool} disabled={busy}>
            <Plus size={15} strokeWidth={2.2} />
            Toevoegen
          </button>
        </div>
      </div>

      {/* ── coverage ── */}
      <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--crm-ink)', margin: '30px 0 10px' }}>
        <Car size={15} strokeWidth={2} style={{ verticalAlign: -2, marginRight: 7 }} />
        Welke auto’s u aankunt
      </h2>
      <p className={styles.pageSub} style={{ marginBottom: 12 }}>
        Leeg modelveld betekent het hele merk. Zet “uitgesloten” aan om één model uit te zonderen
        dat u liever niet doet.
      </p>

      <div className={styles.listCard}>
        {coverage.length === 0 && (
          <div className={styles.empty}>
            Nog niets opgegeven — u krijgt op dit moment geen klussen aangeboden.
          </div>
        )}

        {[...byMake].map(([makeName, rows]) => (
          <div className={styles.row} key={makeName}>
            <div className={styles.rowMain}>
              <div className={styles.rowTitleLine}>
                <span className={styles.rowTitle}>{makeName}</span>
              </div>
              <div className={styles.rowMeta}>
                {rows.map((row) => (
                  <span
                    key={row.id}
                    className={`${styles.chip} ${row.excluded ? styles.chipStop : styles.chipOk}`}
                    title={row.excluded ? 'Dit doet u niet' : 'Dit doet u wel'}
                  >
                    {row.model ? `${row.model} · ` : ''}
                    {SCENARIO_INFO[row.scenario].label}
                    {row.from_year ? ` vanaf ${row.from_year}` : ''}
                    <button
                      onClick={() => removeCoverage(row.id)}
                      disabled={busy}
                      aria-label="Verwijderen"
                      style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, marginLeft: 2 }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}

        <div className={styles.row} style={{ gap: 8, flexWrap: 'wrap' }}>
          <select className={styles.input} style={{ width: 150 }} value={make} onChange={(e) => setMake(e.target.value)}>
            {makes.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
          <input
            className={styles.input}
            style={{ width: 150 }}
            placeholder="Model (leeg = alles)"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          />
          <select
            className={styles.input}
            style={{ width: 190 }}
            value={scenario}
            onChange={(e) => setScenario(e.target.value as Scenario)}
          >
            {SCENARIOS.map((s) => (
              <option key={s} value={s}>
                {SCENARIO_INFO[s].label}
              </option>
            ))}
          </select>
          <input
            className={styles.input}
            style={{ width: 110 }}
            placeholder="vanaf jaar"
            inputMode="numeric"
            value={fromYear}
            onChange={(e) => setFromYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <input type="checkbox" checked={excluded} onChange={(e) => setExcluded(e.target.checked)} />
            uitgesloten
          </label>
          <button className={styles.primaryBtn} onClick={addCoverage} disabled={busy}>
            <Plus size={15} strokeWidth={2.2} />
            Toevoegen
          </button>
        </div>
      </div>
    </>
  );
}
