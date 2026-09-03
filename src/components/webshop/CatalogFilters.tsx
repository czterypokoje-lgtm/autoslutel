'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import styles from './CatalogFilters.module.css';
import type { FacetKey, FacetOption } from '@/lib/catalog';

/**
 * Faceted filter sidebar.
 *
 * Two rules drive the design:
 *
 *  1. Facets are contextual. Only ~240 of 2,093 products have a button count,
 *     because most of the catalogue is blades, batteries and lock parts. A
 *     "knoppen" filter on a battery listing is noise, so the server only sends
 *     facets that actually vary within the current result set.
 *
 *  2. Counts are computed excluding that facet's own selection, so picking
 *     "3 knoppen" still shows how many 2- and 4-button products exist. A
 *     facet that collapses to its own selection is a dead end.
 *
 * State lives in the URL, which makes filtered views shareable and lets the
 * server render them. Those URLs are noindex + canonical to the unfiltered
 * category — see the faceted-navigation note in the webshop blueprint.
 */

const GROUP_TITLES: Record<FacetKey, string> = {
  category: 'Categorie',
  subcategory: 'Type',
  make: 'Automerk',
  manufacturer: 'Fabrikant',
  condition: 'Uitvoering',
  buttons: 'Aantal knoppen',
  frequency: 'Frequentie',
  chip: 'Transponder',
  blade: 'Sleutelbaard',
};

/** Long lists collapse; short ones never need to. */
const COLLAPSE_AFTER = 6;

interface Props {
  facets: Record<string, FacetOption[]>;
  /** Order the groups appear in. Vehicle first — it is the real question. */
  order?: FacetKey[];
  resultCount: number;
}

export default function CatalogFilters({
  facets,
  order = ['make', 'category', 'subcategory', 'buttons', 'frequency', 'chip', 'blade', 'condition', 'manufacturer'],
  resultCount,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [closed, setClosed] = useState<Record<string, boolean>>({});

  const active = useMemo(() => {
    const a: Record<string, string> = {};
    for (const k of Object.keys(GROUP_TITLES)) {
      const v = params.get(k);
      if (v) a[k] = v;
    }
    return a;
  }, [params]);

  const activeCount = Object.keys(active).length;

  const setFilter = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (value === null || next.get(key) === value) next.delete(key);
      else next.set(key, value);
      // Any filter change invalidates the page cursor.
      next.delete('page');
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router]
  );

  const clearAll = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  const groups = order.filter((k) => facets[k]?.length);

  if (!groups.length) return null;

  return (
    <aside className={styles.root} aria-label="Filters">
      <div className={styles.head}>
        <span className={styles.count}>
          <strong>{resultCount}</strong> {resultCount === 1 ? 'product' : 'producten'}
        </span>
        {activeCount > 0 && (
          <button type="button" className={styles.clear} onClick={clearAll}>
            Wis alles ({activeCount})
          </button>
        )}
      </div>

      {activeCount > 0 && (
        <div className={styles.chips}>
          {Object.entries(active).map(([k, v]) => {
            const opt = facets[k]?.find((o) => o.value.toLowerCase() === v.toLowerCase());
            return (
              <button
                key={k}
                type="button"
                className={styles.chip}
                onClick={() => setFilter(k, null)}
                aria-label={`${GROUP_TITLES[k as FacetKey]} filter verwijderen`}
              >
                {opt?.label ?? v}
                <span aria-hidden="true">×</span>
              </button>
            );
          })}
        </div>
      )}

      {groups.map((key) => {
        const options = facets[key]!;
        const isOpen = !closed[key];
        const showAll = expanded[key];
        const visible = showAll ? options : options.slice(0, COLLAPSE_AFTER);

        return (
          <section key={key} className={styles.group}>
            <button
              type="button"
              className={styles.groupHead}
              aria-expanded={isOpen}
              onClick={() => setClosed((c) => ({ ...c, [key]: isOpen }))}
            >
              <span className={styles.groupTitle}>{GROUP_TITLES[key]}</span>
              <span className={`${styles.caret} ${isOpen ? styles.caretOpen : ''}`} aria-hidden="true">
                ⌃
              </span>
            </button>

            {isOpen && (
              <>
                <ul className={styles.list}>
                  {visible.map((o) => {
                    const checked = active[key]?.toLowerCase() === o.value.toLowerCase();
                    return (
                      <li key={o.value}>
                        <label className={`${styles.opt} ${checked ? styles.optOn : ''}`}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => setFilter(key, o.value)}
                          />
                          <span className={styles.optLabel}>{o.label}</span>
                          <span className={styles.optCount}>{o.count}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>

                {options.length > COLLAPSE_AFTER && (
                  <button
                    type="button"
                    className={styles.more}
                    onClick={() => setExpanded((e) => ({ ...e, [key]: !showAll }))}
                  >
                    {showAll ? 'Toon minder' : `Toon alle ${options.length}`}
                  </button>
                )}
              </>
            )}
          </section>
        );
      })}

      {/*
        No "Klantbeoordeling" group. The previous sidebar offered "5 stars (64)"
        and "4 stars & up (120)" — counts that were not backed by any review
        data. It comes back when real verified-purchase reviews exist.
      */}
    </aside>
  );
}
