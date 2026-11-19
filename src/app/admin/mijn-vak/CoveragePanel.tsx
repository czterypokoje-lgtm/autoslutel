'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Wrench } from 'lucide-react';
import styles from '../admin.module.css';
import vak from './vak.module.css';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import type { Scenario } from '@/lib/scenarios';

export interface CoverageEntry {
  id: string;
  make: string;
  model: string | null;
  scenario: Scenario;
  from_year: number | null;
  to_year: number | null;
  excluded: boolean;
  keyless: boolean | null;
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
  tools,
}: {
  technicianId: string;
  tools: ToolEntry[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const addTool = () =>
    run(async () =>
      supabase
        .from('technician_tools')
        .insert({ technician_id: technicianId, brand: toolBrand, model: toolModel.trim() || null })
    );

  const removeTool = (id: string) =>
    run(async () => supabase.from('technician_tools').delete().eq('id', id));

  return (
    <>
      {error && <p className={`${styles.note} ${styles.noteBad}`}>{error}</p>}

      {/* ── tools ── */}
      <h2 className={vak.sectionTitle}>
        <Wrench size={16} strokeWidth={2} aria-hidden="true" />
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
                className={`${styles.iconBtn} ${vak.iconBtn}`}
                aria-label={`${tool.brand} verwijderen`}
                onClick={() => removeTool(tool.id)}
                disabled={busy}
                title="Verwijderen"
              >
                <Trash2 size={15} strokeWidth={1.9} />
              </button>
            </div>
          </div>
        ))}

        <div className={`${styles.row} ${vak.addRow}`}>
          <select className={`${styles.input} ${vak.brandSelect}`} aria-label="Merk gereedschap" value={toolBrand} onChange={(e) => setToolBrand(e.target.value)}>
            {TOOL_BRANDS.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
          <input
            className={`${styles.input} ${vak.modelInput}`}
            aria-label="Model gereedschap"
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

    </>
  );
}
