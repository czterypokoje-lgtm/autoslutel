'use client';

import { useEffect } from 'react';

/**
 * Scrolls the day grid to a sensible hour on load.
 *
 * A plain inline `<script>` looked like the cheaper option, but it only ever
 * runs once, on the very first HTML parse. Next's own client-side navigation
 * between dates (the Vorige/Volgende/Vandaag links) patches the DOM without
 * a page load, so the script never fires again and every date after the
 * first stayed scrolled wherever the last one left off. A small client
 * component's effect re-runs on every prop change instead, which is exactly
 * "every time the date changes."
 */
export default function GridAutoScroll({ gridId, hour, hourHeight }: { gridId: string; hour: number; hourHeight: number }) {
  useEffect(() => {
    document.getElementById(gridId)?.scrollTo({ top: hour * hourHeight });
  }, [gridId, hour, hourHeight]);

  return null;
}
